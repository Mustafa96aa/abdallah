import { CONTACT_EMAIL } from '../data/landingData';

interface FooterProps {
  onNavigate: (sectionId: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-[#360512] text-rose-100 border-t border-white/15 py-14">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-8 border-b border-white/15">
          <div className="space-y-2">
            <div className="font-display text-2xl font-bold text-white">عبد الله</div>
            <p className="text-sm text-rose-200/80">
              صناعة المحتوى · التصوير التجاري · إدارة صفحات فيسبوك وإنستغرام والحملات الإعلانية
            </p>
          </div>

          <nav aria-label="روابط التذييل" className="flex flex-wrap items-center gap-6 text-sm text-rose-100">
            <a
              href="#capabilities"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('capabilities');
              }}
              className="hover:text-white transition-colors whitespace-nowrap"
            >
              الخدمات
            </a>
            <a
              href="#projects"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('projects');
              }}
              className="hover:text-white transition-colors whitespace-nowrap"
            >
              المشاريع
            </a>
            <a
              href="#methodology"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('methodology');
              }}
              className="hover:text-white transition-colors whitespace-nowrap"
            >
              منهجية العمل
            </a>
            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('contact');
              }}
              className="hover:text-white transition-colors whitespace-nowrap"
            >
              تواصل معي
            </a>
          </nav>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-rose-200/75">
          <p>© ٢٠٢٦ عبد الله لصناعة المحتوى والإعلان. جميع الحقوق محفوظة.</p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="hover:text-white transition-colors"
            dir="ltr"
          >
            {CONTACT_EMAIL}
          </a>
        </div>
      </div>
    </footer>
  );
}
