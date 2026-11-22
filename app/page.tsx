'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CalendarCheck,
  Clock,
  FileText,
  LayoutDashboard,
  QrCode,
  Search,
  ShieldCheck,
  Stethoscope,
  Users,
} from 'lucide-react';
import { SiteHeader } from '@/src/components/SiteHeader';
import { SiteFooter } from '@/src/components/SiteFooter';
import { useApp } from '@/src/components/AppProvider';
import { formatCurrency, t } from '@/src/lib/i18n';

interface CatalogSpecialty {
  id: number;
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  consultationFee: number;
  durationMin: number;
}

interface CatalogDoctor {
  id: number;
  specialtyId: number;
  nameAr: string;
  nameEn: string;
  titleAr: string;
  titleEn: string;
  bioAr: string;
  bioEn: string;
  roomNumber: string;
  consultationFee: number;
  yearsExperience: number;
  status: string;
  rating: string;
  specialtyNameAr: string;
  specialtyNameEn: string;
}

interface CatalogClinic {
  nameAr: string;
  nameEn: string;
  cityAr: string;
  cityEn: string;
  currency: string;
  workStart: string;
  workEnd: string;
}

export default function HomePage() {
  const { lang } = useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clinic, setClinic] = useState<CatalogClinic | null>(null);
  const [specialties, setSpecialties] = useState<CatalogSpecialty[]>([]);
  const [doctors, setDoctors] = useState<CatalogDoctor[]>([]);

  // Hero Quick Search State
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );

  // Directory Filter State
  const [directorySpecFilter, setDirectorySpecFilter] = useState<number | 'ALL'>('ALL');

  useEffect(() => {
    let active = true;
    fetch('/api/public/catalog')
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        setClinic(data.clinic ?? null);
        setSpecialties(data.specialties ?? []);
        setDoctors(data.doctors ?? []);
      })
      .catch((err) => console.error('Catalog load error:', err))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const heroFilteredDoctors = useMemo(() => {
    if (!selectedSpecialtyId) return doctors;
    return doctors.filter((d) => String(d.specialtyId) === selectedSpecialtyId);
  }, [doctors, selectedSpecialtyId]);

  const directoryDoctors = useMemo(() => {
    if (directorySpecFilter === 'ALL') return doctors;
    return doctors.filter((d) => d.specialtyId === directorySpecFilter);
  }, [doctors, directorySpecFilter]);

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedSpecialtyId) params.set('specialtyId', selectedSpecialtyId);
    if (selectedDoctorId) params.set('doctorId', selectedDoctorId);
    if (selectedDate) params.set('date', selectedDate);
    router.push(`/book${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const DirArrow = lang === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100">
      <SiteHeader />

      <main className="flex-1 pb-20 lg:pb-0">
        {/* Hero Section */}
        <section className="mx-auto max-w-7xl px-4 pt-10 pb-12 sm:px-6 lg:px-8 lg:pt-16">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <div className="text-xs font-medium text-teal-700 dark:text-teal-400">
                {t(
                  lang,
                  'منصة إدارة العيادات وحجز المواعيد السحابية · مفهوم عرض مستقل',
                  'Cloud Clinic ERP & Self-Service Booking · Independent SaaS Concept'
                )}
              </div>

              <h1
                className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.15]"
                style={{ textWrap: 'balance' }}
              >
                {t(
                  lang,
                  'نظام موحّد لتنظيم عيادتك ومنع تضارب المواعيد نهائياً',
                  'One calm workspace for conflict-free clinic scheduling and operations'
                )}
              </h1>

              <p className="max-w-xl text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                {t(
                  lang,
                  'استبدل فوضى الحجوزات الهاتفية بمحرك أوقات لحظي يغلق المواعيد المحجوزة تلقائياً، ويمنح المريض تذكرة QR مؤكدة خلال ثوانٍ، مع لوحة تحكم حية للأطباء والاستقبال.',
                  'Replace manual phone sheets with a real-time slot engine that locks booked times automatically, issues scannable QR tickets to patients, and equips staff with live KPI dashboards.'
                )}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href="/book"
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-teal-600 px-6 text-sm font-semibold text-white hover:bg-teal-700 transition-colors whitespace-nowrap shrink-0"
                >
                  <span>{t(lang, 'احجز موعداً الآن', 'Book Appointment')}</span>
                  <DirArrow className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                >
                  <span>{t(lang, 'جرّب لوحة العيادة (4 أدوار)', 'Explore Clinic ERP Demo')}</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative h-72 sm:h-96 lg:h-full min-h-[340px] w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
                <img
                  src="/images/hero-clinic.jpg"
                  alt={t(
                    lang,
                    'الممر المعماري وعيادات الاستشارة الحديثة في عيادة الشفاء التخصصية',
                    'Calm architectural glass consultation suites inside Al-Shifa Specialty Clinic'
                  )}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/35 to-transparent p-5 text-white">
                  <div className="text-xs text-slate-200">
                    {clinic
                      ? lang === 'ar'
                        ? `${clinic.nameAr} · ${clinic.cityAr}`
                        : `${clinic.nameEn} · ${clinic.cityEn}`
                      : t(
                          lang,
                          'عيادة الشفاء التخصصية · الرياض',
                          'Al-Shifa Specialty Clinic · Riyadh'
                        )}
                  </div>
                  <div className="mt-1 text-sm font-semibold">
                    {t(
                      lang,
                      'حجز فوري متعدد التخصصات مع تأكيد رقمي ومزامنة لحظية لمكتب الاستقبال',
                      'Instant multi-specialty self-booking synced directly to front-desk reception'
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Search Bar — Full Width Row Directly Below Hero Split */}
          <form
            onSubmit={handleQuickSearch}
            className="mt-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  {t(lang, 'التخصص الطبي', 'Medical Specialty')}
                </label>
                <select
                  value={selectedSpecialtyId}
                  onChange={(e) => {
                    setSelectedSpecialtyId(e.target.value);
                    setSelectedDoctorId('');
                  }}
                  className="h-11 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-100 focus:border-teal-600 focus:outline-none"
                >
                  <option value="">{t(lang, 'جميع التخصصات', 'All Specialties')}</option>
                  {specialties.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {lang === 'ar' ? s.nameAr : s.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  {t(lang, 'الطبيب المختص', 'Physician')}
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-100 focus:border-teal-600 focus:outline-none"
                >
                  <option value="">{t(lang, 'أي طبيب متاح', 'Any Available Doctor')}</option>
                  {heroFilteredDoctors.map((doc) => (
                    <option key={doc.id} value={String(doc.id)}>
                      {lang === 'ar' ? doc.nameAr : doc.nameEn} —{' '}
                      {lang === 'ar' ? doc.specialtyNameAr : doc.specialtyNameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  {t(lang, 'تاريخ الزيارة', 'Preferred Date')}
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm tabular-nums text-slate-900 dark:text-slate-100 focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-700 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Search className="h-4 w-4" />
                  <span>{t(lang, 'عرض الأوقات', 'Find Slots')}</span>
                </button>
              </div>
            </div>
          </form>

          {/* 4-Column Operational Metrics Strip (Full-Width Row) */}
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4 border-y border-slate-200 dark:border-slate-800 py-6">
            <div>
              <div className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
                0%
              </div>
              <div className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                {t(
                  lang,
                  'تضارب في المواعيد عبر القفل اللحظي بقاعدة البيانات',
                  'Double-booking overlap with database slot locking'
                )}
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
                {t(lang, '4 خطوات', '4 Steps')}
              </div>
              <div className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                {t(
                  lang,
                  'من اختيار التخصص حتى استلام تذكرة الـ QR الرقمية',
                  'From specialty selection to printable QR booking ticket'
                )}
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
                {t(lang, '4 أدوار', '4 Roles')}
              </div>
              <div className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                {t(
                  lang,
                  'صلاحيات منفصلة للمالك والطبيب والاستقبال والمريض',
                  'Granular RBAC for Owner, Doctor, Receptionist, Patient'
                )}
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
                AR / EN
              </div>
              <div className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                {t(
                  lang,
                  'دعم كامل لاتجاه RTL و LTR مع الوضع النهاري والليلي',
                  'Full RTL/LTR layout mirroring with Light & Dark themes'
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Bento Grid Features Showcase */}
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-2 mb-10">
            <div className="text-xs font-semibold text-teal-700 dark:text-teal-400">
              {t(lang, '٠١. بنية التشغيل السريري', '01. Clinical Operating Architecture')}
            </div>
            <h2
              className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white"
              style={{ textWrap: 'balance' }}
            >
              {t(
                lang,
                'كل ما يحتاجه المركز الطبي في منصة مترابطة واحدة',
                'Connected workflows from public self-booking to front-desk execution'
              )}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Marquee Card 1 (col-span-2) */}
            <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden grid grid-cols-1 md:grid-cols-2">
              <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <CalendarCheck className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {t(
                      lang,
                      'محرك أوقات ذكي يمنع تضارب الحجوزات',
                      'Real-Time Conflict-Free Slot Engine'
                    )}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {t(
                      lang,
                      'يحسب النظام المواعيد المفتوحة مباشرة من جدول دوام كل طبيب ويستبعد الأوقات المحجوزة وإجازات الأطباء تلقائياً في PostgreSQL قبل تأكيد أي حجز جديد.',
                      'Calculates live open windows from each clinician’s weekly shift template, automatically locking booked intervals and leave dates inside PostgreSQL before confirming.'
                    )}
                  </p>
                </div>
                <Link
                  href="/book"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 dark:text-teal-400 hover:underline"
                >
                  <span>{t(lang, 'جرّب معالج الحجز التفاعلي', 'Try the 4-step booking wizard')}</span>
                  <DirArrow className="h-4 w-4" />
                </Link>
              </div>
              <div className="h-56 md:h-auto bg-slate-100 dark:bg-slate-800">
                <img
                  src="/images/bento-suite.jpg"
                  alt={t(lang, 'غرفة استشارة طبية هادئة', 'Minimalist medical consultation suite')}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Card 2 */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <QrCode className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {t(lang, 'تذكرة حجز فورية مع رمز QR', 'Instant QR Ticket & WhatsApp Share')}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {t(
                    lang,
                    'يصدر النظام رقماً مرجعياً فريداً ورمز QR قابلاً للطباعة أو المشاركة عبر واتساب بلمسة واحدة لتسريع تسجيل الوصول.',
                    'Generates a unique reference ID, printable ticket view, dynamic QR code, and pre-filled WhatsApp summary immediately upon confirmation.'
                  )}
                </p>
              </div>
              <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                REF: SHF-2026-1001 · SUITE 101
              </div>
            </div>

            {/* Card 3 */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <LayoutDashboard className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {t(lang, 'لوحة ERP حية وتصدير CSV', 'Live Clinic ERP & TanStack Tables')}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {t(
                    lang,
                    'تابع حجوزات اليوم والمرضى في الانتظار والإيرادات اليومية ونسبة الإشغال، وحدّث حالة المريض بنقرة واحدة مع تصدير CSV فوري.',
                    'Monitor daily bookings, waiting queue, daily revenue, and occupancy rate. Filter appointments, update statuses in one click, and export CSV reports.'
                  )}
                </p>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 dark:text-teal-400 hover:underline"
              >
                <span>{t(lang, 'فتح لوحة التحكم', 'Open Clinic Dashboard')}</span>
                <DirArrow className="h-4 w-4" />
              </Link>
            </div>

            {/* Card 4 (col-span-2) */}
            <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="space-y-3">
                <FileText className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {t(
                    lang,
                    'بوابة مريض متكاملة مع وصفات PDF قابلة للتحميل',
                    'Self-Service Patient Portal & Printable PDF Prescriptions'
                  )}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {t(
                    lang,
                    'يتابع المريض مواعيده القادمة والسابقة، ويعيد جدولة الزيارة دون اتصال هاتفي، ويطبع أو يحفظ وصفاته الطبية المنسقة بصيغة PDF.',
                    'Patients track upcoming and completed visits, reschedule appointments against real open slots, and download formatted medical prescriptions as PDF.'
                  )}
                </p>
                <Link
                  href="/patient"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 dark:text-teal-400 hover:underline pt-1"
                >
                  <span>{t(lang, 'استعراض بوابة المريض', 'View Patient Portal')}</span>
                  <DirArrow className="h-4 w-4" />
                </Link>
              </div>

              <div className="border-t sm:border-t-0 sm:border-s border-slate-200 dark:border-slate-800 pt-4 sm:pt-0 sm:ps-6 space-y-3">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {t(lang, 'قابلية التوسع المعمارية', 'Built for Future Clinical Expansion')}
                </div>
                <ul className="space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400 mt-0.5 shrink-0" />
                    <span>
                      {t(
                        lang,
                        'عزل كامل للبيانات بين العيادات (Multi-tenant ClinicWorkspace)',
                        'Multi-tenant ClinicWorkspace isolation ready for group practices'
                      )}
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Users className="h-4 w-4 text-teal-600 dark:text-teal-400 mt-0.5 shrink-0" />
                    <span>
                      {t(
                        lang,
                        'بنية جاهزة للتكامل المستقبلي مع الفوترة الإلكترونية والمختبرات والصيدليات',
                        'Modular relational schema prepared for future e-invoicing, labs, and pharmacies'
                      )}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Specialties & Doctors Directory */}
        <section
          id="directory"
          className="border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 py-14"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                  {t(lang, '٠٢. دليل التخصصات والأطباء', '02. Specialties & Physicians Directory')}
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t(
                    lang,
                    'اختر التخصص واحجز مباشرة مع الطبيب المناسب',
                    'Browse specialties and book directly with your physician'
                  )}
                </h2>
              </div>

              {/* Interactive Filter Tabs (Functional Buttons) */}
              <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDirectorySpecFilter('ALL')}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    directorySpecFilter === 'ALL'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t(lang, 'الكل', 'All')}
                </button>
                {specialties.map((spec) => (
                  <button
                    key={spec.id}
                    type="button"
                    onClick={() => setDirectorySpecFilter(spec.id)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      directorySpecFilter === spec.id
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {lang === 'ar' ? spec.nameAr : spec.nameEn}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-52 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {directoryDoctors.map((doc) => {
                  const onLeave = doc.status === 'ON_LEAVE';
                  return (
                    <article
                      key={doc.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900 p-6 flex flex-col justify-between space-y-5"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                              {lang === 'ar' ? doc.nameAr : doc.nameEn}
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                              {lang === 'ar' ? doc.titleAr : doc.titleEn}
                            </p>
                          </div>
                          <span
                            className={`text-xs font-semibold whitespace-nowrap ${
                              onLeave
                                ? 'text-amber-700 dark:text-amber-400'
                                : 'text-emerald-700 dark:text-emerald-400'
                            }`}
                          >
                            {onLeave
                              ? t(lang, 'في إجازة', 'On Leave')
                              : t(lang, 'متاح للحجز', 'Available')}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          <span>{lang === 'ar' ? doc.specialtyNameAr : doc.specialtyNameEn}</span>
                          <span aria-hidden="true">·</span>
                          <span>{doc.roomNumber}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {doc.yearsExperience} {t(lang, 'سنة خبرة', 'yrs exp')}
                          </span>
                        </div>

                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                          {lang === 'ar' ? doc.bioAr : doc.bioEn}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4">
                        <div className="text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                          {formatCurrency(doc.consultationFee, clinic?.currency || 'SAR', lang)}
                        </div>
                        <Link
                          href={`/book?specialtyId=${doc.specialtyId}&doctorId=${doc.id}`}
                          className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-xs font-semibold transition-colors whitespace-nowrap ${
                            onLeave
                              ? 'border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                              : 'bg-teal-600 text-white hover:bg-teal-700'
                          }`}
                        >
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {onLeave
                              ? t(lang, 'عرض الجدول', 'View Schedule')
                              : t(lang, 'احجز موعداً', 'Book Slot')}
                          </span>
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Illustrative Testimonials (Fictional Portfolio Concept Personas) */}
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-2 mb-10">
            <div className="text-xs font-semibold text-teal-700 dark:text-teal-400">
              {t(lang, '٠٣. سيناريوهات الاستخدام', '03. Illustrative Workflow Outcomes')}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t(
                lang,
                'كيف يحسّن شفاء فلو تجربة المريض وفريق العيادة؟',
                'How structured scheduling transforms daily clinic routines'
              )}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                quoteAr:
                  'قبل التحول للحجز الرقمي، كان مكتب الاستقبال يقضي نصف الصباح في إعادة جدولة المواعيد المتداخلة. الآن كل طبيب يرى جدوله المؤكد بدقة والمريض يصل ومعه تذكرة الـ QR.',
                quoteEn:
                  'Before switching to real-time slot locking, reception spent half the morning untangling double-booked calls. Now every clinician sees an accurate queue and patients arrive with QR tickets.',
                nameAr: 'د. طارق المنصور',
                nameEn: 'Dr. Tariq Al-Mansour',
                roleAr: 'مدير عيادة الشفاء التخصصية (مثال افتراضي)',
                roleEn: 'Clinic Owner, Al-Shifa Specialty Clinic (Fictional)',
              },
              {
                quoteAr:
                  'أكثر ما أراحني كمريض هو رؤية الأوقات الحقيقية المتاحة للطبيبة واختيار الموعد المناسب خلال أقل من دقيقة، مع إمكانية طباعة وصفتي الطبية لاحقاً من بوابة المريض.',
                quoteEn:
                  'Being able to see genuinely open afternoon slots and receive a confirmed ticket in under a minute removed all phone wait time, and my prescriptions stay organized in one portal.',
                nameAr: 'خالد الشمري',
                nameEn: 'Khalid Al-Shammari',
                roleAr: 'مريض مسجّل (مثال افتراضي)',
                roleEn: 'Registered Patient (Fictional)',
              },
              {
                quoteAr:
                  'تغيير حالة المريض من "في الانتظار" إلى "داخل العيادة" بنقرة واحدة وتصدير جدول نهاية اليوم بصيغة CSV جعل إغلاق الوردية المسائية أسرع وأكثر دقة.',
                quoteEn:
                  'Moving arriving patients from Checked-In to In Consultation in one click and exporting filtered daily schedules to CSV made evening handoffs calm and predictable.',
                nameAr: 'سارة العتيبي',
                nameEn: 'Sara Al-Otaibi',
                roleAr: 'مسؤولة الاستقبال (مثال افتراضي)',
                roleEn: 'Front-Desk Receptionist (Fictional)',
              },
            ].map((item, idx) => (
              <blockquote
                key={idx}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between space-y-5"
              >
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  “{lang === 'ar' ? item.quoteAr : item.quoteEn}”
                </p>
                <footer className="border-t border-slate-100 dark:border-slate-800 pt-4">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {lang === 'ar' ? item.nameAr : item.nameEn}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {lang === 'ar' ? item.roleAr : item.roleEn}
                  </div>
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        {/* Final Conversion CTA */}
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t(
                  lang,
                  'جاهز لتجربة النظام كمالك عيادة أو مريض؟',
                  'Ready to test ShifaFlow as a Clinic Owner or Patient?'
                )}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t(
                  lang,
                  'استكشف معالج الحجز الفوري أو سجّل الدخول الفوري بأحد الأدوار الأربعة المجهزة ببيانات تجريبية كاملة.',
                  'Walk through the 4-step public booking wizard or sign in immediately with any of the four seeded demo roles.'
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/book"
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-teal-600 px-6 text-sm font-semibold text-white hover:bg-teal-700 transition-colors whitespace-nowrap"
              >
                <Stethoscope className="h-4 w-4" />
                <span>{t(lang, 'ابدأ الحجز الآن', 'Start Booking')}</span>
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-11 items-center rounded-lg border border-slate-300 dark:border-slate-700 px-5 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                {t(lang, 'استعراض الباقات', 'Compare Plans')}
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Mobile Compact Sticky Quick-Book Bar (<= 56px, total sticky <= 15% mobile viewport) */}
      <div className="no-print lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0B1120]/95 backdrop-blur-md px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 truncate">
          <Clock className="h-4 w-4 text-teal-600 shrink-0" />
          <span className="truncate">
            {t(lang, 'مواعيد اليوم متاحة للحجز الفوري', 'Same-day slots open now')}
          </span>
        </div>
        <Link
          href="/book"
          className="inline-flex h-9 items-center rounded-lg bg-teal-600 px-4 text-xs font-semibold text-white whitespace-nowrap shrink-0"
        >
          {t(lang, 'احجز الآن', 'Book Now')}
        </Link>
      </div>

      <SiteFooter />
    </div>
  );
}
