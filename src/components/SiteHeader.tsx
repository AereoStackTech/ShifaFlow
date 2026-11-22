'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Globe, LogOut, Menu, Moon, Sun, User, X } from 'lucide-react';
import { useApp } from '@/src/components/AppProvider';
import { ROLE_LABELS, t } from '@/src/lib/i18n';

export function SiteHeader() {
  const { lang, toggleLang, theme, toggleTheme, user, logout } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { href: '/book', label: t(lang, 'حجز موعد', 'Book') },
    { href: '/pricing', label: t(lang, 'الباقات', 'Pricing') },
    { href: '/blog', label: t(lang, 'المدونة', 'Blog') },
    { href: '/dashboard', label: t(lang, 'لوحة العيادة', 'Clinic ERP') },
    { href: '/patient', label: t(lang, 'بوابة المريض', 'Patient Portal') },
  ];

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    router.push('/');
  };

  return (
    <header className="no-print sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-[#0B1120]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single clean wordmark */}
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50 whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-white text-sm font-bold">
            S
          </span>
          <span>{t(lang, 'شفاء فلو', 'ShifaFlow')}</span>
        </Link>

        {/* Zone 2: Clean single-line text links */}
        <nav
          aria-label="Primary"
          className="hidden lg:flex items-center gap-7 text-sm font-medium"
        >
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== '/' && pathname?.startsWith(item.href + '/'));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
                  active
                    ? 'border-teal-600 text-teal-700 dark:text-teal-400'
                    : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: Language, Theme & Primary Action */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={toggleLang}
            aria-label={t(lang, 'التبديل إلى الإنجليزية', 'Switch to Arabic')}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Globe className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
            <span>{lang === 'ar' ? 'EN' : 'AR'}</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={t(lang, 'تبديل الوضع الليلي والنهاري', 'Toggle light and dark theme')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors shrink-0 cursor-pointer"
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>

          {user ? (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href={user.role === 'PATIENT' ? '/patient' : '/dashboard'}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-800 px-3 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
              >
                <User className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span className="max-w-[120px] truncate">
                  {lang === 'ar' ? user.fullNameAr : user.fullNameEn}
                </span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                title={t(lang, 'تسجيل الخروج', 'Sign Out')}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shrink-0 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden sm:inline-flex h-9 items-center rounded-lg bg-teal-600 px-4 text-xs font-semibold text-white hover:bg-teal-700 transition-colors whitespace-nowrap shrink-0"
            >
              {t(lang, 'تسجيل الدخول', 'Sign In')}
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={t(lang, 'القائمة', 'Toggle menu')}
            className="inline-flex lg:hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            {user ? (
              <>
                <div className="text-xs text-slate-600 dark:text-slate-300 truncate">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {lang === 'ar' ? user.fullNameAr : user.fullNameEn}
                  </div>
                  <div>{ROLE_LABELS[user.role]?.[lang]}</div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400"
                >
                  {t(lang, 'خروج', 'Sign Out')}
                </button>
              </>
            ) : (
              <div className="flex w-full gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center rounded-lg border border-slate-200 dark:border-slate-700 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  {t(lang, 'تسجيل الدخول', 'Sign In')}
                </Link>
                <Link
                  href="/book"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center rounded-lg bg-teal-600 py-2.5 text-xs font-semibold text-white"
                >
                  {t(lang, 'احجز الآن', 'Book Now')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
