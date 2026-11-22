'use client';

import React from 'react';
import { SiteHeader } from '@/src/components/SiteHeader';
import { SiteFooter } from '@/src/components/SiteFooter';
import { useApp } from '@/src/components/AppProvider';
import { CHANGELOG_ENTRIES } from '@/src/lib/content';
import { t } from '@/src/lib/i18n';

export default function ChangelogPage() {
  const { lang } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100">
      <SiteHeader />

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-8">
          <div className="text-xs font-semibold text-teal-700 dark:text-teal-400">
            {t(lang, 'سجل التحديثات والإصدارات', 'Product Release Notes')}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t(lang, 'تطورات منصة شفاء فلو', 'ShifaFlow Changelog')}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t(
              lang,
              'متابعة منظمة لتحسينات محرك المواعيد ولوحة العيادة وبوابة المريض.',
              'Structured history of improvements across scheduling, Clinic ERP, and the Patient Portal.'
            )}
          </p>
        </div>

        <div className="mt-10 space-y-10">
          {CHANGELOG_ENTRIES.map((entry) => (
            <article
              key={entry.version}
              className="grid grid-cols-1 gap-4 md:grid-cols-12 border-b border-slate-200 dark:border-slate-800 pb-10 last:border-b-0"
            >
              <div className="md:col-span-3 space-y-1">
                <div className="font-mono text-sm font-semibold tabular-nums text-teal-700 dark:text-teal-400">
                  v{entry.version}
                </div>
                <div className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                  {entry.date}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  {lang === 'ar' ? entry.categoryAr : entry.categoryEn}
                </div>
              </div>

              <div className="md:col-span-9 space-y-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {lang === 'ar' ? entry.titleAr : entry.titleEn}
                </h2>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {lang === 'ar' ? entry.summaryAr : entry.summaryEn}
                </p>
                <ul className="list-disc ps-5 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                  {(lang === 'ar' ? entry.itemsAr : entry.itemsEn).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
