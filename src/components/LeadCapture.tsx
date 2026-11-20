import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import {
  BUDGET_RANGES,
  CONTACT_EMAIL,
  PROJECT_SCOPES,
} from '../data/landingData';
import { LeadsUnavailableError, submitLead } from '../lib/leadsRepository';

export interface LeadPrefill {
  text: string;
  nonce: number;
}

interface LeadCaptureProps {
  prefill?: LeadPrefill;
}

interface FormErrors {
  name?: string;
  contact?: string;
}

/** يحوّل الأرقام العربية (٠١٢...) والهندية (۰۱۲...) إلى أرقام إنجليزية قبل التحقق. */
function normalizeDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
}

export function LeadCapture({ prefill }: LeadCaptureProps) {
  const [scope, setScope] = useState<string>(PROJECT_SCOPES[0].id);
  const [budget, setBudget] = useState<string>(BUDGET_RANGES[0]);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [notes, setNotes] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const nameRef = useRef<HTMLInputElement | null>(null);
  const contactRef = useRef<HTMLInputElement | null>(null);
  const notesEditedByUser = useRef(false);

  // لا نكتب فوق ملاحظات كتبها الزائر بنفسه
  useEffect(() => {
    if (prefill && !notesEditedByUser.current) {
      setNotes(prefill.text);
    }
  }, [prefill]);

  const selectedScopeObj =
    PROJECT_SCOPES.find((item) => item.id === scope) || PROJECT_SCOPES[0];

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};

    if (name.trim().length < 2) {
      nextErrors.name = 'يرجى إدخال الاسم الكامل.';
    }

    const trimmedContact = normalizeDigits(contact.trim());
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^\+?[\d\s()-]{8,}$/;
    const digitsCount = trimmedContact.replace(/\D/g, '').length;

    if (!trimmedContact) {
      nextErrors.contact = 'يرجى إدخال رقم الواتساب أو البريد الإلكتروني.';
    } else if (
      !emailPattern.test(trimmedContact) &&
      !(phonePattern.test(trimmedContact) && digitsCount >= 8)
    ) {
      nextErrors.contact =
        'يرجى إدخال بريد إلكتروني صحيح أو رقم هاتف مكون من ٨ أرقام على الأقل.';
    }

    return nextErrors;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === 'sending') return;
    setSubmitError(null);

    // حقل مخفي لا يراه البشر؛ إن امتلأ فهو بوت. نتظاهر بالنجاح دون حفظ شيء.
    if (honeypot.trim()) {
      setStatus('sent');
      return;
    }

    const nextErrors = validate();
    setErrors(nextErrors);
    if (nextErrors.name) {
      nameRef.current?.focus();
      return;
    }
    if (nextErrors.contact) {
      contactRef.current?.focus();
      return;
    }

    setStatus('sending');
    try {
      await submitLead({
        name,
        contact: normalizeDigits(contact.trim()),
        company,
        scope: selectedScopeObj.label,
        budget,
        notes,
      });
      setStatus('sent');
    } catch (err) {
      setStatus('idle');
      if (err instanceof LeadsUnavailableError) {
        setSubmitError(
          'خدمة استلام الطلبات غير مفعّلة حالياً. يمكنك مراسلتي مباشرة عبر البريد الإلكتروني.'
        );
      } else {
        setSubmitError(
          err instanceof Error ? err.message : 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.'
        );
      }
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setScope(PROJECT_SCOPES[0].id);
    setBudget(BUDGET_RANGES[0]);
    setName('');
    setCompany('');
    setContact('');
    setNotes('');
    setHoneypot('');
    setErrors({});
    setSubmitError(null);
    notesEditedByUser.current = false;
  };

  const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    `طلب تعاون: ${selectedScopeObj.label}`
  )}&body=${encodeURIComponent(
    `الاسم: ${name}\nالتواصل: ${contact}\nالعلامة: ${company}\nالخدمة: ${selectedScopeObj.label}\nالميزانية: ${budget}\n\n${notes}`
  )}`;

  const optionBase =
    'block px-4 py-3 text-sm font-medium rounded-xl border transition-colors duration-150 cursor-pointer border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-[#881337]/40 peer-checked:border-[#881337] peer-checked:bg-[#680E27] peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#881337]';

  return (
    <section id="contact" className="py-20 lg:py-28 bg-[#5E0B22] text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5 space-y-6">
            <div>
              <p className="text-sm font-medium text-rose-200 mb-3">احجز موعدك</p>
              <h2 className="font-display text-3xl lg:text-4xl font-bold text-white tracking-tight text-balance">
                جاهز لتطوير محتوى صفحتك وإطلاق حملتك القادمة؟
              </h2>
            </div>

            <p className="text-base text-rose-100/90 leading-relaxed">
              أرسل لي تفاصيل متجرك أو مشروعك وسأتواصل معك لترتيب خطة التصوير
              والمحتوى وإعداد الحملات الإعلانية المناسبة لميزانيتك.
            </p>

            <div className="pt-6 border-t border-white/15 space-y-4 text-sm">
              <div>
                <div className="text-rose-200">المدة التقديرية للخدمة المختارة</div>
                <div className="font-display font-bold text-white text-lg mt-0.5">
                  {selectedScopeObj.estimate}
                </div>
              </div>
              <div>
                <div className="text-rose-200">التواصل المباشر</div>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="font-semibold text-white hover:text-rose-200 underline underline-offset-4"
                  dir="ltr"
                >
                  {CONTACT_EMAIL}
                </a>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 p-6 sm:p-10 rounded-2xl border border-white/15 bg-white text-neutral-950">
            {status === 'sent' ? (
              <div className="py-8 space-y-6" role="status" aria-live="polite">
                <div className="inline-flex items-center gap-2.5 text-emerald-800 font-semibold text-sm">
                  <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                  <span>تم استلام طلبك بنجاح</span>
                </div>

                <h3 className="font-display text-2xl font-bold text-neutral-950">
                  شكراً لتواصلك، {name}.
                </h3>

                <p className="text-base text-neutral-600 leading-relaxed">
                  وصلتني تفاصيل طلبك بخصوص{' '}
                  <span className="font-semibold text-neutral-950">
                    {selectedScopeObj.label}
                  </span>
                  ، وسأتواصل معك خلال ٢٤ ساعة عبر{' '}
                  <span className="font-semibold text-neutral-950" dir="ltr">
                    {contact}
                  </span>{' '}
                  لمناقشة أفكار التصوير والحملة.
                </p>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-[#680E27] hover:bg-[#4A0819] rounded-xl transition-colors cursor-pointer"
                >
                  إرسال طلب جديد
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-7">
                {submitError && (
                  <div
                    role="alert"
                    className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm font-medium text-red-900 space-y-2"
                  >
                    <p className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{submitError}</span>
                    </p>
                    <a
                      href={mailtoHref}
                      className="inline-block text-xs font-semibold underline underline-offset-4"
                    >
                      إرسال الطلب عبر تطبيق البريد
                    </a>
                  </div>
                )}

                <fieldset>
                  <legend className="block text-sm font-semibold text-neutral-950 mb-3">
                    الخدمة المطلوبة
                  </legend>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {PROJECT_SCOPES.map((item) => (
                      <label key={item.id} className="relative block">
                        <input
                          type="radio"
                          name="lead-scope"
                          value={item.id}
                          checked={scope === item.id}
                          onChange={() => setScope(item.id)}
                          className="peer sr-only"
                        />
                        <span className={`${optionBase} text-right`}>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="block text-sm font-semibold text-neutral-950 mb-3">
                    الميزانية المتوقعة
                  </legend>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {BUDGET_RANGES.map((range) => (
                      <label key={range} className="relative block">
                        <input
                          type="radio"
                          name="lead-budget"
                          value={range}
                          checked={budget === range}
                          onChange={() => setBudget(range)}
                          className="peer sr-only"
                        />
                        <span className={`${optionBase} text-center tabular-nums`}>{range}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="lead-name"
                      className="block text-sm font-semibold text-neutral-950 mb-2"
                    >
                      الاسم الكامل *
                    </label>
                    <input
                      ref={nameRef}
                      id="lead-name"
                      type="text"
                      autoComplete="name"
                      maxLength={100}
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                      }}
                      placeholder="مثال: خالد الدوسري"
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? 'lead-name-error' : undefined}
                      className={`w-full px-4 py-3 text-sm rounded-xl border bg-white text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#881337]/15 ${
                        errors.name
                          ? 'border-red-700'
                          : 'border-neutral-300 focus:border-[#881337]'
                      }`}
                    />
                    {errors.name && (
                      <p
                        id="lead-name-error"
                        role="alert"
                        className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-800"
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>{errors.name}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="lead-company"
                      className="block text-sm font-semibold text-neutral-950 mb-2"
                    >
                      اسم العلامة التجارية أو الحساب
                    </label>
                    <input
                      id="lead-company"
                      type="text"
                      maxLength={100}
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="@brandname (اختياري)"
                      className="w-full px-4 py-3 text-sm rounded-xl border border-neutral-300 bg-white text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:border-[#881337] focus:ring-2 focus:ring-[#881337]/15"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="lead-contact"
                    className="block text-sm font-semibold text-neutral-950 mb-2"
                  >
                    رقم الواتساب أو البريد الإلكتروني *
                  </label>
                  <input
                    ref={contactRef}
                    id="lead-contact"
                    type="text"
                    autoComplete="email"
                    maxLength={120}
                    value={contact}
                    onChange={(e) => {
                      setContact(e.target.value);
                      if (errors.contact)
                        setErrors((prev) => ({ ...prev, contact: undefined }));
                    }}
                    placeholder="name@company.com أو 05xxxxxxxx"
                    dir="ltr"
                    aria-invalid={Boolean(errors.contact)}
                    aria-describedby={errors.contact ? 'lead-contact-error' : undefined}
                    className={`w-full px-4 py-3 text-sm rounded-xl border bg-white text-neutral-950 text-right placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#881337]/15 ${
                      errors.contact
                        ? 'border-red-700'
                        : 'border-neutral-300 focus:border-[#881337]'
                    }`}
                  />
                  {errors.contact && (
                    <p
                      id="lead-contact-error"
                      role="alert"
                      className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-800"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{errors.contact}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="lead-notes"
                    className="block text-sm font-semibold text-neutral-950 mb-2"
                  >
                    تفاصيل النشاط والهدف من الحملة
                  </label>
                  <textarea
                    id="lead-notes"
                    rows={3}
                    maxLength={2000}
                    value={notes}
                    onChange={(e) => {
                      notesEditedByUser.current = true;
                      setNotes(e.target.value);
                    }}
                    placeholder="حدثني باختصار عن منتجاتك أو خدماتك وما الذي ترغب في تحقيقه من التصوير أو الإعلانات..."
                    className="w-full px-4 py-3 text-sm rounded-xl border border-neutral-300 bg-white text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:border-[#881337] focus:ring-2 focus:ring-[#881337]/15"
                  />
                </div>

                {/* فخ للبوتات: حقل مخفي عن البشر وقارئات الشاشة */}
                <div aria-hidden="true" className="sr-only">
                  <label>
                    الموقع الإلكتروني
                    <input
                      type="text"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                    />
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 text-base font-semibold text-white bg-[#680E27] hover:bg-[#4A0819] disabled:opacity-60 disabled:cursor-not-allowed rounded-xl transition-colors duration-150 cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#881337]"
                  >
                    <span>{status === 'sending' ? 'جاري الإرسال...' : 'إرسال طلب التعاون'}</span>
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
