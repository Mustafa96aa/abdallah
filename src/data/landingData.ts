export type CapabilityCategory = 'all' | 'photography' | 'management' | 'ads';
export type ProjectCategory = 'photography' | 'management' | 'ads';

export interface CapabilityItem {
  id: string;
  number: string;
  category: Exclude<CapabilityCategory, 'all'>;
  categoryLabel: string;
  title: string;
  summary: string;
  deliverables: string[];
  span: 'wide' | 'narrow';
}

export interface ProjectImage {
  id: string;
  url: string;
  storagePath?: string;
  caption?: string;
}

export interface PortfolioProject {
  id: string;
  title: string;
  client: string;
  category: ProjectCategory;
  categoryLabel: string;
  timeframe: string;
  metricValue: string;
  metricContext: string;
  summary: string;
  images: ProjectImage[];
}

export interface MethodologyStep {
  id: string;
  number: string;
  title: string;
  duration: string;
  summary: string;
  outputs: string[];
}

export interface HeroMetric {
  value: string;
  label: string;
  context: string;
}

export const HERO_IMAGE = '/src/assets/images/abdullah_hero_studio_1795047250647.jpg';

export const HERO_METRICS: HeroMetric[] = [
  {
    value: '+4.2M',
    label: 'مشاهدة ووصول إعلاني',
    context: 'عبر حملات فيسبوك وإنستغرام',
  },
  {
    value: '5',
    label: 'علامات تجارية مُدارة',
    context: 'مطاعم، متاجر، وشركات خدمات',
  },
  {
    value: '3.8x',
    label: 'متوسط العائد الإعلاني',
    context: 'من حملات المبيعات والرسائل',
  },
  {
    value: '1,200+',
    label: 'صورة وفيديو ريلز',
    context: 'إنتاج وتعديل بمعدات احترافية',
  },
];

export const CAPABILITY_FILTERS: { id: CapabilityCategory; label: string }[] = [
  { id: 'all', label: 'جميع الخدمات' },
  { id: 'photography', label: 'التصوير والمحتوى' },
  { id: 'management', label: 'إدارة الصفحات' },
  { id: 'ads', label: 'الحملات الإعلانية' },
];

export const PROJECT_CATEGORIES: { id: ProjectCategory; label: string }[] = [
  { id: 'photography', label: 'تصوير تجاري ومحتوى' },
  { id: 'management', label: 'إدارة فيسبوك وإنستغرام' },
  { id: 'ads', label: 'حملات إعلانية ممولة' },
];

export const CAPABILITIES: CapabilityItem[] = [
  {
    id: 'commercial-photography',
    number: '01',
    category: 'photography',
    categoryLabel: 'التصوير والمحتوى',
    title: 'التصوير التجاري وإنتاج الريلز',
    summary:
      'جلسات تصوير ميدانية واستوديو للمنتجات، الأطعمة، والأزياء بصور عالية الدقة ومقاطع ريلز مصممة لجذب الانتباه في أول ثلاث ثوانٍ.',
    deliverables: [
      'تصوير المنتجات والوجبات بإضاءة وتكوين احترافي',
      'تصوير ومونتاج مقاطع Reels و Stories متوافقة مع الخوارزميات',
      'تعديل الألوان وتسليم النسخ المهيأة لكل منصة',
    ],
    span: 'wide',
  },
  {
    id: 'page-management',
    number: '02',
    category: 'management',
    categoryLabel: 'إدارة الصفحات',
    title: 'إدارة صفحات فيسبوك وإنستغرام',
    summary:
      'تولي كامل لحساباتك من كتابة خطة المحتوى الشهرية، تصميم المنشورات، وجدولة النشر حتى متابعة التفاعل وتنسيق الحساب.',
    deliverables: [
      'تقويم محتوى شهري متكامل باللغة العربية',
      'كتابة نصوص جذابة وتنسيق الهوية البصرية للحساب',
    ],
    span: 'narrow',
  },
  {
    id: 'meta-ads',
    number: '03',
    category: 'ads',
    categoryLabel: 'الحملات الإعلانية',
    title: 'إنشاء وإدارة الحملات الإعلانية (Meta Ads)',
    summary:
      'إطلاق حملات ممولة مدروسة على فيسبوك وإنستغرام تستهدف الجمهور الأنسب لمنتجك وتضبط تكلفة الرسالة أو الطلب.',
    deliverables: [
      'تحديد الجماهير المستهدفة واختبار عدة تصاميم إعلانية',
      'ربط البيكسل ومتابعة التحويلات بتقارير أسبوعية واضحة',
    ],
    span: 'narrow',
  },
  {
    id: 'creative-strategy',
    number: '04',
    category: 'photography',
    categoryLabel: 'التصوير والمحتوى',
    title: 'صناعة الهوية البصرية للمتاجر والمشاريع',
    summary:
      'نبني طابعاً بصرياً موحداً يميز حسابك في السوق المحلي ويجعل العميل يتعرف على علامتك فور رؤية منشوراتك.',
    deliverables: [
      'تصميم قوالب منشورات وستوري قابلة للتكرار',
      'توجيه إبداعي متكامل لأسلوب التصوير والألوان',
      'تطوير أفكار محتوى موسمية للعروض والإطلاقات',
    ],
    span: 'wide',
  },
];

