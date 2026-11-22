'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { SiteHeader } from '@/src/components/SiteHeader';
import { SiteFooter } from '@/src/components/SiteFooter';
import { useApp } from '@/src/components/AppProvider';
import { BLOG_ARTICLES, calculateReadingTimeMinutes } from '@/src/lib/content';
import { t } from '@/src/lib/i18n';

export default function BlogIndexPage() {
  const { lang } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = Array.from(
    new Set(BLOG_ARTICLES.map((a) => (lang === 'ar' ? a.categoryAr : a.categoryEn)))
  );

  const filtered =
    selectedCategory === 'ALL'
      ? BLOG_ARTICLES
      : BLOG_ARTICLES.filter(
          (a) => (lang === 'ar' ? a.categoryAr : a.categoryEn) === selectedCategory
        );

  const DirArrow = lang === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100">
      <SiteHeader />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-8">
          <div className="max-w-2xl space-y-2">
            <div className="text-xs font-semibold text-teal-700 dark:text-teal-400">
              {t(lang, 'المدونة الطبية والتشغيلية', 'Medical & Clinic Operations Journal')}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t(
                lang,
                'مقالات إرشادية حول تنظيم العيادات وتجربة المريض',
                'Insights on clinic scheduling, patient care, and digital operations'
              )}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {t(lang, 'جميع المقالات', 'All Articles')}
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
          {filtered.map((article) => {
            const minutes = calculateReadingTimeMinutes(article, lang);
            return (
              <article
                key={article.slug}
                className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={article.coverImage}
                      alt={lang === 'ar' ? article.titleAr : article.titleEn}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      <span className="font-medium text-teal-700 dark:text-teal-400">
                        {lang === 'ar' ? article.categoryAr : article.categoryEn}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{article.publishedAt}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {minutes} {t(lang, 'دقائق قراءة', 'min read')}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold leading-snug text-slate-900 dark:text-white">
                      <Link
                        href={`/blog/${article.slug}`}
                        className="hover:text-teal-700 dark:hover:text-teal-400 transition-colors"
                      >
                        {lang === 'ar' ? article.titleAr : article.titleEn}
                      </Link>
                    </h2>

                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {lang === 'ar' ? article.excerptAr : article.excerptEn}
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    {lang === 'ar' ? article.authorAr : article.authorEn}
                  </span>
                  <Link
                    href={`/blog/${article.slug}`}
                    className="inline-flex items-center gap-1 font-semibold text-teal-700 dark:text-teal-400 hover:underline"
                  >
                    <span>{t(lang, 'اقرأ المقال', 'Read')}</span>
                    <DirArrow className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
