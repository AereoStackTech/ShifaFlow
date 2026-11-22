export interface BlogSection {
  id: string;
  headingAr: string;
  headingEn: string;
  paragraphsAr: string[];
  paragraphsEn: string[];
  bulletPointsAr?: string[];
  bulletPointsEn?: string[];
}

export interface BlogArticle {
  slug: string;
  categoryAr: string;
  categoryEn: string;
  titleAr: string;
  titleEn: string;
  excerptAr: string;
  excerptEn: string;
  publishedAt: string;
  authorAr: string;
  authorEn: string;
  authorRoleAr: string;
  authorRoleEn: string;
  coverImage: string;
  sections: BlogSection[];
}

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    slug: 'eliminating-double-bookings-multi-specialty-clinics',
    categoryAr: 'إدارة العيادات',
    categoryEn: 'Clinic Operations',
    titleAr: 'كيف تقضي العيادات متعددة التخصصات على تضارب المواعيد وازدحام الانتظار؟',
    titleEn: 'How Multi-Specialty Clinics Eliminate Double-Bookings and Lobby Bottlenecks',
    excerptAr:
      'تحليل عملي لكيفية تحويل الحجز الهاتفي اليدوي إلى محرك أوقات فوري يمنع التعارض ويقلص زمن انتظار المريض.',
    excerptEn:
      'A practical breakdown of replacing phone-based scheduling sheets with real-time slot locking to cut waiting room congestion.',
    publishedAt: '2026-10-18',
    authorAr: 'د. طارق المنصور',
    authorEn: 'Dr. Tariq Al-Mansour',
    authorRoleAr: 'مدير عمليات طبية (مفهوم افتراضي)',
    authorRoleEn: 'Medical Operations Lead (Fictional)',
    coverImage: '/images/blog-digital.jpg',
    sections: [
      {
        id: 'cost-of-manual-scheduling',
        headingAr: 'التكلفة الخفية للحجز الهاتفي التقليدي',
        headingEn: 'The Hidden Operational Cost of Phone-First Scheduling',
        paragraphsAr: [
          'في المراكز الطبية التي تضم أكثر من ثلاثة أطباء، يتحول مكتب الاستقبال خلال ساعات الذروة إلى نقطة اختناق متكررة. يتزامن الرد على المكالمات الهاتفية مع تسجيل وصول المرضى الحاضرين فعلياً، مما يرفع احتمالية تسجيل موعدين في التوقيت ذاته.',
          'لا تقتصر المشكلة على الإحراج أمام المريض فحسب، بل تمتد إلى إرباك جدول الطبيب وإهدار دقائق ثمينة في إعادة التنسيق اليدوي.'
        ],
        paragraphsEn: [
          'In medical centers operating with three or more clinicians, peak reception hours quickly become an operational bottleneck. Answering phone inquiries while checking in arriving patients sharply increases the likelihood of overlapping time slots.',
          'Beyond patient frustration, overlapping schedules cascade across the entire afternoon shift, forcing clinicians to rush consultations or run behind schedule.'
        ],
      },
      {
        id: 'conflict-free-slot-engine',
        headingAr: 'بناء محرك أوقات يمنع التضارب تلقائياً',
        headingEn: 'Architecture of a Conflict-Free Slot Engine',
        paragraphsAr: [
          'يعتمد الحجز الموثوق على فصل جدول دوام الطبيب الأسبوعي عن سجل الحجوزات الفعلية، ثم حساب الفواصل الزمنية المتاحة لحظياً عند كل طلب حجز مع قفل فوري للوقت المختار في قاعدة البيانات.',
        ],
        paragraphsEn: [
          'Reliable scheduling separates each physician’s recurring weekly shift template from confirmed appointment records, computing open intervals on demand and validating slot uniqueness at the database layer before confirming.',
        ],
        bulletPointsAr: [
          'تعريف مدة الكشفية بدقة حسب التخصص (٢٠، ٣٠، أو ٤٥ دقيقة).',
          'إغلاق الأوقات المحجوزة تلقائياً وإظهارها كغير متاحة لجميع القنوات.',
          'احترام حالات إجازة الطبيب لتجنب قبول حجوزات أثناء غيابه.'
        ],
        bulletPointsEn: [
          'Configure consultation intervals per specialty (20, 30, or 45 minutes).',
          'Lock confirmed intervals immediately across reception and public self-booking.',
          'Automatically block calendar slots whenever a doctor is marked on leave.'
        ],
      },
      {
        id: 'digital-ticket-checkin',
        headingAr: 'تذكرة الحجز الرقمية ورمز الاستجابة السريعة QR',
        headingEn: 'Accelerating Front-Desk Check-In with QR Tickets',
        paragraphsAr: [
          'عندما يحصل المريض فور إتمام الحجز على تذكرة واضحة تحمل الرقم المرجعي واسم العيادة ورقم الغرفة ورمز QR، تنخفض مكالمات التأكيد الهاتفية بنسبة ملحوظة، ويصبح تسجيل الوصول في الاستقبال عملية تستغرق ثوانٍ معدودة.'
        ],
        paragraphsEn: [
          'Issuing an immediate confirmation ticket containing a unique reference ID, suite number, and scannable QR code eliminates follow-up confirmation calls and turns lobby arrival into a single-click status transition.'
        ],
      },
    ],
  },
  {
    slug: 'preventive-heart-checkup-preparation-guide',
    categoryAr: 'التوعية الصحية',
    categoryEn: 'Preventive Health',
    titleAr: 'دليل المريض للاستعداد لزيارة الفحص الدوري للقلب وضغط الدم',
    titleEn: 'Patient Guide: Preparing for a Preventive Cardiology & Blood Pressure Visit',
    excerptAr:
      'خطوات بسيطة قبل موعدك الطبي تساعد الطبيب في الوصول إلى قراءة دقيقة وتقييم صحي شامل خلال الزيارة الأولى.',
    excerptEn:
      'Simple steps before your appointment that help your physician capture accurate baseline readings during your consultation.',
    publishedAt: '2026-10-29',
    authorAr: 'د. ليلى الحربي',
    authorEn: 'Dr. Layla Al-Harbi',
    authorRoleAr: 'استشارية أمراض القلب (مفهوم افتراضي)',
    authorRoleEn: 'Consultant Cardiologist (Fictional)',
    coverImage: '/images/blog-preventive.jpg',
    sections: [
      {
        id: 'home-readings-log',
        headingAr: 'تسجيل قراءات الضغط المنزلية لسبعة أيام',
        headingEn: 'Keeping a Seven-Day Home Blood Pressure Log',
        paragraphsAr: [
          'تتأثر قراءة ضغط الدم داخل العيادة أحياناً بالتوتر المؤقت أو الازدحام قبل الموعد. لذلك يفضّل قياس الضغط في المنزل صباحاً ومساءً لمدة أسبوع قبل الزيارة وتدوين النتائج بوضوح.'
        ],
        paragraphsEn: [
          'In-clinic blood pressure readings can occasionally elevate due to commuting stress or waiting room anxiety. Logging morning and evening readings at home for seven days gives your clinician far cleaner context.'
        ],
      },
      {
        id: 'day-of-visit-checklist',
        headingAr: 'قائمة سريعة ليوم الموعد',
        headingEn: 'Day-of-Appointment Checklist',
        paragraphsAr: [
          'لضمان دقة القياسات الحيوية وتخطيط القلب خلال الزيارة، يُنصح بالالتزام بالنقاط التنظيمية التالية:'
        ],
        paragraphsEn: [
          'To ensure accurate vital signs and ECG assessment during your consultation, follow these straightforward preparation steps:'
        ],
        bulletPointsAr: [
          'تجنب المشروبات المنبهة (القهوة والشاي) قبل القياس بساعتين على الأقل.',
          'إحضار قائمة محدثة بالأدوية والمكملات الغذائية الحالية.',
          'الحضور قبل الموعد بعشر دقائق للراحة والهدوء قبل أخذ العلامات الحيوية.'
        ],
        bulletPointsEn: [
          'Avoid caffeinated beverages for at least two hours prior to your measurement.',
          'Bring an updated list of current prescriptions and over-the-counter supplements.',
          'Arrive 10 minutes early to rest quietly before vital signs are recorded.'
        ],
      },
      {
        id: 'digital-prescriptions-followup',
        headingAr: 'الاحتفاظ بالوصفات الرقمية والمتابعة المنظمة',
        headingEn: 'Keeping Structured Digital Prescriptions for Follow-Up',
        paragraphsAr: [
          'تتيح البوابة الرقمية للمريض مراجعة الجرعات الدقيقة وتحميل الوصفة الطبية بصيغة قابلة للطباعة في أي وقت، مما يمنع نسيان التعليمات بعد مغادرة العيادة. هذا المحتوى إرشادي عام ولا يغني عن الاستشارة الطبية المباشرة.'
        ],
        paragraphsEn: [
          'Having digital access to structured dosage schedules and printable prescriptions helps patients follow care plans accurately after leaving the clinic. Note: This fictional article is for demonstration purposes and does not constitute medical advice.'
        ],
      },
    ],
  },
  {
    slug: 'designing-calm-digital-front-door-for-clinics',
    categoryAr: 'التحول الرقمي الطبي',
    categoryEn: 'Digital Healthcare',
    titleAr: 'تصميم البوابة الرقمية الهادئة للعيادات الحديثة: مبادئ تجربة المريض',
    titleEn: 'Designing a Calm Digital Front Door for Modern Specialty Clinics',
    excerptAr:
      'لماذا يتفوق التصميم الطبي الهادئ والواضح على المواقع المزدحمة في رفع نسبة إتمام الحجوزات من الهاتف المحمول.',
    excerptEn:
      'Why structured typography, clear availability states, and mobile-first booking flows outperform cluttered healthcare portals.',
    publishedAt: '2026-11-10',
    authorAr: 'فريق شفاء فلو للتصميم',
    authorEn: 'ShifaFlow Product Team',
    authorRoleAr: 'فريق المنتج (مفهوم عرض مستقل)',
    authorRoleEn: 'Product Design (Independent Concept)',
    coverImage: '/images/bento-suite.jpg',
    sections: [
      {
        id: 'clarity-under-stress',
        headingAr: 'الوضوح البصري حين يكون المريض في عجلة من أمره',
        headingEn: 'Visual Clarity When Patients Need Answers Quickly',
        paragraphsAr: [
          'يزور أغلب المرضى موقع العيادة عبر الهاتف المحمول بحثاً عن أمرين محددين: هل التخصص والطبيب متاحان؟ وما أقرب موعد مؤكد؟ كلما قلّت الخطوات المشتتة، ارتفعت ثقة المريض بالمركز الطبي.'
        ],
        paragraphsEn: [
          'Most patients visit a clinic website from their phone looking for two immediate answers: Is the right specialist available, and what is the earliest confirmed slot? Removing visual clutter builds instant clinical trust.'
        ],
      },
      {
        id: 'bilingual-rtl-ltr-craft',
        headingAr: 'الاتقان الحقيقي للواجهات ثنائية اللغة (RTL و LTR)',
        headingEn: 'True Bilingual Craft Across Arabic RTL and English LTR',
        paragraphsAr: [
          'دعم اللغة العربية لا يعني مجرد ترجمة حرفية للنصوص، بل يتطلب محاذاة مدروسة للجداول، أرقاماً جدولية متناسقة في الأوقات والتسعير، وتوازناً بصرياً بين الخط العربي والإنجليزي.'
        ],
        paragraphsEn: [
          'Genuine bilingual healthcare software requires directional layout mirroring, aligned tabular numerals for appointment times and fees, and balanced Arabic/Latin typography across every screen size.'
        ],
      },
    ],
  },
];

