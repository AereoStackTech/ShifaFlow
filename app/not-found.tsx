'use client';

import React from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/src/components/SiteHeader';
import { SiteFooter } from '@/src/components/SiteFooter';
import { useApp } from '@/src/components/AppProvider';
import { t } from '@/src/lib/i18n';

export default function NotFound() {
  const { lang } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-md text-center space-y-4">
          <div className="font-mono text-5xl font-bold tabular-nums text-teal-600 dark:text-teal-400">
            404
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t(lang, 'الصفحة المطلوبة غير موجودة', 'Page Not Found')}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t(
              lang,
              'ربما تم نقل الرابط أو لم يعد متاحاً. يمكنك العودة للرئيسية أو بدء حجز موعد جديد.',
              'The page you requested could not be located. Return home or book a new appointment.'
            )}
          </p>
          <div className="pt-3 flex items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex h-10 items-center rounded-lg bg-teal-600 px-5 text-sm font-semibold text-white hover:bg-teal-700"
            >
              {t(lang, 'الصفحة الرئيسية', 'Back Home')}
            </Link>
            <Link
              href="/book"
              className="inline-flex h-10 items-center rounded-lg border border-slate-300 dark:border-slate-700 px-5 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {t(lang, 'حجز موعد', 'Book Appointment')}
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
