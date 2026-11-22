'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown } from 'lucide-react';
import { SiteHeader } from '@/src/components/SiteHeader';
import { SiteFooter } from '@/src/components/SiteFooter';
import { useApp } from '@/src/components/AppProvider';
import { t } from '@/src/lib/i18n';

type PlanTier = 'SOLO_CLINIC' | 'MULTI_DOCTOR' | 'HOSPITAL_ENTERPRISE';

const PLANS: Array<{
  id: PlanTier;
  nameAr: string;
  nameEn: string;
  audienceAr: string;
  audienceEn: string;
  monthlyPrice: number;
  annualPrice: number;
  highlight?: boolean;
  featuresAr: string[];
  featuresEn: string[];
}> = [
  {
    id: 'SOLO_CLINIC',
    nameAr: 'عيادة فردية',
    nameEn: 'Solo Clinic',
    audienceAr: 'للأطباء المستقلين والعيادات ذات التخصص الواحد',
    audienceEn: 'For independent physicians and single-specialty practices',
    monthlyPrice: 59,
    annualPrice: 49,
    featuresAr: [
      'طبيب واحد + حساب استقبال واحد',
      'حجوزات غير محدودة مع قفل الأوقات تلقائياً',
      'تذاكر حجز رقمية مع رمز QR ومشاركة واتساب',
      'بوابة مريض مع وصفات طبية PDF',
    ],
    featuresEn: [
      '1 Physician + 1 Receptionist seat',
      'Unlimited bookings with automatic slot locking',
      'Instant QR booking tickets & WhatsApp share',
      'Patient portal with printable PDF prescriptions',
    ],
  },
  {
    id: 'MULTI_DOCTOR',
    nameAr: 'مركز متعدد الأطباء',
    nameEn: 'Multi-Doctor Center',
    audienceAr: 'للمراكز التخصصية التي تضم حتى ١٥ طبيباً',
    audienceEn: 'For growing multi-specialty medical centers up to 15 doctors',
    monthlyPrice: 179,
    annualPrice: 149,
    highlight: true,
    featuresAr: [
      'حتى ١٥ طبيباً و٦ موظفي استقبال بصلاحيات RBAC',
      'لوحة مؤشرات حية (الإيرادات، الإشغال، قوائم الانتظار)',
      'جداول TanStack مع فلترة متعددة وتصدير CSV',
      'إدارة ورديات وإجازات الأطباء بمزامنة فورية',
    ],
    featuresEn: [
      'Up to 15 doctors & 6 receptionists with full RBAC',
      'Live KPI analytics (daily revenue, occupancy, queue)',
      'TanStack tables with multi-column filtering & CSV export',
      'Doctor shift & leave schedules synced to public slots',
    ],
  },
  {
    id: 'HOSPITAL_ENTERPRISE',
    nameAr: 'مؤسسة طبية ومستشفى',
    nameEn: 'Hospital Enterprise',
    audienceAr: 'للمجموعات الطبية متعددة الفروع والأقسام',
    audienceEn: 'For multi-branch clinic groups and outpatient hospitals',
    monthlyPrice: 449,
    annualPrice: 369,
    featuresAr: [
      'أطباء وفروع وتخصصات غير محدودة (Multi-tenant)',
      'معالج إعداد مخصص وصلاحيات تدقيق متقدمة',
      'بنية جاهزة لتكاملات الفوترة والمختبرات والصيدليات',
      'أولوية الدعم الفني واتفاقية مستوى خدمة مخصصة',
    ],
    featuresEn: [
      'Unlimited doctors, branches & multi-tenant workspaces',
      'Custom onboarding workflows & granular role controls',
      'API-ready architecture for future labs, pharmacy & billing',
      'Dedicated onboarding support & custom SLA',
    ],
  },
];

const MATRIX_ROWS = [
  {
    featureAr: 'عدد الأطباء النشطين',
    featureEn: 'Active Physicians',
    solo: '1',
    multi: 'Up to 15',
    enterprise: 'Unlimited',
  },
  {
    featureAr: 'محرك منع تضارب المواعيد',
    featureEn: 'Conflict-Free Slot Locking',
    solo: 'Included',
    multi: 'Included',
    enterprise: 'Included',
  },
  {
    featureAr: 'تذاكر QR ومشاركة واتساب',
    featureEn: 'QR Tickets & WhatsApp Share',
    solo: 'Included',
    multi: 'Included',
    enterprise: 'Included',
  },
  {
    featureAr: 'لوحة مؤشرات الإيرادات والإشغال',
    featureEn: 'Live Revenue & Occupancy KPIs',
    solo: 'Basic',
    multi: 'Full Charts',
    enterprise: 'Multi-Branch',
  },
  {
    featureAr: 'تصدير بيانات المواعيد CSV',
    featureEn: 'CSV Operations Export',
    solo: 'Monthly',
    multi: 'Unlimited',
    enterprise: 'Unlimited + Scheduled',
  },
  {
    featureAr: 'بوابة المريض ووصفات PDF',
    featureEn: 'Patient Portal & PDF Rx',
    solo: 'Included',
    multi: 'Included',
    enterprise: 'Custom Branded',
  },
  {
    featureAr: 'عدد الفروع المدعومة',
    featureEn: 'Clinic Branches',
    solo: '1 Branch',
    multi: 'Up to 3',
    enterprise: 'Unlimited',
  },
];

