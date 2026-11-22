'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, ClipboardCheck, ShieldCheck, Stethoscope, User } from 'lucide-react';
import { SiteHeader } from '@/src/components/SiteHeader';
import { SiteFooter } from '@/src/components/SiteFooter';
import { type ClientUserRole, useApp } from '@/src/components/AppProvider';
import { t } from '@/src/lib/i18n';

export default function LoginPage() {
  const { lang, loginWithEmail, loginWithGoogle, loginAsDemoRole, authLoading } = useApp();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const routeByRole = (role: ClientUserRole) => {
    if (role === 'PATIENT') {
      router.push('/patient');
    } else {
      router.push('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const user = await loginWithEmail(email, password);
      routeByRole(user.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    }
  };

  const handleGoogle = async () => {
    setError(null);
    try {
      const user = await loginWithGoogle('CLINIC_OWNER');
      routeByRole(user.role);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t(lang, 'تعذر تسجيل الدخول عبر Google.', 'Google sign-in was cancelled or failed.')
      );
    }
  };

  const handleDemoLogin = async (role: ClientUserRole) => {
    setError(null);
    try {
      const user = await loginAsDemoRole(role);
      routeByRole(user.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed.');
    }
  };

  const demoRoles: Array<{
    role: ClientUserRole;
    titleAr: string;
    titleEn: string;
    descAr: string;
    descEn: string;
    email: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      role: 'CLINIC_OWNER',
      titleAr: 'مالك العيادة',
      titleEn: 'Clinic Owner',
      descAr: 'د. طارق المنصور · لوحة المؤشرات، الأطباء، الإعدادات والباقات',
      descEn: 'Dr. Tariq Al-Mansour · KPIs, Doctors, Onboarding & Plans',
      email: 'owner@shifaflow.demo',
      icon: Building2,
    },
    {
      role: 'DOCTOR',
      titleAr: 'طبيب استشاري',
      titleEn: 'Physician',
      descAr: 'د. ليلى الحربي · متابعة المواعيد، حالات الكشف والورديات',
      descEn: 'Dr. Layla Al-Harbi · Daily consults, status & shift view',
      email: 'dr.layla@shifaflow.demo',
      icon: Stethoscope,
    },
    {
      role: 'RECEPTIONIST',
      titleAr: 'موظفة الاستقبال',
      titleEn: 'Receptionist',
      descAr: 'سارة العتيبي · تسجيل وصول المرضى، جدول المواعيد وتصدير CSV',
      descEn: 'Sara Al-Otaibi · Patient check-in, table filters & CSV export',
      email: 'reception@shifaflow.demo',
      icon: ClipboardCheck,
    },
    {
      role: 'PATIENT',
      titleAr: 'مريض مسجّل',
      titleEn: 'Patient Portal',
      descAr: 'خالد الشمري · مواعيدي، إعادة الجدولة وتحميل الوصفات PDF',
      descEn: 'Khalid Al-Shammari · Upcoming visits, rescheduling & PDF Rx',
      email: 'patient@shifaflow.demo',
      icon: User,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100">
      <SiteHeader />

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* Credentials & Google OAuth Card */}
          <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6">
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t(lang, 'تسجيل الدخول إلى شفاء فلو', 'Sign in to ShifaFlow')}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t(
                  lang,
                  'أدخل بريدك الإلكتروني أو استخدم حساب Google للوصول المباشر حسب صلاحيتك.',
                  'Use your email credentials or Google Sign-In for role-based workspace routing.'
                )}
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogle}
              disabled={authLoading}
              className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-60"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                />
                <path
                  fill="#34A853"
                  d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"
                />
                <path
                  fill="#EA4335"
                  d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                />
              </svg>
              <span>{t(lang, 'المتابعة باستخدام Google', 'Continue with Google')}</span>
            </button>

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
              <span className="mx-3 text-xs text-slate-400">
                {t(lang, 'أو عبر البريد الإلكتروني', 'or with email')}
              </span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
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

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t(lang, 'كلمة المرور', 'Password')}
                  </label>
                  <Link
                    href="/reset-password"
                    className="text-xs font-medium text-teal-700 dark:text-teal-400 hover:underline"
                  >
                    {t(lang, 'نسيت كلمة المرور؟', 'Forgot password?')}
                  </Link>
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="h-11 w-full rounded-lg bg-teal-600 text-sm font-semibold text-white hover:bg-teal-700 transition-colors cursor-pointer disabled:opacity-60"
              >
                {authLoading
                  ? t(lang, 'جاري التحقق...', 'Signing in...')
                  : t(lang, 'تسجيل الدخول', 'Sign In')}
              </button>
            </form>

            <p className="text-center text-sm text-slate-600 dark:text-slate-400">
              {t(lang, 'ليس لديك حساب؟', "Don't have an account?")}{' '}
              <Link
                href="/register"
                className="font-semibold text-teal-700 dark:text-teal-400 hover:underline"
              >
                {t(lang, 'إنشاء حساب جديد', 'Create Account')}
              </Link>
            </p>
          </div>

          {/* 4-Role Instant Demo Access Panel */}
          <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 text-xs font-semibold">
              <ShieldCheck className="h-4 w-4" />
              <span>
                {t(
                  lang,
                  'اختبار فوري لجميع الصلاحيات الأربعة (بيانات تجريبية)',
                  'Instant 4-Role RBAC Demo Switcher (Seeded Data)'
                )}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t(
                lang,
                'اختر دوراً لتجربة المنصة مباشرة بقاعدة بيانات PostgreSQL',
                'Sign in directly as any seeded fictional role'
              )}
            </h2>

            <div className="space-y-3">
              {demoRoles.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.role}
                    type="button"
                    disabled={authLoading}
                    onClick={() => handleDemoLogin(item.role)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-950/60 p-4 text-start hover:border-teal-500 dark:hover:border-teal-500 transition-colors flex items-start gap-3.5 cursor-pointer disabled:opacity-60"
                  >
                    <div className="mt-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 p-2 text-teal-700 dark:text-teal-400 shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {lang === 'ar' ? item.titleAr : item.titleEn}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {item.role}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                        {lang === 'ar' ? item.descAr : item.descEn}
                      </p>
                      <div className="mt-1 font-mono text-[11px] text-slate-400">{item.email}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
