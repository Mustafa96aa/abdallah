import { isSupabaseConfigured, supabase } from './supabaseClient';
import {
  INITIAL_PROJECTS,
  PROJECT_CATEGORIES,
  type PortfolioProject,
  type ProjectCategory,
  type ProjectImage,
} from '../data/landingData';

const STORAGE_KEY = 'abdullah_portfolio_projects_v1';
const BUCKET = 'project-media';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SOURCE_BYTES = 20 * 1024 * 1024; // أقصى حجم للصورة الأصلية قبل الضغط
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // نفس حد الـ bucket في schema.sql

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

/* ----------------------------- معالجة الصور ----------------------------- */

function assertValidImage(file: File): void {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`الملف (${file.name}) غير مدعوم. المسموح: JPG وPNG وWEBP وGIF.`);
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error(`الملف (${file.name}) كبير جداً. الحد الأقصى ٢٠ ميغابايت.`);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('الملف المحدد ليس صورة صالحة.'));
    img.src = src;
  });
}

/**
 * يصغّر الصورة (حتى 1600px عرضاً) ويضغطها بصيغة JPEG قبل الرفع،
 * فلا تُرفع صور الموبايل الأصلية الثقيلة.
 */
async function compressImage(file: File, maxWidth = 1600, quality = 0.85): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const scale = img.width > maxWidth ? maxWidth / img.width : 1;
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    // خلفية بيضاء حتى لا تصبح شفافية PNG سوداء عند التحويل إلى JPEG
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality)
    );
    if (!blob) return file;
    if (scale === 1 && blob.size >= file.size) return file;
    return blob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function extensionFor(blob: Blob): string {
  switch (blob.type) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'jpg';
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('تعذر قراءة ملف الصورة.'));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

function captionFromFile(file: File): string {
  return file.name.replace(/\.[^/.]+$/, '');
}

/* ----------------------- التخزين المحلي (بدون Supabase) ----------------------- */

function readLocalProjects(): PortfolioProject[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PROJECTS));
      return INITIAL_PROJECTS;
    }
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as PortfolioProject[];
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

async function filesToLocalImages(files: File[]): Promise<ProjectImage[]> {
  const images: ProjectImage[] = [];
  for (let i = 0; i < files.length; i++) {
    assertValidImage(files[i]);
    const blob = await compressImage(files[i]);
    images.push({
      id: `img_${Date.now()}_${i}`,
      url: await blobToDataUrl(blob),
      caption: captionFromFile(files[i]),
    });
  }
  return images;
}

/* ------------------------------ Supabase ------------------------------ */

async function removeFromStorage(paths: string[]): Promise<void> {
  if (!supabase || paths.length === 0) return;
  try {
    await supabase.storage.from(BUCKET).remove(paths);
  } catch (err) {
    // فشل حذف الملف لا يجب أن يمنع بقية العملية
    console.warn('تعذر حذف ملفات من التخزين:', err);
  }
}

/**
 * يرفع الصور ويسجّلها في قاعدة البيانات. إذا فشلت أي خطوة يتم التراجع عن كل
 * ما رُفع في هذه العملية، فلا تبقى ملفات أو صفوف يتيمة.
 */
async function uploadFilesToSupabase(
  projectId: string,
  files: File[],
  startOrder: number
): Promise<ProjectImage[]> {
  if (!supabase) return [];
  const client = supabase;
  const uploaded: ProjectImage[] = [];
  const uploadedPaths: string[] = [];
  const insertedIds: string[] = [];

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      assertValidImage(file);

      const blob = await compressImage(file);
      if (blob.size > MAX_UPLOAD_BYTES) {
        throw new Error(`حجم الصورة (${file.name}) كبير جداً حتى بعد الضغط.`);
      }

      const path = `${projectId}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${extensionFor(blob)}`;

      const { error: uploadError } = await client.storage
        .from(BUCKET)
        .upload(path, blob, {
          cacheControl: '31536000',
          contentType: blob.type || 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`فشل رفع الصورة (${file.name}): ${uploadError.message}`);
      }
      uploadedPaths.push(path);

      const { data: publicUrlData } = client.storage.from(BUCKET).getPublicUrl(path);

      const { data: insertedImage, error: rowError } = await client
        .from('project_images')
        .insert({
          project_id: projectId,
          url: publicUrlData.publicUrl,
          storage_path: path,
          caption: captionFromFile(file),
          sort_order: startOrder + i,
        })
        .select()
        .single();

      if (rowError || !insertedImage) {
        throw new Error(`فشل حفظ بيانات الصورة: ${rowError?.message ?? 'غير معروف'}`);
      }
      insertedIds.push(insertedImage.id);

      uploaded.push({
        id: insertedImage.id,
        url: insertedImage.url,
        storagePath: insertedImage.storage_path,
        caption: insertedImage.caption,
      });
    }
    return uploaded;
  } catch (err) {
    try {
      if (insertedIds.length > 0) {
        await client.from('project_images').delete().in('id', insertedIds);
      }
    } catch {
      /* تجاهل: الأولوية لإظهار الخطأ الأصلي */
    }
    await removeFromStorage(uploadedPaths);
    throw err;
  }
}

/* ------------------------------ الواجهة العامة ------------------------------ */

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export async function createProject(
  input: CreateProjectInput,
  files: File[]
): Promise<PortfolioProject> {
  const categoryLabel = getCategoryLabel(input.category);

  if (isSupabaseConfigured && supabase) {
    const client = supabase;

    const { data: inserted, error } = await client
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

    if (error || !inserted) {
      throw new Error(`تعذر إنشاء المشروع: ${error?.message ?? 'غير معروف'}`);
    }

    let images: ProjectImage[];
    try {
      images = await uploadFilesToSupabase(inserted.id, files, 0);
    } catch (err) {
      // لا نترك مشروعاً ناقصاً في قاعدة البيانات إذا فشل رفع الصور
      await client.from('projects').delete().eq('id', inserted.id);
      throw err;
    }

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

  const images = await filesToLocalImages(files);

  const newProject: PortfolioProject = {
    id: `proj_${Date.now()}`,
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

  const newImages = await filesToLocalImages(files);
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
    // نحذف صف قاعدة البيانات أولاً: لو فشل لا نخسر الملف
    const { data, error } = await supabase
      .from('project_images')
      .delete()
      .eq('id', imageId)
      .select('id');

    if (error) {
      throw new Error(`تعذر حذف الصورة: ${error.message}`);
    }
    if (!data || data.length === 0) {
      throw new Error('لم يتم الحذف. تأكد أنك مسجّل الدخول بحساب المدير.');
    }
    if (storagePath) {
      await removeFromStorage([storagePath]);
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

    const { data, error } = await supabase
      .from('projects')
      .delete()
      .eq('id', project.id)
      .select('id');

    if (error) {
      throw new Error(`تعذر حذف المشروع: ${error.message}`);
    }
    if (!data || data.length === 0) {
      throw new Error('لم يتم الحذف. تأكد أنك مسجّل الدخول بحساب المدير.');
    }
    await removeFromStorage(storagePaths);
    return;
  }

  const current = readLocalProjects();
  writeLocalProjects(current.filter((item) => item.id !== project.id));
}
