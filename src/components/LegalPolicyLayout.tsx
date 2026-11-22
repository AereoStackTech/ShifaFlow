'use client';

import React from 'react';
import { SiteHeader } from '@/src/components/SiteHeader';
import { SiteFooter } from '@/src/components/SiteFooter';
import { useApp } from '@/src/components/AppProvider';
import { t } from '@/src/lib/i18n';

interface PolicySection {
  headingAr: string;
  headingEn: string;
  bodyAr: string;
  bodyEn: string;
}

export function LegalPolicyLayout({
  titleAr,
  titleEn,
  updatedDate,
  sections,
}: {
  titleAr: string;
  titleEn: string;
  updatedDate: string;
  sections: PolicySection[];
}) {
  const { lang } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100">
      <SiteHeader />

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-6 space-y-2">
          <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {t(lang, 'آخر تحديث:', 'Last updated:')} {updatedDate}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {lang === 'ar' ? titleAr : titleEn}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t(
              lang,
              'ملاحظة: شفاء فلو هو مشروع عرض مستقل (Portfolio Concept). هذه الوثيقة توضيحية لهيكلة السياسات القانونية في منصات SaaS الطبية.',
              'Notice: ShifaFlow is an independent portfolio SaaS concept. This document illustrates structured policy copy for demonstration purposes.'
            )}
          </p>
        </div>

        <div className="mt-8 space-y-8">
          {sections.map((sec, i) => (
            <section key={i} className="space-y-2.5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {i + 1}. {lang === 'ar' ? sec.headingAr : sec.headingEn}
              </h2>
              <p className="text-sm sm:text-base leading-7 text-slate-700 dark:text-slate-300">
                {lang === 'ar' ? sec.bodyAr : sec.bodyEn}
              </p>
            </section>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
