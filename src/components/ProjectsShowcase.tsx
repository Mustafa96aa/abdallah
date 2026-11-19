import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  AlertCircle,
  ArrowUpLeft,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Lock,
  LogOut,
  Plus,
  SlidersHorizontal,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  PROJECT_CATEGORIES,
  TESTIMONIAL,
  type PortfolioProject,
  type ProjectCategory,
} from '../data/landingData';
import {
  addImagesToProject,
  createProject,
  deleteProject,
  deleteProjectImage,
  fetchProjects,
} from '../lib/projectsRepository';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { ResilientImage } from './ResilientImage';

interface ProjectsShowcaseProps {
  onRequestConsultation: (prefillContext?: string) => void;
}

type FilterOption = 'all' | ProjectCategory;

interface PendingFilePreview {
  file: File;
  previewUrl: string;
}

export function ProjectsShowcase({ onRequestConsultation }: ProjectsShowcaseProps) {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [isManageMode, setIsManageMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!isSupabaseConfigured);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newClient, setNewClient] = useState('');
  const [newCategory, setNewCategory] = useState<ProjectCategory>('photography');
  const [newTimeframe, setNewTimeframe] = useState('');
  const [newMetricValue, setNewMetricValue] = useState('');
  const [newMetricContext, setNewMetricContext] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [pendingFiles, setPendingFiles] = useState<PendingFilePreview[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);

  const [galleryBusy, setGalleryBusy] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [confirmDeleteProjectId, setConfirmDeleteProjectId] = useState<string | null>(null);

  const addMoreInputRef = useRef<HTMLInputElement | null>(null);
  const createFileInputRef = useRef<HTMLInputElement | null>(null);

  const loadAllProjects = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const list = await fetchProjects();
      setProjects(list);
    } catch (err: any) {
      setLoadError(err?.message || 'تعذر تحميل المشاريع حالياً.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllProjects();

    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data }) => {
        setIsAuthenticated(Boolean(data.session));
      });
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        const loggedIn = Boolean(session);
        setIsAuthenticated(loggedIn);
        if (!loggedIn) {
          setIsManageMode(false);
        }
      });
      return () => listener.subscription.unsubscribe();
    }
  }, []);

  const selectedProject =
    projects.find((p) => p.id === selectedProjectId) || null;

  useEffect(() => {
    if (selectedProject && activeImageIndex >= selectedProject.images.length) {
      setActiveImageIndex(Math.max(0, selectedProject.images.length - 1));
    }
  }, [selectedProject, activeImageIndex]);

  const filteredProjects =
    activeFilter === 'all'
      ? projects
      : projects.filter((item) => item.category === activeFilter);

  const handleToggleManageMode = () => {
    if (isSupabaseConfigured && !isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setIsManageMode((prev) => !prev);
    setConfirmDeleteProjectId(null);
  };

  const handleSupabaseLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setAuthError(null);
    setAuthLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail.trim(),
        password: authPassword,
      });
      if (error) {
        setAuthError('بيانات الدخول غير صحيحة. يرجى التحقق من البريد وكلمة المرور.');
        return;
      }
      setShowAuthModal(false);
      setIsManageMode(true);
      setAuthPassword('');
    } catch {
      setAuthError('حدث خطأ أثناء تسجيل الدخول.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setIsManageMode(false);
  };

  const handleCreateFilesSelected = (e: ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const added: PendingFilePreview[] = Array.from(fileList).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPendingFiles((prev) => [...prev, ...added]);
    setCreateError(null);
    if (createFileInputRef.current) {
      createFileInputRef.current.value = '';
    }
  };

  const handleRemovePendingFile = (index: number) => {
    setPendingFiles((prev) => {
      const target = prev[index];
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleResetCreateForm = () => {
    pendingFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setPendingFiles([]);
    setNewTitle('');
    setNewClient('');
    setNewCategory('photography');
    setNewTimeframe('');
    setNewMetricValue('');
    setNewMetricContext('');
    setNewSummary('');
    setCreateError(null);
  };

  const handleCreateProjectSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newClient.trim()) {
      setCreateError('يرجى كتابة عنوان المشروع واسم العميل.');
      return;
    }
    if (pendingFiles.length === 0) {
      setCreateError('يرجى اختيار صورة واحدة على الأقل للمشروع.');
      return;
    }

    setIsSubmittingProject(true);
    setCreateError(null);
    try {
      const created = await createProject(
        {
          title: newTitle,
          client: newClient,
          category: newCategory,
          timeframe: newTimeframe,
          metricValue: newMetricValue,
          metricContext: newMetricContext,
          summary: newSummary,
        },
        pendingFiles.map((item) => item.file)
      );

      setProjects((prev) => [created, ...prev]);
      handleResetCreateForm();
      setShowCreateModal(false);
    } catch (err: any) {
      setCreateError(err?.message || 'تعذر حفظ المشروع، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmittingProject(false);
    }
  };

  const handleAddImagesToExisting = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!selectedProject || !e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    if (addMoreInputRef.current) {
      addMoreInputRef.current.value = '';
    }

    setGalleryBusy(true);
    setGalleryError(null);
    try {
      const addedImages = await addImagesToProject(
        selectedProject.id,
        files,
        selectedProject.images.length
      );
      setProjects((prev) =>
        prev.map((proj) =>
          proj.id === selectedProject.id
            ? { ...proj, images: [...proj.images, ...addedImages] }
            : proj
        )
      );
      setActiveImageIndex(selectedProject.images.length);
    } catch (err: any) {
      setGalleryError(err?.message || 'تعذر رفع الصور الإضافية.');
    } finally {
      setGalleryBusy(false);
    }
  };

  const handleDeleteSingleImage = async (
    projectId: string,
    imageId: string,
    storagePath?: string
  ) => {
    setGalleryBusy(true);
    setGalleryError(null);
    try {
      await deleteProjectImage(projectId, imageId, storagePath);
      setProjects((prev) =>
        prev.map((proj) =>
          proj.id === projectId
            ? {
                ...proj,
                images: proj.images.filter((img) => img.id !== imageId),
              }
            : proj
        )
      );
    } catch (err: any) {
      setGalleryError(err?.message || 'تعذر حذف الصورة.');
    } finally {
      setGalleryBusy(false);
    }
  };

  const handleDeleteEntireProject = async (project: PortfolioProject) => {
    setGalleryBusy(true);
    setGalleryError(null);
    try {
      await deleteProject(project);
      setProjects((prev) => prev.filter((item) => item.id !== project.id));
      if (selectedProjectId === project.id) {
        setSelectedProjectId(null);
      }
      setConfirmDeleteProjectId(null);
    } catch (err: any) {
      setGalleryError(err?.message || 'تعذر حذف المشروع.');
    } finally {
      setGalleryBusy(false);
    }
  };

  const openProjectLightbox = (projectId: string) => {
    setSelectedProjectId(projectId);
    setActiveImageIndex(0);
    setGalleryError(null);
    setConfirmDeleteProjectId(null);
  };

  return (
    <section
      id="projects"
      className="py-20 lg:py-28 bg-[#4A0819] text-white border-b border-white/15"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Section Header + Management Action */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-rose-200 mb-3">معرض الأعمال والمشاريع</p>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-white tracking-tight text-balance">
              أعمال مختارة في التصوير وإدارة الصفحات والحملات الممولة.
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
            {isManageMode && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#5E0B22] bg-white hover:bg-rose-50 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة مشروع جديد</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleManageMode}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-white ${
                isManageMode
                  ? 'bg-[#360512] text-white border-white/30'
                  : 'bg-white/10 text-white border-white/25 hover:bg-white/20'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>{isManageMode ? 'إنهاء تعديل المعرض' : 'إدارة المشاريع والصور'}</span>
            </button>

            {isSupabaseConfigured && isAuthenticated && isManageMode && (
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium text-rose-100 hover:text-white bg-white/10 border border-white/20 rounded-xl cursor-pointer whitespace-nowrap"
              >
                <LogOut className="w-4 h-4" />
                <span>خروج</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="mb-10">
          <div
            role="tablist"
            aria-label="تصفية المشاريع"
            className="inline-flex flex-wrap items-center gap-1 p-1.5 bg-[#360512] border border-white/10 rounded-xl"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeFilter === 'all'}
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-white text-[#5E0B22] shadow-xs'
                  : 'text-rose-100 hover:text-white'
              }`}
            >
              جميع الأعمال
            </button>
            {PROJECT_CATEGORIES.map((cat) => {
              const active = activeFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveFilter(cat.id)}
                  className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-white text-[#5E0B22] shadow-xs'
                      : 'text-rose-100 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading / Error / Empty / Projects Grid */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-white/15 bg-[#5E0B22] overflow-hidden animate-pulse"
              >
                <div className="aspect-[4/3] bg-[#6D102A]" />
                <div className="p-7 space-y-3">
                  <div className="h-3 bg-white/20 rounded w-1/2" />
                  <div className="h-5 bg-white/20 rounded w-5/6" />
                  <div className="h-4 bg-white/10 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="p-8 rounded-2xl border border-white/20 bg-[#360512] text-center space-y-4">
            <div className="inline-flex items-center gap-2 text-rose-200 font-semibold text-sm">
              <AlertCircle className="w-5 h-5" />
              <span>{loadError}</span>
            </div>
            <div>
              <button
                type="button"
                onClick={loadAllProjects}
                className="px-5 py-2.5 text-sm font-semibold text-[#5E0B22] bg-white hover:bg-rose-50 rounded-xl cursor-pointer"
              >
                إعادة المحاولة
              </button>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-12 rounded-2xl border border-white/15 bg-[#5E0B22] text-center space-y-4">
            <p className="text-base font-medium text-rose-100">
              لا توجد مشاريع مضافة في هذا التصنيف حالياً.
            </p>
            {isManageMode && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#5E0B22] bg-white hover:bg-rose-50 rounded-xl cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة أول مشروع</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project) => {
              const coverImage = project.images[0]?.url || '';
              const isConfirmingDelete = confirmDeleteProjectId === project.id;

              return (
                <article
                  key={project.id}
                  className="group rounded-2xl border border-white/15 bg-white text-neutral-950 overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <button
                      type="button"
                      onClick={() => openProjectLightbox(project.id)}
                      className="block w-full aspect-[4/3] overflow-hidden border-b border-neutral-200 bg-neutral-100 cursor-pointer text-right focus-visible:outline-2 focus-visible:outline-[#881337]"
                    >
                      <ResilientImage
                        src={coverImage}
                        alt={project.title}
                        fallbackTitle={project.client}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    </button>

                    <div className="p-7">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 mb-3">
                        <span className="font-semibold text-[#680E27]">{project.client}</span>
                        <span aria-hidden="true">·</span>
                        <span>{project.categoryLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{project.images.length} صور</span>
                      </div>

                      <h3 className="font-display text-xl font-bold text-neutral-950 leading-snug mb-4">
                        {project.title}
                      </h3>

                      {project.metricValue && (
                        <div className="pt-4 border-t border-neutral-100">
                          <div className="font-display text-lg font-bold text-[#881337] tabular-nums">
                            {project.metricValue}
                          </div>
                          {project.metricContext && (
                            <p className="text-xs text-neutral-500 mt-1">
                              {project.metricContext}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-7 pb-7 space-y-2.5">
                    <button
                      type="button"
                      onClick={() => openProjectLightbox(project.id)}
                      className="w-full inline-flex items-center justify-between px-4 py-3 text-sm font-semibold text-white bg-[#680E27] hover:bg-[#4A0819] rounded-xl transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#881337]"
                    >
                      <span>
                        {isManageMode ? 'تعديل وإضافة صور للمشروع' : 'عرض ألبوم المشروع'}
                      </span>
                      <ArrowUpLeft className="w-4 h-4 text-rose-200" />
                    </button>

                    {isManageMode && (
                      <div>
                        {isConfirmingDelete ? (
                          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-red-50 border border-red-200">
                            <span className="text-xs font-medium text-red-900 pr-2">
                              حذف المشروع نهائياً؟
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={galleryBusy}
                                onClick={() => handleDeleteEntireProject(project)}
                                className="px-3 py-1.5 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg cursor-pointer"
                              >
                                تأكيد
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteProjectId(null)}
                                className="px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-950 cursor-pointer"
                              >
                                إلغاء
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteProjectId(project.id)}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-red-800 hover:bg-red-50 border border-red-200 rounded-xl transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف المشروع</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Adjacent Attributable Testimonial in Deep Wine-Crimson */}
        <figure className="mt-16 p-8 lg:p-12 rounded-2xl bg-[#360512] text-white border border-white/15">
          <blockquote className="text-lg lg:text-2xl font-medium text-white leading-relaxed max-w-4xl">
            «{TESTIMONIAL.quote}»
          </blockquote>
          <figcaption className="mt-6 pt-6 border-t border-white/15 flex flex-wrap items-center gap-2 text-sm text-rose-100">
            <span className="font-bold text-white">{TESTIMONIAL.author}</span>
            <span aria-hidden="true">·</span>
            <span>{TESTIMONIAL.role}</span>
            <span aria-hidden="true">·</span>
            <span>{TESTIMONIAL.organization}</span>
          </figcaption>
        </figure>
      </div>

      {/* Lightbox & Project Gallery Editor Modal */}
      {selectedProject && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-lightbox-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#24020B]/80 backdrop-blur-xs"
          onClick={() => setSelectedProjectId(null)}
        >
          <div
            className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white text-neutral-950 border border-neutral-200 p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-neutral-200">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 mb-2">
                  <span className="font-semibold text-[#680E27]">
                    {selectedProject.client}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedProject.categoryLabel}</span>
                  {selectedProject.timeframe && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{selectedProject.timeframe}</span>
                    </>
                  )}
                </div>
                <h3
                  id="project-lightbox-title"
                  className="font-display text-xl sm:text-2xl font-bold text-neutral-950"
                >
                  {selectedProject.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProjectId(null)}
                aria-label="إغلاق المعرض"
                className="w-10 h-10 inline-flex items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {galleryError && (
              <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{galleryError}</span>
              </div>
            )}

            <div className="mt-6 relative rounded-xl overflow-hidden border border-neutral-200 bg-[#24020B] aspect-[16/10]">
              {selectedProject.images.length > 0 ? (
                <>
                  <ResilientImage
                    src={selectedProject.images[activeImageIndex]?.url || ''}
                    alt={
                      selectedProject.images[activeImageIndex]?.caption ||
                      selectedProject.title
                    }
                    fallbackTitle={selectedProject.title}
                    className="w-full h-full object-contain bg-[#24020B]"
                  />

                  {selectedProject.images.length > 1 && (
                    <>
                      <button
                        type="button"
                        aria-label="الصورة السابقة"
                        onClick={() =>
                          setActiveImageIndex((prev) =>
                            prev === 0
                              ? selectedProject.images.length - 1
                              : prev - 1
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-neutral-950 flex items-center justify-center shadow-sm cursor-pointer"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        aria-label="الصورة التالية"
                        onClick={() =>
                          setActiveImageIndex((prev) =>
                            prev === selectedProject.images.length - 1
                              ? 0
                              : prev + 1
                          )
                        }
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-neutral-950 flex items-center justify-center shadow-sm cursor-pointer"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-rose-100 p-6">
                  <p className="text-sm font-medium">
                    لا توجد صور في هذا المشروع بعد.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {selectedProject.images.map((img, idx) => {
                const isCurrent = idx === activeImageIndex;
                return (
                  <div key={img.id} className="relative group">
                    <button
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors cursor-pointer block ${
                        isCurrent
                          ? 'border-[#881337]'
                          : 'border-neutral-200 hover:border-neutral-400'
                      }`}
                    >
                      <ResilientImage
                        src={img.url}
                        alt={img.caption || `صورة ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>

                    {isManageMode && (
                      <button
                        type="button"
                        disabled={galleryBusy}
                        aria-label="حذف هذه الصورة"
                        onClick={() =>
                          handleDeleteSingleImage(
                            selectedProject.id,
                            img.id,
                            img.storagePath
                          )
                        }
                        className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-red-700 hover:bg-red-800 text-white flex items-center justify-center shadow-sm cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}

              {isManageMode && (
                <>
                  <input
                    ref={addMoreInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleAddImagesToExisting}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={galleryBusy}
                    onClick={() => addMoreInputRef.current?.click()}
                    className="w-20 h-16 rounded-lg border-2 border-dashed border-neutral-300 hover:border-[#881337] text-neutral-600 hover:text-[#881337] flex flex-col items-center justify-center gap-1 text-[11px] font-medium cursor-pointer transition-colors"
                  >
                    <ImagePlus className="w-4 h-4" />
                    <span>{galleryBusy ? 'جاري...' : 'إضافة صور'}</span>
                  </button>
                </>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-neutral-200 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <h4 className="font-display text-sm font-bold text-neutral-950">
                  تفاصيل العمل المنفذ
                </h4>
                <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                  {selectedProject.summary ||
                    'تنفيذ محتوى بصري متكامل وإدارة حملة نشر موجهة لرفع التفاعل والمبيعات.'}
                </p>
              </div>

              {selectedProject.metricValue && (
                <div className="p-4 rounded-xl bg-[#FAF3F5] border border-[#881337]/15">
                  <div className="text-xs text-neutral-500 mb-1">النتيجة المحققة</div>
                  <div className="font-display text-xl font-bold text-[#881337] tabular-nums">
                    {selectedProject.metricValue}
                  </div>
                  {selectedProject.metricContext && (
                    <div className="text-xs text-neutral-600 mt-1">
                      {selectedProject.metricContext}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 pt-5 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => {
                  const title = selectedProject.title;
                  setSelectedProjectId(null);
                  onRequestConsultation(`مهتم بخدمة مشابهة لمشروع: ${title}`);
                }}
                className="px-6 py-3 text-sm font-semibold text-white bg-[#881337] hover:bg-[#6D0F2B] rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                اطلب عملاً مشابهاً لمشروعك
              </button>

              <button
                type="button"
                onClick={() => setSelectedProjectId(null)}
                className="px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-950 cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Project Modal */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-project-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#24020B]/80 backdrop-blur-xs"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white text-neutral-950 border border-neutral-200 p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 pb-5 border-b border-neutral-200">
              <h3
                id="create-project-title"
                className="font-display text-xl font-bold text-neutral-950"
              >
                إضافة مشروع جديد إلى المعرض
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                aria-label="إغلاق"
                className="w-10 h-10 inline-flex items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProjectSubmit} className="mt-6 space-y-5">
              {createError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 mb-1.5">
                    عنوان المشروع *
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="مثال: تصوير منتجات وحملة إطلاق متجر"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:border-[#881337]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 mb-1.5">
                    اسم العميل أو العلامة *
                  </label>
                  <input
                    type="text"
                    value={newClient}
                    onChange={(e) => setNewClient(e.target.value)}
                    placeholder="مثال: مطعم ومخبز الساحل"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:border-[#881337]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 mb-1.5">
                    تصنيف العمل
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) =>
                      setNewCategory(e.target.value as ProjectCategory)
                    }
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-300 bg-white focus:outline-none focus:border-[#881337]"
                  >
                    {PROJECT_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-900 mb-1.5">
                    تاريخ التنفيذ
                  </label>
                  <input
                    type="text"
                    value={newTimeframe}
                    onChange={(e) => setNewTimeframe(e.target.value)}
                    placeholder="مثال: نوفمبر 2026"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:border-[#881337]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 mb-1.5">
                    النتيجة المحققة (اختياري)
                  </label>
                  <input
                    type="text"
                    value={newMetricValue}
                    onChange={(e) => setNewMetricValue(e.target.value)}
                    placeholder="مثال: +180% طلبات عبر إنستغرام"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:border-[#881337]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 mb-1.5">
                    سياق النتيجة (اختياري)
                  </label>
                  <input
                    type="text"
                    value={newMetricContext}
                    onChange={(e) => setNewMetricContext(e.target.value)}
                    placeholder="مثال: خلال أول ٣٠ يوماً من الحملة"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:border-[#881337]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-1.5">
                  وصف مختصر للمشروع
                </label>
                <textarea
                  rows={3}
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="تفاصيل جلسة التصوير أو إدارة الصفحة أو الإعلانات المنفذة..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:border-[#881337]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-2">
                  صور المشروع *
                </label>
                <input
                  ref={createFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleCreateFilesSelected}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => createFileInputRef.current?.click()}
                  className="w-full p-6 rounded-xl border-2 border-dashed border-neutral-300 hover:border-[#881337] bg-[#FAF3F5] hover:bg-rose-50/70 transition-colors flex flex-col items-center justify-center gap-2 text-neutral-600 cursor-pointer"
                >
                  <Upload className="w-6 h-6 text-[#881337]" />
                  <span className="text-sm font-semibold text-neutral-800">
                    اختر صوراً من جهازك (يمكن اختيار أكثر من صورة)
                  </span>
                  <span className="text-xs text-neutral-500">
                    PNG, JPG, WEBP — يتم عرض الصورة الأولى كغلاف للمشروع
                  </span>
                </button>

                {pendingFiles.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {pendingFiles.map((item, idx) => (
                      <div key={item.previewUrl} className="relative">
                        <img
                          src={item.previewUrl}
                          alt={item.file.name}
                          className="w-20 h-16 object-cover rounded-lg border border-neutral-200"
                        />
                        <button
                          type="button"
                          aria-label="إزالة الصورة"
                          onClick={() => handleRemovePendingFile(idx)}
                          className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-neutral-950 text-white flex items-center justify-center shadow-sm cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-950 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProject}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-[#881337] hover:bg-[#6D0F2B] disabled:opacity-60 rounded-xl transition-colors cursor-pointer"
                >
                  {isSubmittingProject ? 'جاري رفع الصور والحفظ...' : 'نشر المشروع'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supabase Admin Login Modal */}
      {showAuthModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#24020B]/80 backdrop-blur-xs"
          onClick={() => setShowAuthModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white text-neutral-950 border border-neutral-200 p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#881337]" />
                <h3
                  id="auth-modal-title"
                  className="font-display text-lg font-bold text-neutral-950"
                >
                  تسجيل دخول إدارة المعرض
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                aria-label="إغلاق"
                className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSupabaseLogin} className="mt-5 space-y-4">
              {authError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-1.5">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  required
                  dir="ltr"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-300 text-right focus:outline-none focus:border-[#881337]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-1.5">
                  كلمة المرور
                </label>
                <input
                  type="password"
                  required
                  dir="ltr"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-300 text-right focus:outline-none focus:border-[#881337]"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 text-sm font-semibold text-white bg-[#881337] hover:bg-[#6D0F2B] disabled:opacity-60 rounded-xl transition-colors cursor-pointer"
              >
                {authLoading ? 'جاري التحقق...' : 'دخول لإدارة المشاريع'}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
