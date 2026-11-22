'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { SiteHeader } from '@/src/components/SiteHeader';
import { SiteFooter } from '@/src/components/SiteFooter';
import { useApp } from '@/src/components/AppProvider';
import { BLOG_ARTICLES, calculateReadingTimeMinutes } from '@/src/lib/content';
import { t } from '@/src/lib/i18n';

export default function BlogArticlePage() {
  const { lang } = useApp();
  const params = useParams<{ slug: string }>();
  const article = BLOG_ARTICLES.find((a) => a.slug === params?.slug);

  const BackArrow = lang === 'ar' ? ArrowRight : ArrowLeft;

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100">
        <SiteHeader />
        <main className="flex-1 mx-auto max-w-3xl px-4 py-20 text-center space-y-4">
          <h1 className="text-2xl font-bold">
            {t(lang, 'المقال غير موجود', 'Article Not Found')}
          </h1>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            <BackArrow className="h-4 w-4" />
            <span>{t(lang, 'العودة للمدونة', 'Back to Blog')}</span>
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const minutes = calculateReadingTimeMinutes(article, lang);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100">
      <SiteHeader />

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline mb-6"
        >
          <BackArrow className="h-3.5 w-3.5" />
          <span>{t(lang, 'العودة إلى المدونة الطبية', 'Back to Medical Blog')}</span>
        </Link>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Article Body */}
          <article className="lg:col-span-8 space-y-8">
            <header className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                <span className="font-semibold text-teal-700 dark:text-teal-400">
                  {lang === 'ar' ? article.categoryAr : article.categoryEn}
                </span>
                <span aria-hidden="true">·</span>
                <span>{article.publishedAt}</span>
                <span aria-hidden="true">·</span>
                <span>
                  {minutes} {t(lang, 'دقائق قراءة', 'min read')}
                </span>
              </div>

              <h1
                className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight"
                style={{ textWrap: 'balance' }}
              >
                {lang === 'ar' ? article.titleAr : article.titleEn}
              </h1>

              <div className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-900 dark:text-slate-200">
                  {lang === 'ar' ? article.authorAr : article.authorEn}
                </span>{' '}
                — {lang === 'ar' ? article.authorRoleAr : article.authorRoleEn}
              </div>
            </header>

            <div className="aspect-[16/9] overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
              <img
                src={article.coverImage}
                alt={lang === 'ar' ? article.titleAr : article.titleEn}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="space-y-10 max-w-prose">
              {article.sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-24 space-y-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    {lang === 'ar' ? section.headingAr : section.headingEn}
                  </h2>
                  {(lang === 'ar' ? section.paragraphsAr : section.paragraphsEn).map((p, idx) => (
                    <p
                      key={idx}
                      className="text-base leading-7 text-slate-700 dark:text-slate-300"
                    >
                      {p}
                    </p>
                  ))}
                  {((lang === 'ar' ? section.bulletPointsAr : section.bulletPointsEn) || [])
                    .length > 0 && (
                    <ul className="list-disc ps-5 space-y-2 text-sm leading-7 text-slate-700 dark:text-slate-300">
                      {((lang === 'ar' ? section.bulletPointsAr : section.bulletPointsEn) || []).map(
                        (point, idx) => (
                          <li key={idx}>{point}</li>
                        )
                      )}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          </article>

          {/* Auto-Generated Sticky Table of Contents */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {t(lang, 'فهرس المحتويات', 'Table of Contents')}
                </div>
                <nav aria-label="Table of contents" className="space-y-2">
                  {article.sections.map((sec, i) => (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      className="block text-sm text-slate-700 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-400 transition-colors"
                    >
                      <span className="tabular-nums text-slate-400 me-2">0{i + 1}.</span>
                      {lang === 'ar' ? sec.headingAr : sec.headingEn}
                    </a>
                  ))}
                </nav>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t(lang, 'هل تبحث عن موعد طبي؟', 'Need to schedule a consultation?')}
                </h3>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {t(
                    lang,
                    'تصفح الأوقات المتاحة فعلياً واحصل على تذكرة QR مؤكدة خلال ثوانٍ.',
                    'Check live available physician slots and receive an instant QR ticket.'
                  )}
                </p>
                <Link
                  href="/book"
                  className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-teal-600 px-4 text-xs font-semibold text-white hover:bg-teal-700 transition-colors"
                >
                  {t(lang, 'احجز موعداً الآن', 'Book Appointment')}
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
