'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2,
  CalendarDays,
  ClipboardCheck,
  ExternalLink,
  Globe,
  LayoutDashboard,
  LogOut,
  Moon,
  Settings,
  ShieldAlert,
  Stethoscope,
  Sun,
  Users,
} from 'lucide-react';
import { useApp } from '@/src/components/AppProvider';
import { ROLE_LABELS, t } from '@/src/lib/i18n';

export function DashboardShell({
  titleAr,
  titleEn,
  breadcrumbAr,
  breadcrumbEn,
  actions,
  children,
}: {
  titleAr: string;
  titleEn: string;
  breadcrumbAr: string;
  breadcrumbEn: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { lang, toggleLang, theme, toggleTheme, user, clinic, loginAsDemoRole, logout } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  const isStaff =
    user && (user.role === 'CLINIC_OWNER' || user.role === 'DOCTOR' || user.role === 'RECEPTIONIST');

  const navLinks = [
    {
      href: '/dashboard',
      labelAr: 'نظرة عامة ومؤشرات الأداء',
      labelEn: 'KPI Overview',
      icon: LayoutDashboard,
    },
    {
      href: '/dashboard/appointments',
      labelAr: 'إدارة المواعيد',
      labelEn: 'Appointments',
      icon: CalendarDays,
    },
    {
      href: '/dashboard/doctors',
      labelAr: 'الأطباء وجداول الدوام',
      labelEn: 'Doctors & Shifts',
      icon: Users,
    },
  ];

  const handleSignOut = async () => {
    await logout();
    router.push('/');
  };

  if (!isStaff) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100">
        <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-white text-sm font-bold">
              S
            </span>
            <span>{t(lang, 'شفاء فلو', 'ShifaFlow')}</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleLang}
              className="h-9 rounded-lg border border-slate-200 dark:border-slate-800 px-3 text-xs font-semibold cursor-pointer"
            >
              {lang === 'ar' ? 'EN' : 'AR'}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer"
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-xl w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-teal-50 dark:bg-teal-950/60 p-2.5 text-teal-700 dark:text-teal-400">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {t(lang, 'لوحة تحكم العيادة (صلاحيات الفريق الطبي)', 'Clinic ERP Workspace (Staff RBAC)')}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t(
                    lang,
                    'هذه الصفحة محمية لصلاحيات مالك العيادة، الطبيب، وموظف الاستقبال.',
                    'Protected for Clinic Owners, Physicians, and Front-Desk Receptionists.'
                  )}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => loginAsDemoRole('CLINIC_OWNER')}
                className="rounded-lg border border-slate-200 dark:border-slate-700 p-3.5 text-start hover:border-teal-500 transition-colors cursor-pointer"
              >
                <Building2 className="h-4 w-4 text-teal-600 mb-2" />
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {t(lang, 'مالك العيادة', 'Clinic Owner')}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {t(lang, 'كامل الصلاحيات', 'Full ERP access')}
                </div>
              </button>

              <button
                type="button"
                onClick={() => loginAsDemoRole('DOCTOR')}
                className="rounded-lg border border-slate-200 dark:border-slate-700 p-3.5 text-start hover:border-teal-500 transition-colors cursor-pointer"
              >
                <Stethoscope className="h-4 w-4 text-teal-600 mb-2" />
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {t(lang, 'الطبيب', 'Doctor')}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {t(lang, 'جدول الكشوفات', 'Clinical schedule')}
                </div>
              </button>

              <button
                type="button"
                onClick={() => loginAsDemoRole('RECEPTIONIST')}
                className="rounded-lg border border-slate-200 dark:border-slate-700 p-3.5 text-start hover:border-teal-500 transition-colors cursor-pointer"
              >
                <ClipboardCheck className="h-4 w-4 text-teal-600 mb-2" />
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {t(lang, 'الاستقبال', 'Receptionist')}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {t(lang, 'إدارة الوصول', 'Check-in desk')}
                </div>
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4 text-xs">
              <Link href="/login" className="font-semibold text-teal-700 dark:text-teal-400 hover:underline">
                {t(lang, 'تسجيل الدخول بالبريد أو Google', 'Sign in with Email or Google')}
              </Link>
              <Link href="/" className="text-slate-500 hover:text-slate-900 dark:hover:text-white">
                {t(lang, 'العودة للرئيسية', 'Return Home')}
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-e border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="h-16 px-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <Link href="/" className="font-bold text-base flex items-center gap-2 whitespace-nowrap">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-white text-xs font-bold">
              S
            </span>
            <span>{t(lang, 'شفاء فلو ERP', 'ShifaFlow ERP')}</span>
          </Link>
        </div>

        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
            {clinic
              ? lang === 'ar'
                ? clinic.nameAr
                : clinic.nameEn
              : t(lang, 'عيادة الشفاء التخصصية', 'Al-Shifa Specialty Clinic')}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {lang === 'ar' ? user.fullNameAr : user.fullNameEn} · {ROLE_LABELS[user.role]?.[lang]}
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{lang === 'ar' ? item.labelAr : item.labelEn}</span>
              </Link>
            );
          })}

          {user.role === 'CLINIC_OWNER' && (
            <Link
              href="/onboarding"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <Settings className="h-4 w-4 shrink-0" />
              <span className="truncate">{t(lang, 'إعدادات العيادة', 'Clinic Settings')}</span>
            </Link>
          )}

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
            <Link
              href="/book"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:text-teal-700 dark:hover:text-teal-400"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              <span>{t(lang, 'صفحة الحجز العام', 'Public Booking Page')}</span>
            </Link>
            <Link
              href="/pricing"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:text-teal-700 dark:hover:text-teal-400"
            >
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span>{t(lang, 'باقة الاشتراك', 'Subscription Plan')}</span>
            </Link>
          </div>
        </nav>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleLang}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 dark:border-slate-800 px-2.5 text-xs font-semibold cursor-pointer"
            >
              <Globe className="h-3.5 w-3.5 text-teal-600" />
              <span>{lang === 'ar' ? 'EN' : 'AR'}</span>
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 dark:border-slate-800 cursor-pointer"
            >
              {theme === 'light' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
            </button>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>{t(lang, 'خروج', 'Sign Out')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Workspace Header */}
        <header className="sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#0B1120]/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {t(lang, 'لوحة العيادة', 'Clinic ERP')} / {lang === 'ar' ? breadcrumbAr : breadcrumbEn}
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
              {lang === 'ar' ? titleAr : titleEn}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {actions}
            <div className="flex lg:hidden items-center gap-1.5">
              <button
                type="button"
                onClick={toggleLang}
                className="h-9 rounded-lg border border-slate-200 dark:border-slate-800 px-2.5 text-xs font-semibold cursor-pointer"
              >
                {lang === 'ar' ? 'EN' : 'AR'}
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer"
              >
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Sub-Navigation */}
        <div className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2 flex items-center gap-2 overflow-x-auto">
          {navLinks.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                }`}
              >
                {lang === 'ar' ? item.labelAr : item.labelEn}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={handleSignOut}
            className="ms-auto rounded-md px-2.5 py-1.5 text-xs font-semibold text-rose-600 whitespace-nowrap shrink-0"
          >
            {t(lang, 'خروج', 'Sign Out')}
          </button>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