const FAQS = [
  {
    qAr: 'هل الأسعار المعروضة تمثل اشتراكاً فعلياً ببوابة دفع؟',
    qEn: 'Do these plans charge a real credit card?',
    aAr: 'لا. شفاء فلو هو مفهوم عرض مستقل (Portfolio Concept). اختيار الباقة يقوم بتحديث حالة الاشتراك التجريبية لعيادتك في قاعدة البيانات مباشرة دون أي خصم مالي.',
    aEn: 'No. ShifaFlow is an independent portfolio concept. Selecting a plan updates your clinic workspace subscription record in PostgreSQL directly with no payment gateway charge.',
  },
  {
    qAr: 'كيف يمنع النظام تضارب المواعيد بين الحجز العام والاستقبال؟',
    qEn: 'How does ShifaFlow prevent double-booking between public self-booking and reception?',
    aAr: 'كل طلب حجز يتحقق لحظياً من جدول المواعيد في PostgreSQL للطبيب والتاريخ والتوقيت نفسه، وإذا كان الوقت محجوزاً أو الطبيب في إجازة يتم رفض التكرار تلقائياً.',
    aEn: 'Every booking request validates live against PostgreSQL for the same doctor, date, and start time—returning a conflict guard if already taken or if the physician is on leave.',
  },
  {
    qAr: 'هل يمكن تغيير العملة وساعات العمل بعد إنشاء العيادة؟',
    qEn: 'Can clinic owners change currency and working hours later?',
    aAr: 'نعم، يمكن لمالك العيادة تعديل اسم العيادة والعملة (ر.س، د.إ، دولار، ج.م) وساعات الدوام ومدة الكشفية الافتراضية في أي وقت عبر معالج الإعداد (/onboarding).',
    aEn: 'Yes. Clinic Owners can update clinic name, currency (SAR, AED, USD, EGP), working hours, and default consultation duration anytime via the setup wizard (/onboarding).',
  },
  {
    qAr: 'هل يدعم النظام اللغتين العربية والإنجليزية للمريض والطبيب معاً؟',
    qEn: 'Does ShifaFlow support bilingual Arabic (RTL) and English (LTR) seamlessly?',
    aAr: 'نعم، يمكن التبديل الفوري بين العربية والإنجليزية والوضع النهاري والليلي من شريط التنقل العلوي في جميع صفحات المنصة بما فيها التذاكر والوصفات الطبية.',
    aEn: 'Yes. Users can switch instantaneously between Arabic (RTL) and English (LTR) as well as Light and Dark themes across marketing, booking, ERP, and patient screens.',
  },
];

