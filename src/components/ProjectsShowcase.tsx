import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import {
  AlertCircle,
  ArrowUpLeft,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  LogOut,
  Plus,
  SlidersHorizontal,
  Trash2,
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
  deleteProject,
  deleteProjectImage,
  fetchProjects,
} from '../lib/projectsRepository';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { Modal } from './Modal';
import { ResilientImage } from './ResilientImage';

// نوافذ الإدارة تُحمَّل عند الحاجة فقط، فلا تثقل الصفحة على الزوار
const CreateProjectModal = lazy(() =>
  import('./CreateProjectModal').then((m) => ({ default: m.CreateProjectModal }))
);
const AdminAuthModal = lazy(() =>
  import('./AdminAuthModal').then((m) => ({ default: m.AdminAuthModal }))
);

interface ProjectsShowcaseProps {
  onRequestConsultation: (prefillContext?: string) => void;
}

type FilterOption = 'all' | ProjectCategory;

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
  const [showCreateModal, setShowCreateModal] = useState(false);

  // أزرار الإدارة مخفية عن الزوار. تظهر لك عند فتح الموقع بالرابط: https://موقعك/#admin
  const [adminLinkEnabled, setAdminLinkEnabled] = useState(
    () => window.location.hash === '#admin'
  );

  const [galleryBusy, setGalleryBusy] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [confirmDeleteProjectId, setConfirmDeleteProjectId] = useState<string | null>(null);

  const addMoreInputRef = useRef<HTMLInputElement | null>(null);

  const loadAllProjects = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const list = await fetchProjects();
      setProjects(list);
    } catch (err) {
      setLoadError(
        err instanceof Error && err.message ? err.message : 'تعذر تحميل المشاريع حالياً.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllProjects();

    if (!isSupabaseConfigured || !supabase) return;

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setIsAuthenticated(Boolean(data.session));
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const loggedIn = Boolean(session);
      setIsAuthenticated(loggedIn);
      if (!loggedIn) {
        setIsManageMode(false);
      }
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const onHashChange = () => setAdminLinkEnabled(window.location.hash === '#admin');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const selectedProject =
    projects.find((p) => p.id === selectedProjectId) || null;

  useEffect(() => {
    if (selectedProject && activeImageIndex >= selectedProject.images.length) {
      setActiveImageIndex(Math.max(0, selectedProject.images.length - 1));
    }
  }, [selectedProject, activeImageIndex]);

  // التنقل بين الصور بأسهم الكيبورد (الواجهة عربية: السهم الأيسر = التالي)
  useEffect(() => {
    if (!selectedProject || selectedProject.images.length < 2) return;
    const count = selectedProject.images.length;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setActiveImageIndex((prev) => (prev + 1) % count);
      } else if (e.key === 'ArrowRight') {
        setActiveImageIndex((prev) => (prev - 1 + count) % count);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [selectedProject]);

  const canShowAdminControls =
    adminLinkEnabled || isManageMode || (isSupabaseConfigured && isAuthenticated);

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

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setIsManageMode(false);
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
    } catch (err) {
      setGalleryError(
        err instanceof Error && err.message ? err.message : 'تعذر رفع الصور الإضافية.'
      );
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
    } catch (err) {
      setGalleryError(err instanceof Error && err.message ? err.message : 'تعذر حذف الصورة.');
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
    } catch (err) {
      setGalleryError(err instanceof Error && err.message ? err.message : 'تعذر حذف المشروع.');
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

  const filterButtonClass = (active: boolean) =>
    `px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
      active ? 'bg-white text-[#5E0B22] shadow-xs' : 'text-rose-100 hover:text-white'
    }`;

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

          {canShowAdminControls && (
            <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
              {isManageMode && (
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#5E0B22] bg-white hover:bg-rose-50 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>إضافة مشروع جديد</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleToggleManageMode}
                aria-pressed={isManageMode}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-white ${
                  isManageMode
                    ? 'bg-[#360512] text-white border-white/30'
                    : 'bg-white/10 text-white border-white/25 hover:bg-white/20'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
                <span>{isManageMode ? 'إنهاء تعديل المعرض' : 'إدارة المشاريع والصور'}</span>
              </button>

              {isSupabaseConfigured && isAuthenticated && isManageMode && (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium text-rose-100 hover:text-white bg-white/10 border border-white/20 rounded-xl cursor-pointer whitespace-nowrap"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  <span>خروج</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Category Filter */}
        <div className="mb-10">
          <div
            role="group"
            aria-label="تصفية المشاريع"
            className="inline-flex flex-wrap items-center gap-1 p-1.5 bg-[#360512] border border-white/10 rounded-xl"
          >
            <button
              type="button"
              aria-pressed={activeFilter === 'all'}
              onClick={() => setActiveFilter('all')}
              className={filterButtonClass(activeFilter === 'all')}
            >
              جميع الأعمال
            </button>
            {PROJECT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                aria-pressed={activeFilter === cat.id}
                onClick={() => setActiveFilter(cat.id)}
                className={filterButtonClass(activeFilter === cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading / Error / Empty / Projects Grid */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" aria-busy="true">
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
          <div
            role="alert"
            className="p-8 rounded-2xl border border-white/20 bg-[#360512] text-center space-y-4"
          >
            <div className="inline-flex items-center gap-2 text-rose-200 font-semibold text-sm">
              <AlertCircle className="w-5 h-5" aria-hidden="true" />
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
                <Plus className="w-4 h-4" aria-hidden="true" />
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
                      aria-label={`فتح ألبوم مشروع ${project.title}`}
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
                      <ArrowUpLeft className="w-4 h-4 text-rose-200" aria-hidden="true" />
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
                                className="px-3 py-1.5 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-60 rounded-lg cursor-pointer"
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
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
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

        {/* Testimonial */}
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

      {/* Lightbox & Project Gallery Editor */}
      {selectedProject && (
        <Modal
          labelledBy="project-lightbox-title"
          onClose={() => setSelectedProjectId(null)}
          panelClassName="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white text-neutral-950 border border-neutral-200 p-6 sm:p-8"
        >
          <div className="flex items-start justify-between gap-4 pb-5 border-b border-neutral-200">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 mb-2">
                <span className="font-semibold text-[#680E27]">{selectedProject.client}</span>
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
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {galleryError && (
            <div
              role="alert"
              className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-800 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{galleryError}</span>
            </div>
          )}

          <div className="mt-6 relative rounded-xl overflow-hidden border border-neutral-200 bg-[#24020B] aspect-[16/10]">
            {selectedProject.images.length > 0 ? (
              <>
                <ResilientImage
                  src={selectedProject.images[activeImageIndex]?.url || ''}
                  alt={
                    selectedProject.images[activeImageIndex]?.caption || selectedProject.title
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
                          prev === 0 ? selectedProject.images.length - 1 : prev - 1
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-neutral-950 flex items-center justify-center shadow-sm cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label="الصورة التالية"
                      onClick={() =>
                        setActiveImageIndex((prev) =>
                          prev === selectedProject.images.length - 1 ? 0 : prev + 1
                        )
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-neutral-950 flex items-center justify-center shadow-sm cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-rose-100 p-6">
                <p className="text-sm font-medium">لا توجد صور في هذا المشروع بعد.</p>
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
                    aria-label={`عرض الصورة ${idx + 1}`}
                    aria-current={isCurrent ? 'true' : undefined}
                    className={`w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors cursor-pointer block ${
                      isCurrent
                        ? 'border-[#881337]'
                        : 'border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    <ResilientImage
                      src={img.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>

                  {isManageMode && (
                    <button
                      type="button"
                      disabled={galleryBusy}
                      aria-label={`حذف الصورة ${idx + 1}`}
                      onClick={() =>
                        handleDeleteSingleImage(selectedProject.id, img.id, img.storagePath)
                      }
                      className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-red-700 hover:bg-red-800 text-white flex items-center justify-center shadow-sm cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
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
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={handleAddImagesToExisting}
                  className="hidden"
                  tabIndex={-1}
                />
                <button
                  type="button"
                  disabled={galleryBusy}
                  onClick={() => addMoreInputRef.current?.click()}
                  className="w-20 h-16 rounded-lg border-2 border-dashed border-neutral-300 hover:border-[#881337] text-neutral-600 hover:text-[#881337] flex flex-col items-center justify-center gap-1 text-[11px] font-medium cursor-pointer transition-colors"
                >
                  <ImagePlus className="w-4 h-4" aria-hidden="true" />
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
        </Modal>
      )}

      <Suspense fallback={null}>
        {showCreateModal && (
          <CreateProjectModal
            onClose={() => setShowCreateModal(false)}
            onCreated={(created) => {
              setProjects((prev) => [created, ...prev]);
              setShowCreateModal(false);
            }}
          />
        )}

        {showAuthModal && (
          <AdminAuthModal
            onClose={() => setShowAuthModal(false)}
            onSuccess={() => {
              setShowAuthModal(false);
              setIsManageMode(true);
            }}
          />
        )}
      </Suspense>
    </section>
  );
}
