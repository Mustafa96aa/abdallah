import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { AlertCircle, Upload, X } from 'lucide-react';
import {
  PROJECT_CATEGORIES,
  type PortfolioProject,
  type ProjectCategory,
} from '../data/landingData';
import { createProject } from '../lib/projectsRepository';
import { Modal } from './Modal';

interface PendingFilePreview {
  file: File;
  previewUrl: string;
}

interface CreateProjectModalProps {
  onClose: () => void;
  onCreated: (project: PortfolioProject) => void;
}

const inputClass =
  'w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:border-[#881337]';
const labelClass = 'block text-sm font-semibold text-neutral-900 mb-1.5';

export function CreateProjectModal({ onClose, onCreated }: CreateProjectModalProps) {
  const uid = useId();
  const id = (suffix: string) => `${uid}-${suffix}`;

  const [title, setTitle] = useState('');
  const [client, setClient] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('photography');
  const [timeframe, setTimeframe] = useState('');
  const [metricValue, setMetricValue] = useState('');
  const [metricContext, setMetricContext] = useState('');
  const [summary, setSummary] = useState('');
  const [pendingFiles, setPendingFiles] = useState<PendingFilePreview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // تحرير روابط المعاينة عند إغلاق النافذة
  const pendingRef = useRef<PendingFilePreview[]>([]);
  pendingRef.current = pendingFiles;
  useEffect(
    () => () => {
      pendingRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    },
    []
  );

  const handleFilesSelected = (e: ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const all = Array.from(fileList);
    const images = all.filter((file) => file.type.startsWith('image/'));
    if (images.length !== all.length) {
      setError('تم تجاهل ملفات ليست صوراً. المسموح: JPG وPNG وWEBP وGIF.');
    } else {
      setError(null);
    }

    const added: PendingFilePreview[] = images.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPendingFiles((prev) => [...prev, ...added]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!title.trim() || !client.trim()) {
      setError('يرجى كتابة عنوان المشروع واسم العميل.');
      return;
    }
    if (pendingFiles.length === 0) {
      setError('يرجى اختيار صورة واحدة على الأقل للمشروع.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const created = await createProject(
        { title, client, category, timeframe, metricValue, metricContext, summary },
        pendingFiles.map((item) => item.file)
      );
      onCreated(created);
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'تعذر حفظ المشروع، يرجى المحاولة مرة أخرى.'
      );
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      labelledBy={id('title')}
      onClose={onClose}
      panelClassName="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white text-neutral-950 border border-neutral-200 p-6 sm:p-8"
    >
      <div className="flex items-center justify-between gap-4 pb-5 border-b border-neutral-200">
        <h3 id={id('title')} className="font-display text-xl font-bold text-neutral-950">
          إضافة مشروع جديد إلى المعرض
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق"
          className="w-10 h-10 inline-flex items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 cursor-pointer"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {error && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-800 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor={id('title-input')} className={labelClass}>
              عنوان المشروع *
            </label>
            <input
              id={id('title-input')}
              type="text"
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: تصوير منتجات وحملة إطلاق متجر"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor={id('client')} className={labelClass}>
              اسم العميل أو العلامة *
            </label>
            <input
              id={id('client')}
              type="text"
              maxLength={120}
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="مثال: مطعم ومخبز الساحل"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor={id('category')} className={labelClass}>
              تصنيف العمل
            </label>
            <select
              id={id('category')}
              value={category}
              onChange={(e) => setCategory(e.target.value as ProjectCategory)}
              className={`${inputClass} bg-white`}
            >
              {PROJECT_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={id('timeframe')} className={labelClass}>
              تاريخ التنفيذ
            </label>
            <input
              id={id('timeframe')}
              type="text"
              maxLength={60}
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              placeholder="مثال: نوفمبر 2026"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor={id('metric')} className={labelClass}>
              النتيجة المحققة (اختياري)
            </label>
            <input
              id={id('metric')}
              type="text"
              maxLength={120}
              value={metricValue}
              onChange={(e) => setMetricValue(e.target.value)}
              placeholder="مثال: +180% طلبات عبر إنستغرام"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor={id('metric-context')} className={labelClass}>
              سياق النتيجة (اختياري)
            </label>
            <input
              id={id('metric-context')}
              type="text"
              maxLength={200}
              value={metricContext}
              onChange={(e) => setMetricContext(e.target.value)}
              placeholder="مثال: خلال أول ٣٠ يوماً من الحملة"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor={id('summary')} className={labelClass}>
            وصف مختصر للمشروع
          </label>
          <textarea
            id={id('summary')}
            rows={3}
            maxLength={2000}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="تفاصيل جلسة التصوير أو إدارة الصفحة أو الإعلانات المنفذة..."
            className={inputClass}
          />
        </div>

        <div>
          <span className="block text-sm font-semibold text-neutral-900 mb-2">صور المشروع *</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handleFilesSelected}
            className="hidden"
            tabIndex={-1}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-6 rounded-xl border-2 border-dashed border-neutral-300 hover:border-[#881337] bg-[#FAF3F5] hover:bg-rose-50/70 transition-colors flex flex-col items-center justify-center gap-2 text-neutral-600 cursor-pointer"
          >
            <Upload className="w-6 h-6 text-[#881337]" aria-hidden="true" />
            <span className="text-sm font-semibold text-neutral-800">
              اختر صوراً من جهازك (يمكن اختيار أكثر من صورة)
            </span>
            <span className="text-xs text-neutral-500">
              JPG, PNG, WEBP — تُضغط تلقائياً قبل الرفع، وتُعرض الصورة الأولى كغلاف للمشروع
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
                    aria-label={`إزالة الصورة ${item.file.name}`}
                    onClick={() => handleRemovePendingFile(idx)}
                    className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-neutral-950 text-white flex items-center justify-center shadow-sm cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-950 cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-[#881337] hover:bg-[#6D0F2B] disabled:opacity-60 rounded-xl transition-colors cursor-pointer"
          >
            {isSubmitting ? 'جاري رفع الصور والحفظ...' : 'نشر المشروع'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