export default function PricingPage() {
  const { lang, user, subscription, authFetch, refreshMe } = useApp();
  const router = useRouter();
  const [billing, setBilling] = useState<'ANNUAL' | 'MONTHLY'>('ANNUAL');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [savingTier, setSavingTier] = useState<PlanTier | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSelectPlan = async (tier: PlanTier) => {
    setNotice(null);
    if (!user) {
      router.push(`/register?role=CLINIC_OWNER&plan=${tier}`);
      return;
    }
    if (user.role !== 'CLINIC_OWNER') {
      setNotice(
        t(
          lang,
          'لتغيير باقة العيادة، يرجى تسجيل الدخول بحساب مالك العيادة (CLINIC_OWNER).',
          'Please sign in as a Clinic Owner to switch the active clinic subscription tier.'
        )
      );
      return;
    }

    setSavingTier(tier);
    try {
      const res = await authFetch('/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify({ planTier: tier, billingCycle: billing }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice(data.error || 'Could not update plan.');
      } else {
        await refreshMe();
        setNotice(
          t(
            lang,
            'تم تحديث باقة العيادة بنجاح في قاعدة البيانات.',
            'Clinic subscription tier updated successfully in PostgreSQL.'
          )
        );
      }
    } finally {
      setSavingTier(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100">
      <SiteHeader />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header & Billing Toggle */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="text-xs font-semibold text-teal-700 dark:text-teal-400">
            {t(lang, 'باقات افتراضية واضحة للعيادات والمراكز الطبية', 'Illustrative SaaS Pricing for Clinics')}
          </div>
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white"
            style={{ textWrap: 'balance' }}
          >
            {t(
              lang,
              'اختر الباقة المناسبة لحجم عيادتك وتخصصاتك',
              'Transparent tiers scaled to your clinic team'
            )}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            {t(
              lang,
              'جميع الباقات تشمل محرك الحجز الخالي من التضارب وتذاكر الـ QR ودعم اللغتين العربية والإنجليزية.',
              'Every plan includes conflict-free slot locking, instant QR booking tickets, and full Arabic/English bilingual support.'
            )}
          </p>

          <div className="pt-3 flex justify-center">
            <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1">
              <button
                type="button"
                onClick={() => setBilling('MONTHLY')}
                className={`rounded-md px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  billing === 'MONTHLY'
                    ? 'bg-slate-900 dark:bg-teal-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t(lang, 'فوترة شهرية', 'Monthly Billing')}
              </button>
              <button
                type="button"
                onClick={() => setBilling('ANNUAL')}
                className={`rounded-md px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  billing === 'ANNUAL'
                    ? 'bg-slate-900 dark:bg-teal-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t(lang, 'فوترة سنوية (وفر 17%)', 'Annual Billing (Save 17%)')}
              </button>
            </div>
          </div>
        </div>

        {notice && (
          <div className="mt-6 max-w-2xl mx-auto rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/40 px-4 py-3 text-center text-sm text-teal-800 dark:text-teal-200">
            {notice}
          </div>
        )}

        {/* Pricing Cards */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const price = billing === 'ANNUAL' ? plan.annualPrice : plan.monthlyPrice;
            const isCurrent = subscription?.planTier === plan.id && user?.role === 'CLINIC_OWNER';
            return (
              <div
                key={plan.id}
                className={`rounded-xl border p-7 flex flex-col justify-between space-y-6 bg-white dark:bg-slate-900 ${
                  plan.highlight
                    ? 'border-teal-600 dark:border-teal-500 ring-1 ring-teal-600/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {lang === 'ar' ? plan.nameAr : plan.nameEn}
                    </h2>
                    {plan.highlight && (
                      <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                        {t(lang, 'الأكثر اختياراً', 'Most Popular')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {lang === 'ar' ? plan.audienceAr : plan.audienceEn}
                  </p>

                  <div className="pt-2 flex items-baseline gap-1.5">
                    <span className="text-4xl font-bold tabular-nums text-slate-900 dark:text-white">
                      ${price}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {t(lang, '/ شهرياً (افتراضي)', '/ month (illustrative)')}
                    </span>
                  </div>

                  <ul className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-5 text-sm text-slate-700 dark:text-slate-300">
                    {(lang === 'ar' ? plan.featuresAr : plan.featuresEn).map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check className="h-4 w-4 text-teal-600 dark:text-teal-400 mt-0.5 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  disabled={savingTier === plan.id}
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`h-11 w-full rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60 ${
                    isCurrent
                      ? 'border border-teal-600 text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/30'
                      : plan.highlight
                      ? 'bg-teal-600 text-white hover:bg-teal-700'
                      : 'border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {savingTier === plan.id
                    ? t(lang, 'جاري التحديث...', 'Updating...')
                    : isCurrent
                    ? t(lang, 'الباقة النشطة حالياً', 'Current Active Plan')
                    : user?.role === 'CLINIC_OWNER'
                    ? t(lang, 'تفعيل هذه الباقة', 'Select This Plan')
                    : t(lang, 'ابدأ إعداد عيادتك', 'Start Clinic Setup')}
                </button>
              </div>
            );
          })}
        </div>

        {/* Comparison Matrix */}
        <section className="mt-16">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-6">
            {t(lang, 'جدول مقارنة الميزات والحدود', 'Feature & Capacity Comparison Matrix')}
          </h2>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
                  <th className="px-5 py-3.5 text-start font-semibold text-slate-700 dark:text-slate-200">
                    {t(lang, 'الميزة', 'Capability')}
                  </th>
                  <th className="px-5 py-3.5 text-start font-semibold text-slate-700 dark:text-slate-200">
                    {t(lang, 'عيادة فردية', 'Solo Clinic')}
                  </th>
                  <th className="px-5 py-3.5 text-start font-semibold text-teal-700 dark:text-teal-400">
                    {t(lang, 'مركز متعدد الأطباء', 'Multi-Doctor')}
                  </th>
                  <th className="px-5 py-3.5 text-start font-semibold text-slate-700 dark:text-slate-200">
                    {t(lang, 'مؤسسة طبية', 'Hospital Enterprise')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {MATRIX_ROWS.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                    <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                      {lang === 'ar' ? row.featureAr : row.featureEn}
                    </td>
                    <td className="px-5 py-3.5 tabular-nums text-slate-600 dark:text-slate-400">
                      {row.solo}
                    </td>
                    <td className="px-5 py-3.5 tabular-nums font-medium text-slate-900 dark:text-white">
                      {row.multi}
                    </td>
                    <td className="px-5 py-3.5 tabular-nums text-slate-600 dark:text-slate-400">
                      {row.enterprise}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ Accordion */}
        <section className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">
            {t(lang, 'الأسئلة الشائعة', 'Frequently Asked Questions')}
          </h2>

          <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start text-sm font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <span>{lang === 'ar' ? faq.qAr : faq.qEn}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-500 shrink-0 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {lang === 'ar' ? faq.aAr : faq.aEn}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