export const INITIAL_PROJECTS: PortfolioProject[] = [
  {
    id: 'rokn-cafe',
    title: 'جلسة تصوير موسمية وإدارة حساب إنستغرام',
    client: 'محمصة ومقهى رُكن',
    category: 'photography',
    categoryLabel: 'تصوير تجاري ومحتوى',
    timeframe: 'أكتوبر 2026',
    metricValue: '+210% تفاعل عضوي',
    metricContext: 'خلال ٦٠ يوماً من تحديث الهوية البصرية للحساب',
    summary:
      'تنفيذ جلسة تصوير صباحية للمشروبات المختصة والمخبوزات باستخدام الإضاءة الطبيعية، مع إعادة ترتيب شبكة إنستغرام وإنتاج ٨ مقاطع ريلز شهرية.',
    images: [
      {
        id: 'rokn-img-1',
        url: '/src/assets/images/project_cafe_shoot_1795047251852.jpg',
        caption: 'تصوير المشروبات المختصة والمخبوزات',
      },
      {
        id: 'rokn-img-2',
        url: '/src/assets/images/abdullah_hero_studio_1795047250647.jpg',
        caption: 'تجهيز الإضاءة ومعدات التصوير',
      },
    ],
  },
  {
    id: 'aura-leather',
    title: 'حملة إطلاق مجموعة العطور والإكسسوارات الجلدية',
    client: 'علامة أورا التجارية',
    category: 'ads',
    categoryLabel: 'حملات إعلانية ممولة',
    timeframe: 'أغسطس 2026',
    metricValue: '4.1x عائد على الإنفاق الإعلاني',
    metricContext: 'عبر حملات المبيعات الموجهة على إنستغرام وفيسبوك',
    summary:
      'تصوير المنتجات في الاستوديو على خامات الحجر الطبيعي، وإطلاق ٣ مجموعات إعلانية اختبرت زوايا عرض مختلفة لرفع معدل الشراء المباشر.',
    images: [
      {
        id: 'aura-img-1',
        url: '/src/assets/images/project_fashion_campaign_1795047251264.jpg',
        caption: 'اللقطة الرئيسية للحملة الإعلانية',
      },
    ],
  },
  {
    id: 'noor-clinic',
    title: 'إدارة شاملة لصفحتي فيسبوك وإنستغرام مع حملات الرسائل',
    client: 'متجر وتجهيزات مدى',
    category: 'management',
    categoryLabel: 'إدارة فيسبوك وإنستغرام',
    timeframe: 'يونيو 2026',
    metricValue: 'تخفيض تكلفة الرسالة 42%',
    metricContext: 'مع زيادة الطلبات المؤكدة إلى ٣٢٠ طلباً شهرياً',
    summary:
      'إدارة يومية كاملة للمحتوى والتعليقات مع جدول نشر منتظم وربط المحتوى المصور بحملات رسائل مستهدفة جغرافياً.',
    images: [
      {
        id: 'noor-img-1',
        url: '/src/assets/images/project_tech_ads_1795047252059.jpg',
        caption: 'متابعة مؤشرات الحملة وجودة المحتوى',
      },
    ],
  },
];

