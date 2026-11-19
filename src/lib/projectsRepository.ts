import { isSupabaseConfigured, supabase } from './supabaseClient';
import {
  INITIAL_PROJECTS,
  PROJECT_CATEGORIES,
  type PortfolioProject,
  type ProjectCategory,
  type ProjectImage,
} from '../data/landingData';

const STORAGE_KEY = 'abdullah_portfolio_projects_v1';

export interface CreateProjectInput {
  title: string;
  client: string;
  category: ProjectCategory;
  timeframe: string;
  metricValue: string;
  metricContext: string;
  summary: string;
}

function getCategoryLabel(category: ProjectCategory): string {
  return (
    PROJECT_CATEGORIES.find((item) => item.id === category)?.label ||
    'تصوير ومحتوى'
  );
}

/**
 * Compresses an uploaded image file cleanly in the browser for local fallback storage
 * while keeping crisp visual quality (max 1400px width, JPEG 0.85).
 */
async function compressImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('تعذر قراءة ملف الصورة.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('الملف المحدد ليس صورة صالحة.'));
      img.onload = () => {
        const maxWidth = 1400;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.84));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function readLocalProjects(): PortfolioProject[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PROJECTS));
      return INITIAL_PROJECTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return INITIAL_PROJECTS;
  } catch {
    return INITIAL_PROJECTS;
  }
}

function writeLocalProjects(projects: PortfolioProject[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    throw new Error(
      'مساحة التخزين المحلية ممتلئة؛ يرجى حذف بعض الصور أو تقليل حجمها.'
    );
  }
}

export async function fetchProjects(): Promise<PortfolioProject[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('projects')
      .select(
        `
        id,
        title,
        client,
        category,
        category_label,
        timeframe,
        metric_value,
        metric_context,
        summary,
        created_at,
        project_images (
          id,
          url,
          storage_path,
          caption,
          sort_order
        )
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`تعذر تحميل المشاريع من قاعدة البيانات: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      client: row.client,
      category: row.category as ProjectCategory,
      categoryLabel: row.category_label || getCategoryLabel(row.category),
      timeframe: row.timeframe || '',
      metricValue: row.metric_value || '',
      metricContext: row.metric_context || '',
      summary: row.summary || '',
      images: (row.project_images || [])
        .slice()
        .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((img: any) => ({
          id: img.id,
          url: img.url,
          storagePath: img.storage_path || '',
          caption: img.caption || '',
        })),
    }));
  }

  return readLocalProjects();
}

async function uploadFilesToSupabase(
  projectId: string,
  files: File[],
  startOrder: number
): Promise<ProjectImage[]> {
  if (!supabase) return [];
  const uploaded: ProjectImage[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${projectId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('project-media')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`فشل رفع الصورة (${file.name}): ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from('project-media')
      .getPublicUrl(fileName);

    const { data: insertedImage, error: rowError } = await supabase
      .from('project_images')
      .insert({
        project_id: projectId,
        url: publicUrlData.publicUrl,
        storage_path: fileName,
        caption: file.name.replace(/\.[^/.]+$/, ''),
        sort_order: startOrder + i,
      })
      .select()
      .single();

    if (rowError) {
      throw new Error(`فشل حفظ بيانات الصورة: ${rowError.message}`);
    }

    uploaded.push({
      id: insertedImage.id,
      url: insertedImage.url,
      storagePath: insertedImage.storage_path,
      caption: insertedImage.caption,
    });
  }

  return uploaded;
}

export async function createProject(
  input: CreateProjectInput,
  files: File[]
): Promise<PortfolioProject> {
  const categoryLabel = getCategoryLabel(input.category);

  if (isSupabaseConfigured && supabase) {
    const { data: inserted, error } = await supabase
      .from('projects')
      .insert({
        title: input.title.trim(),
        client: input.client.trim(),
        category: input.category,
        category_label: categoryLabel,
        timeframe: input.timeframe.trim(),
        metric_value: input.metricValue.trim(),
        metric_context: input.metricContext.trim(),
        summary: input.summary.trim(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`تعذر إنشاء المشروع: ${error.message}`);
    }

    const images = await uploadFilesToSupabase(inserted.id, files, 0);

    return {
      id: inserted.id,
      title: inserted.title,
      client: inserted.client,
      category: inserted.category,
      categoryLabel: inserted.category_label,
      timeframe: inserted.timeframe,
      metricValue: inserted.metric_value,
      metricContext: inserted.metric_context,
      summary: inserted.summary,
      images,
    };
  }

  const projectId = `proj_${Date.now()}`;
  const images: ProjectImage[] = [];
  for (let i = 0; i < files.length; i++) {
    const dataUrl = await compressImageToDataUrl(files[i]);
    images.push({
      id: `img_${Date.now()}_${i}`,
      url: dataUrl,
      caption: files[i].name.replace(/\.[^/.]+$/, ''),
    });
  }

  const newProject: PortfolioProject = {
    id: projectId,
    title: input.title.trim(),
    client: input.client.trim(),
    category: input.category,
    categoryLabel,
    timeframe: input.timeframe.trim() || 'حديث',
    metricValue: input.metricValue.trim() || 'حملة مكتملة',
    metricContext: input.metricContext.trim() || 'إنتاج ونشر عبر المنصات',
    summary: input.summary.trim(),
    images,
  };

  const current = readLocalProjects();
  writeLocalProjects([newProject, ...current]);
  return newProject;
}

export async function addImagesToProject(
  projectId: string,
  files: File[],
  existingCount: number
): Promise<ProjectImage[]> {
  if (isSupabaseConfigured && supabase) {
    return uploadFilesToSupabase(projectId, files, existingCount);
  }

  const newImages: ProjectImage[] = [];
  for (let i = 0; i < files.length; i++) {
    const dataUrl = await compressImageToDataUrl(files[i]);
    newImages.push({
      id: `img_${Date.now()}_${i}`,
      url: dataUrl,
      caption: files[i].name.replace(/\.[^/.]+$/, ''),
    });
  }

  const current = readLocalProjects();
  const updated = current.map((project) =>
    project.id === projectId
      ? { ...project, images: [...project.images, ...newImages] }
      : project
  );
  writeLocalProjects(updated);
  return newImages;
}

export async function deleteProjectImage(
  projectId: string,
  imageId: string,
  storagePath?: string
): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    if (storagePath) {
      await supabase.storage.from('project-media').remove([storagePath]);
    }
    const { error } = await supabase
      .from('project_images')
      .delete()
      .eq('id', imageId);
    if (error) {
      throw new Error(`تعذر حذف الصورة: ${error.message}`);
    }
    return;
  }

  const current = readLocalProjects();
  const updated = current.map((project) =>
    project.id === projectId
      ? {
          ...project,
          images: project.images.filter((img) => img.id !== imageId),
        }
      : project
  );
  writeLocalProjects(updated);
}

export async function deleteProject(project: PortfolioProject): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const storagePaths = project.images
      .map((img) => img.storagePath)
      .filter((p): p is string => Boolean(p));

    if (storagePaths.length > 0) {
      await supabase.storage.from('project-media').remove(storagePaths);
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', project.id);

    if (error) {
      throw new Error(`تعذر حذف المشروع: ${error.message}`);
    }
    return;
  }

  const current = readLocalProjects();
  writeLocalProjects(current.filter((item) => item.id !== project.id));
}
