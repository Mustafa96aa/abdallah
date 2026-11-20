import { useState } from 'react';
import {
  CAPABILITIES,
  CAPABILITY_FILTERS,
  type CapabilityCategory,
} from '../data/landingData';

export function CapabilitiesBento() {
  const [activeFilter, setActiveFilter] = useState<CapabilityCategory>('all');

  const filteredItems =
    activeFilter === 'all'
      ? CAPABILITIES
      : CAPABILITIES.filter((item) => item.category === activeFilter);

  return (
    <section
      id="capabilities"
      className="py-20 lg:py-28 bg-[#FAF3F5] text-neutral-950 border-b border-[#881337]/15"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-14">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-[#881337] mb-3">ماذا أقدم لعلامتك التجارية</p>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-[#360512] tracking-tight text-balance">
              من عدسة الكاميرا حتى إدارة الإعلانات في مكان واحد.
            </h2>
          </div>

          <div
            role="group"
            aria-label="تصفية الخدمات حسب التخصص"
            className="inline-flex flex-wrap items-center gap-1 p-1.5 bg-[#EFE2E5] rounded-xl self-start lg:self-auto"
          >
            {CAPABILITY_FILTERS.map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#881337] ${
                    isActive
                      ? 'bg-[#680E27] text-white shadow-xs'
                      : 'text-[#5E0B22] hover:text-[#360512]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const isWide = item.span === 'wide';
            const colSpanClass =
              activeFilter === 'all' && isWide ? 'md:col-span-2' : 'md:col-span-1';

            const isCrimsonCard = isWide;

            return (
              <article
                key={item.id}
                className={`${colSpanClass} p-8 rounded-2xl border flex flex-col justify-between gap-8 transition-colors duration-150 ${
                  isCrimsonCard
                    ? 'bg-[#5E0B22] border-[#78122E] text-white'
                    : 'bg-white border-[#881337]/15 hover:border-[#881337]/35 text-neutral-950'
                }`}
              >
                <div>
                  <div
                    className={`flex items-center gap-2 text-xs mb-4 ${
                      isCrimsonCard ? 'text-rose-200' : 'text-neutral-500'
                    }`}
                  >
                    <span
                      className={`font-semibold tabular-nums ${
                        isCrimsonCard ? 'text-white' : 'text-[#881337]'
                      }`}
                    >
                      {item.number}.
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{item.categoryLabel}</span>
                  </div>

                  <h3
                    className={`font-display text-xl lg:text-2xl font-bold mb-3 leading-snug ${
                      isCrimsonCard ? 'text-white' : 'text-[#360512]'
                    }`}
                  >
                    {item.title}
                  </h3>

                  <p
                    className={`text-sm lg:text-base leading-relaxed max-w-2xl ${
                      isCrimsonCard ? 'text-rose-100/90' : 'text-neutral-700'
                    }`}
                  >
                    {item.summary}
                  </p>
                </div>

                <ul
                  className={`pt-6 border-t space-y-2.5 text-sm ${
                    isCrimsonCard
                      ? 'border-white/15 text-rose-50'
                      : 'border-[#881337]/10 text-neutral-800'
                  }`}
                >
                  {item.deliverables.map((deliverable) => (
                    <li key={deliverable} className="flex items-start gap-2.5">
                      <span
                        aria-hidden="true"
                        className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${
                          isCrimsonCard ? 'bg-rose-300' : 'bg-[#881337]'
                        }`}
                      />
                      <span>{deliverable}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
