import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { METHODOLOGY_STEPS } from '../data/landingData';

export function Methodology() {
  const [activeStepId, setActiveStepId] = useState(METHODOLOGY_STEPS[0].id);

  useEffect(() => {
    if (!METHODOLOGY_STEPS.some((s) => s.id === activeStepId)) {
      setActiveStepId(METHODOLOGY_STEPS[0].id);
    }
  }, [activeStepId]);

  const activeStep =
    METHODOLOGY_STEPS.find((step) => step.id === activeStepId) ||
    METHODOLOGY_STEPS[0];

  return (
    <section
      id="methodology"
      className="py-20 lg:py-28 bg-[#FAF3F5] text-neutral-950 border-b border-[#881337]/15"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="max-w-2xl mb-14">
          <p className="text-sm font-semibold text-[#881337] mb-3">منهجية العمل</p>
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-[#360512] tracking-tight text-balance">
            خطوات منظمة من التصوير الأول حتى تحقيق نتائج الحملة.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-3" role="tablist" aria-label="مراحل العمل">
            {METHODOLOGY_STEPS.map((step) => {
              const isSelected = step.id === activeStep.id;
              return (
                <button
                  key={step.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveStepId(step.id)}
                  className={`w-full text-right p-5 rounded-xl border transition-colors duration-150 flex items-center justify-between gap-4 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#881337] ${
                    isSelected
                      ? 'bg-[#680E27] text-white border-[#680E27]'
                      : 'bg-white text-neutral-800 border-[#881337]/15 hover:border-[#881337]/40'
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span
                      className={`font-display text-sm font-bold tabular-nums shrink-0 ${
                        isSelected ? 'text-rose-200' : 'text-[#881337]'
                      }`}
                    >
                      {step.number}.
                    </span>
                    <span className="font-display font-semibold text-base truncate">
                      {step.title}
                    </span>
                  </div>
                  <span
                    className={`text-xs whitespace-nowrap shrink-0 ${
                      isSelected ? 'text-rose-100' : 'text-neutral-500'
                    }`}
                  >
                    {step.duration}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            role="tabpanel"
            className="lg:col-span-7 p-8 lg:p-10 rounded-2xl border border-[#78122E] bg-[#5E0B22] text-white"
          >
            <div className="flex items-center gap-2 text-xs text-rose-200 mb-4">
              <span className="font-semibold text-white">
                المرحلة {activeStep.number}
              </span>
              <span aria-hidden="true">·</span>
              <span>{activeStep.duration}</span>
            </div>

            <h3 className="font-display text-2xl font-bold text-white mb-4">
              {activeStep.title}
            </h3>

            <p className="text-base text-rose-100/90 leading-relaxed mb-8">
              {activeStep.summary}
            </p>

            <div className="pt-6 border-t border-white/15">
              <div className="text-xs font-semibold text-rose-200 mb-4">
                مخرجات هذه المرحلة
              </div>
              <ul className="space-y-3">
                {activeStep.outputs.map((output) => (
                  <li
                    key={output}
                    className="flex items-start gap-3 text-sm sm:text-base text-white"
                  >
                    <Check className="w-4 h-4 text-rose-300 mt-1 shrink-0" />
                    <span>{output}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
