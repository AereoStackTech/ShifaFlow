'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { SiteHeader } from '@/src/components/SiteHeader';
import { SiteFooter } from '@/src/components/SiteFooter';
import { useApp } from '@/src/components/AppProvider';
import { t } from '@/src/lib/i18n';

export default function ResetPasswordPage() {
  const { lang } = useApp();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100">
      <SiteHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6">
          {submitted ? (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="h-10 w-10 text-teal-600 dark:text-teal-400 mx-auto" />
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {t(lang, 'تم استلام طلب الاستعادة', 'Reset Request Recorded')}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {t(
                  lang,
                  `في بيئة الإنتاج سيتم إرسال رابط آمن إلى ${email}. يمكنك في هذا العرض التفاعلي استخدام تسجيل الدخول السريع بالأدوار من صفحة الدخول.`,
                  `In a live deployment, a secure reset link would be dispatched to ${email}. For this portfolio demo, you may sign in directly via the role switcher.`
                )}
              </p>
              <Link
                href="/login"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-teal-600 px-5 text-sm font-semibold text-white hover:bg-teal-700"
              >
                {t(lang, 'العودة لتسجيل الدخول', 'Return to Sign In')}
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {t(lang, 'استعادة كلمة المرور', 'Reset Password')}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t(
                    lang,
                    'أدخل بريدك الإلكتروني المسجّل لاستلام تعليمات إعادة تعيين كلمة المرور.',
                    'Enter your registered email address to request a password reset link.'
                  )}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t(lang, 'البريد الإلكتروني', 'Email Address')}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@clinic.com"
                    className="h-11 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="h-11 w-full rounded-lg bg-teal-600 text-sm font-semibold text-white hover:bg-teal-700 transition-colors cursor-pointer"
                >
                  {t(lang, 'إرسال رابط الاستعادة', 'Send Reset Instructions')}
                </button>
              </form>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline"
                >
                  {t(lang, 'العودة إلى تسجيل الدخول', 'Back to Sign In')}
                </Link>
              </div>
            </>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
