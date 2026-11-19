import { useState, useEffect, type FormEvent } from 'react';
import { AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { BUDGET_RANGES, PROJECT_SCOPES } from '../data/landingData';

interface LeadCaptureProps {
  prefillNote?: string;
}

interface FormErrors {
  name?: string;
  contact?: string;
}

export function LeadCapture({ prefillNote }: LeadCaptureProps) {
  const [scope, setScope] = useState<string>(PROJECT_SCOPES[0].id);
  const [budget, setBudget] = useState<string>(BUDGET_RANGES[0]);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (prefillNote) {
      setNotes(prefillNote);
    }
  }, [prefillNote]);

  const selectedScopeObj =
    PROJECT_SCOPES.find((item) => item.id === scope) || PROJECT_SCOPES[0];

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!name.trim() || name.trim().length < 2) {
      nextErrors.name = 'يرجى إدخال الاسم الكامل.';
    }

    const trimmedContact = contact.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^[+]?[\d\s()-]{8,}$/;

    if (!trimmedContact) {
      nextErrors.contact = 'يرجى إدخال رقم الواتساب أو البريد الإلكتروني.';
    } else if (
      !emailPattern.test(trimmedContact) &&
      !phonePattern.test(trimmedContact)
    ) {
      nextErrors.contact =
        'يرجى إدخال بريد إلكتروني صحيح أو رقم هاتف مكون من ٨ أرقام على الأقل.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setName('');
    setCompany('');
    setContact('');
    setNotes('');
    setErrors({});
  };

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
                  href="mailto:aboodee2004sh@gmail.com"
                  className="font-semibold text-white hover:text-rose-200 underline underline-offset-4"
                  dir="ltr"
                >
                  aboodee2004sh@gmail.com
                </a>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 p-6 sm:p-10 rounded-2xl border border-white/15 bg-white text-neutral-950">
            {submitted ? (
              <div className="py-8 space-y-6">
                <div className="inline-flex items-center gap-2.5 text-emerald-800 font-semibold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
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
                <div>
                  <label className="block text-sm font-semibold text-neutral-950 mb-3">
                    الخدمة المطلوبة
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {PROJECT_SCOPES.map((item) => {
                      const active = scope === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setScope(item.id)}
                          className={`px-4 py-3 text-sm font-medium rounded-xl border text-right transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#881337] ${
                            active
                              ? 'border-[#881337] bg-[#680E27] text-white'
                              : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-[#881337]/40'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-950 mb-3">
                    الميزانية المتوقعة
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {BUDGET_RANGES.map((range) => {
                      const active = budget === range;
                      return (
                        <button
                          key={range}
                          type="button"
                          onClick={() => setBudget(range)}
                          className={`px-4 py-2.5 text-sm font-medium rounded-xl border text-center transition-colors duration-150 tabular-nums cursor-pointer focus-visible:outline-2 focus-visible:outline-[#881337] ${
                            active
                              ? 'border-[#881337] bg-[#680E27] text-white'
                              : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-[#881337]/40'
                          }`}
                        >
                          {range}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="lead-name"
                      className="block text-sm font-semibold text-neutral-950 mb-2"
                    >
                      الاسم الكامل *
                    </label>
                    <input
                      id="lead-name"
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                      }}
                      placeholder="مثال: خالد الدوسري"
                      aria-invalid={Boolean(errors.name)}
                      className={`w-full px-4 py-3 text-sm rounded-xl border bg-white text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#881337]/15 ${
                        errors.name
                          ? 'border-red-700'
                          : 'border-neutral-300 focus:border-[#881337]'
                      }`}
                    />
                    {errors.name && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-800">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
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
                    id="lead-contact"
                    type="text"
                    value={contact}
                    onChange={(e) => {
                      setContact(e.target.value);
                      if (errors.contact)
                        setErrors((prev) => ({ ...prev, contact: undefined }));
                    }}
                    placeholder="name@company.com أو 05xxxxxxxx"
                    dir="ltr"
                    aria-invalid={Boolean(errors.contact)}
                    className={`w-full px-4 py-3 text-sm rounded-xl border bg-white text-neutral-950 text-right placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#881337]/15 ${
                      errors.contact
                        ? 'border-red-700'
                        : 'border-neutral-300 focus:border-[#881337]'
                    }`}
                  />
                  {errors.contact && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-800">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
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
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="حدثني باختصار عن منتجاتك أو خدماتك وما الذي ترغب في تحقيقه من التصوير أو الإعلانات..."
                    className="w-full px-4 py-3 text-sm rounded-xl border border-neutral-300 bg-white text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:border-[#881337] focus:ring-2 focus:ring-[#881337]/15"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 text-base font-semibold text-white bg-[#680E27] hover:bg-[#4A0819] rounded-xl transition-colors duration-150 cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#881337]"
                  >
                    <span>إرسال طلب التعاون</span>
                    <ArrowLeft className="w-4 h-4" />
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