export function calculateReadingTimeMinutes(article: BlogArticle, lang: 'ar' | 'en'): number {
  const words = article.sections.reduce((acc, section) => {
    const title = lang === 'ar' ? section.headingAr : section.headingEn;
    const paras = lang === 'ar' ? section.paragraphsAr : section.paragraphsEn;
    const bullets = (lang === 'ar' ? section.bulletPointsAr : section.bulletPointsEn) || [];
    const text = [title, ...paras, ...bullets].join(' ');
    return acc + text.trim().split(/\s+/).length;
  }, 0);
  return Math.max(2, Math.ceil(words / 180));
}

export interface ChangelogEntry {
  version: string;
  date: string;
  categoryAr: string;
  categoryEn: string;
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  itemsAr: string[];
  itemsEn: string[];
}

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    version: '1.4.0',
    date: '2026-11-18',
    categoryAr: 'إطلاق رئيسي',
    categoryEn: 'Major Release',
    titleAr: 'محرك الحجز الخالي من التضارب وتذاكر الـ QR الفورية',
    titleEn: 'Conflict-Free Slot Locking & Instant QR Booking Tickets',
    summaryAr:
      'تحديث شامل لمعالج الحجز العام المكون من 4 خطوات مع فحص فوري في قاعدة البيانات وإصدار تذاكر قابلة للطباعة والمشاركة.',
    summaryEn:
      'Complete 4-step public booking wizard backed by PostgreSQL availability checks, printable tickets, and WhatsApp share links.',
    itemsAr: [
      'قفل تلقائي للأوقات المحجوزة فور تأكيد الحجز لمنع التكرار.',
      'توليد رمز QR فريد لكل تذكرة مع رقم مرجعي بصيغة SHF-YYYY-XXXX.',
      'دعم مشاركة تفاصيل الموعد عبر رابط واتساب جاهز بلمسة واحدة.'
    ],
    itemsEn: [
      'Real-time database locking of booked slots to prevent double-booking.',
      'Dynamic QR code ticket generation with unique SHF-YYYY-XXXX reference codes.',
      'One-tap WhatsApp summary sharing and print-optimized ticket stylesheet.'
    ],
  },
  {
    version: '1.3.0',
    date: '2026-11-04',
    categoryAr: 'لوحة العيادة',
    categoryEn: 'Clinic ERP',
    titleAr: 'جداول TanStack التفاعلية وإدارة دوام وإجازات الأطباء',
    titleEn: 'TanStack Operational Tables & Doctor Shift Scheduling',
    summaryAr:
      'تحسين تدفق العمل اليومي لموظفي الاستقبال والأطباء عبر تحديث الحالة بنقرة واحدة وتصدير CSV فوري.',
    summaryEn:
      'Streamlined daily operations for receptionists and physicians with one-click status transitions and instant CSV exports.',
    itemsAr: [
      'تغيير حالة المريض مباشرة (تم الوصول، داخل العيادة، مكتمل، ملغى).',
      'تصدير جدول المواعيد المفلتر إلى ملف CSV متوافق مع جداول البيانات.',
      'تبديل حالة الطبيب (نشط / في إجازة) مع تحديث فوري للأوقات المتاحة.'
    ],
    itemsEn: [
      'One-click appointment lifecycle transitions (Checked-In, In Consultation, Completed, Cancelled).',
      'Client-side UTF-8 CSV export respecting active table filters.',
      'Doctor shift configuration and leave toggles synchronized with public booking.'
    ],
  },
  {
    version: '1.2.0',
    date: '2026-10-15',
    categoryAr: 'بوابة المريض',
    categoryEn: 'Patient Portal',
    titleAr: 'إعادة الجدولة الذاتية وتحميل الوصفات الطبية بصيغة PDF',
    titleEn: 'Self-Service Rescheduling & Printable PDF Prescriptions',
    summaryAr:
      'تمكين المرضى من متابعة سجل زياراتهم، تعديل المواعيد القادمة، وحفظ الوصفات الطبية المنسقة للطباعة.',
    summaryEn:
      'Empowering patients to review visit history, reschedule upcoming appointments, and export formatted prescriptions.',
    itemsAr: [
      'واجهة بوابة مريض ثنائية اللغة مع التحقق الفوري من توفر الموعد البديل.',
      'قالب وصفة طبية نظيف ومهيأ للطباعة والحفظ كملف PDF من المتصفح.',
      'دعم كامل للوضع الليلي والنهاري عبر جميع شاشات المنصة.'
    ],
    itemsEn: [
      'Bilingual patient portal with real-time slot validation during rescheduling.',
      'Print-ready prescription PDF view with structured dosage and physician details.',
      'Full Light/Dark mode parity and RTL/LTR direction mirroring.'
    ],
  },
];
