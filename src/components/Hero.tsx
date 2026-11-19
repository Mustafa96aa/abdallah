import { ArrowLeft } from 'lucide-react';
import { HERO_IMAGE, HERO_METRICS } from '../data/landingData';
import { ResilientImage } from './ResilientImage';

interface HeroProps {
  onPrimaryCta: () => void;
  onSecondaryCta: () => void;
}

const RIBBON_ITEMS = [
  'تصوير تجاري',
  'إنتاج مقاطع ريلز',
  'إدارة صفحات فيسبوك وإنستغرام',
  'حملات ميتا الممولة',
  'هوية بصرية للمتاجر',
];

export function Hero({ onPrimaryCta, onSecondaryCta }: HeroProps) {
  return (
    <section
      id="top"
      className="bg-gradient-to-b from-[#4A0819] via-[#5E0B22] to-[#4A0819] text-white border-b border-white/15"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-12 pb-16 lg:pt-20 lg:pb-20">
        {/* 2-Column Hero Split with equal-height alignment */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-between py-2">
            <div>
              <p className="text-sm font-medium text-rose-200 mb-5 flex flex-wrap items-center gap-2.5">
                <span>صناعة محتوى سوشيال ميديا</span>
                <span aria-hidden="true" className="text-rose-300/40">/</span>
                <span>تصوير تجاري</span>
                <span aria-hidden="true" className="text-rose-300/40">/</span>
                <span>حملات إعلانية</span>
              </p>

              <h1
                className="font-display font-bold text-white tracking-tight leading-[1.18] text-balance mb-6"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.75rem)' }}
              >
                محتوى بصري متقن وحملات إعلانية تحوّل المشاهدات إلى مبيعات.
              </h1>

              <p className="text-base lg:text-lg text-rose-100/90 leading-relaxed max-w-xl mb-8">
                أنا عبد الله، أساعد العلامات التجارية والمشاريع على الظهور بصورة احترافية
                عبر التصوير التجاري، إدارة صفحات فيسبوك وإنستغرام، وبناء حملات ميتا الإعلانية
                الموجهة لتحقيق مبيعات ورسائل فعلية.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2">
              <button
                type="button"
                onClick={onPrimaryCta}
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-base font-semibold text-[#5E0B22] bg-white hover:bg-rose-50 rounded-xl transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span>احجز استشارة لمشروعك</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onSecondaryCta}
                className="py-2.5 text-sm font-semibold text-rose-100 hover:text-white underline underline-offset-8 decoration-rose-300/50 hover:decoration-white transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white rounded-sm"
              >
                تصفح معرض الأعمال
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="w-full h-full min-h-[280px] sm:min-h-[360px] lg:min-h-[440px] rounded-2xl overflow-hidden border border-white/20 bg-[#360512] flex flex-col">
              <div className="relative flex-1 overflow-hidden">
                <ResilientImage
                  src={HERO_IMAGE}
                  alt="عبد الله في استوديو التصوير وصناعة المحتوى"
                  fallbackTitle="عبد الله — التصوير وصناعة المحتوى"
                  className="w-full h-full lg:h-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#360512]/65 via-transparent to-transparent" />
              </div>
              <div className="px-5 py-3 bg-[#360512] text-rose-100 flex items-center justify-between gap-4 text-xs border-t border-white/10">
                <span className="font-medium text-white">استوديو التصوير والإنتاج</span>
                <span className="text-rose-200 font-medium">35mm · Natural & Studio Light</span>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Quantified Metrics Strip */}
        <div className="mt-14 lg:mt-20 pt-10 border-t border-white/15 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {HERO_METRICS.map((metric) => (
            <div key={metric.label} className="space-y-1.5">
              <div
                className="font-display text-3xl lg:text-4xl font-bold text-white tabular-nums"
                dir="ltr"
              >
                <span className="inline-block text-right w-full">{metric.value}</span>
              </div>
              <div className="text-sm font-semibold text-rose-100">{metric.label}</div>
              <p className="text-xs text-rose-200/80">{metric.context}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Subtle Editorial Ribbon Divider */}
      <div className="bg-[#320410] text-rose-100 border-t border-white/10 overflow-hidden py-3.5">
        <div className="flex whitespace-nowrap animate-marquee-rtl">
          {[0, 1].map((loopIndex) => (
            <div key={loopIndex} className="flex items-center gap-8 px-4 shrink-0">
              {RIBBON_ITEMS.map((item) => (
                <div
                  key={`${loopIndex}-${item}`}
                  className="flex items-center gap-8 text-xs sm:text-sm font-medium tracking-wide"
                >
                  <span>{item}</span>
                  <span aria-hidden="true" className="text-rose-400">/</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
