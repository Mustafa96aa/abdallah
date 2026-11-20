import { useId, useState, type FormEvent } from 'react';
import { AlertCircle, Lock, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Modal } from './Modal';

interface AdminAuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminAuthModal({ onClose, onSuccess }: AdminAuthModalProps) {
  const uid = useId();
  const titleId = `${uid}-title`;
  const emailId = `${uid}-email`;
  const passwordId = `${uid}-password`;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setError(null);
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError('بيانات الدخول غير صحيحة. يرجى التحقق من البريد وكلمة المرور.');
        return;
      }
      setPassword('');
      onSuccess();
    } catch {
      setError('حدث خطأ أثناء تسجيل الدخول.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      labelledBy={titleId}
      onClose={onClose}
      panelClassName="w-full max-w-md rounded-2xl bg-white text-neutral-950 border border-neutral-200 p-6 sm:p-8"
    >
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#881337]" aria-hidden="true" />
          <h3 id={titleId} className="font-display text-lg font-bold text-neutral-950">
            تسجيل دخول إدارة المعرض
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق"
          className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 cursor-pointer"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {error && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-800 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label htmlFor={emailId} className="block text-sm font-semibold text-neutral-900 mb-1.5">
            البريد الإلكتروني
          </label>
          <input
            id={emailId}
            type="email"
            required
            dir="ltr"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-300 text-right focus:outline-none focus:border-[#881337]"
          />
        </div>

        <div>
          <label htmlFor={passwordId} className="block text-sm font-semibold text-neutral-900 mb-1.5">
            كلمة المرور
          </label>
          <input
            id={passwordId}
            type="password"
            required
            dir="ltr"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-300 text-right focus:outline-none focus:border-[#881337]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 text-sm font-semibold text-white bg-[#881337] hover:bg-[#6D0F2B] disabled:opacity-60 rounded-xl transition-colors cursor-pointer"
        >
          {loading ? 'جاري التحقق...' : 'دخول لإدارة المشاريع'}
        </button>
      </form>
    </Modal>
  );
}
