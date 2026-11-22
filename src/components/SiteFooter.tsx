'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/src/components/AppProvider';
import { t } from '@/src/lib/i18n';

export function SiteFooter() {
  const { lang } = useApp();

  return (
    <footer className="no-print border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] text-slate-600 dark:text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-teal-600 text-xs font-bold text-white">
                S
              </span>
              <span>{t(lang, 'شفاء فلو — ShifaFlow', 'ShifaFlow')}</span>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {t(
                lang,
                'منصة سحابية لإدارة العيادات والمراكز الطبية وتنظيم حجز المواعيد دون تضارب، مصممة لوضوح العمليات اليومية وثقة المريض.',
                'Cloud-based medical clinic ERP and conflict-free patient appointment scheduling platform designed for operational clarity and calm clinical workflows.'
              )}
            </p>
            <p className="max-w-lg text-xs leading-relaxed text-slate-500 dark:text-slate-500 pt-2">
              {t(
                lang,
                'تنويه: شفاء فلو هو مشروع عرض مستقل (Independent Portfolio Concept) غير تابع لأي مؤسسة طبية أو مزود تجاري. جميع العيادات والأطباء والوصفات الطبية والأسعار المعروضة هي بيانات افتراضية بالكامل لأغراض العرض التقني.',
                'Portfolio Notice: ShifaFlow is an independent portfolio SaaS demonstration concept unaffiliated with any commercial medical provider or healthcare institution. All clinics, doctors, patient records, prescriptions, and pricing tiers are entirely fictional.'
              )}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t(lang, 'المنصة', 'Platform')}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/book" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                  {t(lang, 'حجز موعد طبي', 'Book Appointment')}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                  {t(lang, 'باقات العيادات', 'Clinic Pricing')}
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                  {t(lang, 'لوحة تحكم العيادة', 'Clinic ERP Dashboard')}
                </Link>
              </li>
              <li>
                <Link href="/patient" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                  {t(lang, 'بوابة المريض', 'Patient Portal')}
                </Link>
              </li>
              <li>
                <Link href="/onboarding" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                  {t(lang, 'معالج إعداد العيادة', 'Clinic Setup Wizard')}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t(lang, 'المعرفة والسياسات', 'Resources & Legal')}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/blog" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                  {t(lang, 'المدونة الطبية', 'Medical Blog')}
                </Link>
              </li>
              <li>
                <Link href="/changelog" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                  {t(lang, 'سجل التحديثات', 'Product Changelog')}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                  {t(lang, 'سياسة الخصوصية', 'Privacy Policy')}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                  {t(lang, 'شروط الاستخدام', 'Terms of Service')}
                </Link>
              </li>
              <li>
                <Link href="/refund" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                  {t(lang, 'سياسة الاسترداد', 'Refund Policy')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 dark:border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-500">
          <span>
            © 2026 {t(lang, 'شفاء فلو — مفهوم منصة إدارة عيادات مستقل', 'ShifaFlow — Independent Clinic SaaS Concept')}
          </span>
          <span className="tabular-nums">
            {t(lang, 'دعم كامل للغتين العربية والإنجليزية • RTL / LTR', 'Bilingual Arabic & English • RTL / LTR Ready')}
          </span>
        </div>
      </div>
    </footer>
  );
}