export const TESTIMONIAL = {
  quote:
    'قبل التعاون مع عبد الله، كانت صفحتنا تنشر صوراً عشوائية لا تجلب زبائن فعليين. بعد جلسة التصوير الأولى وإعادة تنظيم حساب إنستغرام وإطلاق الحملات الممولة، ارتفعت الطلبات اليومية عبر الرسائل بأكثر من الضعف خلال شهرين.',
  author: 'طارق الحسن',
  role: 'المؤسس',
  organization: 'محمصة ومقهى رُكن',
};

export const METHODOLOGY_STEPS: MethodologyStep[] = [
  {
    id: 'audit',
    number: '٠١',
    title: 'دراسة النشاط والحسابات الحالية',
    duration: 'اليوم ١ – ٢',
    summary:
      'أفحص حساباتك على فيسبوك وإنستغرام، أحلل نقاط القوة لدى المنافسين، وأحدد الفئة المستهدفة التي تحقق أفضل عائد.',
    outputs: [
      'مراجعة كاملة للحسابات الحالية وتحديد نقاط التحسين',
      'وضع نبرة الخطاب والأسلوب البصري المناسب لجمهورك',
      'تحديد قائمة اللقطات المطلوبة ليوم التصوير',
    ],
  },
  {
    id: 'shoot',
    number: '٠٢',
    title: 'يوم التصوير وإنتاج المحتوى',
    duration: 'اليوم ٣ – ٦',
    summary:
      'تنفيذ جلسة التصوير الفوتوغرافي والفيديو بمعدات احترافية، ثم تعديل الصور ومونتاج مقاطع الريلز وتجهيز النصوص.',
    outputs: [
      'صور عالية الدقة للمنتجات والخدمات',
      'مقاطع ريلز قصيرة جاهزة للنشر والإعلان',
      'كتابة نصوص المنشورات وخطافات الجذب (Hooks)',
    ],
  },
  {
    id: 'manage',
    number: '٠٣',
    title: 'النشر وإدارة الصفحات',
    duration: 'شهرياً / مستمر',
    summary:
      'نشر المحتوى في الأوقات الأنسب لجمهورك، تنسيق واجهة إنستغرام وفيسبوك، ومتابعة التفاعل لضمان حضور مستمر.',
    outputs: [
      'جدول نشر منتظم على فيسبوك وإنستغرام',
      'تصميم قوالب ستوري يومية للعروض والتغطيات',
      'متابعة أداء كل منشور وتكرار الأفكار الأعلى تفاعلاً',
    ],
  },
  {
    id: 'ads-scale',
    number: '٠٤',
    title: 'إطلاق الحملات الإعلانية والتحسين',
    duration: 'أسبوعياً',
    summary:
      'تشغيل الحملات الممولة عبر مدير إعلانات ميتا، مراقبة تكلفة النتيجة يومياً، وإعادة توجيه الميزانية نحو الإعلانات الرابحة.',
    outputs: [
      'إعداد الحملات وتقسيم الجماهير باحترافية',
      'اختبارات مستمرة للصور والعناوين الإعلانية',
      'تقرير واضح بنهاية كل شهر يوضح الإنفاق والعائد',
    ],
  },
];

export const PROJECT_SCOPES = [
  { id: 'shoot-pack', label: 'جلسة تصوير وصناعة محتوى', estimate: 'تسليم خلال ٥ – ٧ أيام' },
  { id: 'monthly-mgmt', label: 'إدارة فيسبوك وإنستغرام + تصوير', estimate: 'اشتراك شهري متكامل' },
  { id: 'ads-mgmt', label: 'إدارة حملات إعلانية ممولة', estimate: 'تجهيز وإطلاق خلال ٤٨ ساعة' },
] as const;

export const BUDGET_RANGES = [
  '٦٠ – ١٠٠ دولار',
  '١٠٠ – ١٥٠ دولار',
  '١٥٠ – ٢٠٠ دولار',
] as const;
