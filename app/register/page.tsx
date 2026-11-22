'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { SiteHeader } from '@/src/components/SiteHeader';
import { SiteFooter } from '@/src/components/SiteFooter';
import { type ClientUserRole, useApp } from '@/src/components/AppProvider';
import { t } from '@/src/lib/i18n';

function RegisterFormContent() {
  const { lang, registerWithEmail, loginWithGoogle, authLoading } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialRoleParam = searchParams.get('role');
  const initialPlan = searchParams.get('plan') || '';

  const [role, setRole] = useState<ClientUserRole>(
    initialRoleParam === 'CLINIC_OWNER' ? 'CLINIC_OWNER' : 'PATIENT'
  );
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const navigateAfterRegister = (createdRole: ClientUserRole) => {
    if (createdRole === 'CLINIC_OWNER') {
      router.push(`/onboarding${initialPlan ? `?plan=${initialPlan}` : ''}`);
    } else if (createdRole === 'PATIENT') {
      router.push('/patient');
    } else {
      router.push('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const user = await registerWithEmail({ fullName, email, password, phone, role });
      navigateAfterRegister(user.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to register.');
    }
  };

  const handleGoogle = async () => {
    setError(null);
    try {
      const user = await loginWithGoogle(role);
      navigateAfterRegister(user.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-up failed.');
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {t(lang, 'إنشاء حساب جديد', 'Create your ShifaFlow account')}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t(
            lang,
            'سجّل كمالك عيادة لإطلاق معالج الإعداد، أو كمريض لمتابعة مواعيدك ووصفاتك الطبية.',
            'Register as a Clinic Owner to launch the 3-step clinic setup wizard, or as a Patient.'
          )}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Role Selector */}
      <div>
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
          {t(lang, 'نوع الحساب', 'Account Role')}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { id: 'CLINIC_OWNER', ar: 'مالك عيادة', en: 'Clinic Owner' },
              { id: 'PATIENT', ar: 'مريض', en: 'Patient' },
              { id: 'DOCTOR', ar: 'طبيب', en: 'Doctor' },
              { id: 'RECEPTIONIST', ar: 'استقبال', en: 'Receptionist' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setRole(opt.id)}
              className={`h-10 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                role === opt.id
                  ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-200'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {lang === 'ar' ? opt.ar : opt.en}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={authLoading}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      >
        <span>{t(lang, 'التسجيل السريع عبر Google', 'Continue with Google')}</span>
      </button>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {t(lang, 'الاسم الكامل', 'Full Name')}
          </label>
          <input
            type="text"
            required
            minLength={2}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={t(lang, 'مثال: د. أحمد السالم', 'e.g., Dr. Ahmad Al-Salem')}
            className="h-11 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm focus:border-teal-600 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t(lang, 'البريد الإلكتروني', 'Email')}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="h-11 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm focus:border-teal-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t(lang, 'رقم الجوال', 'Phone')}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+966 50 000 0000"
              className="h-11 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm tabular-nums focus:border-teal-600 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {t(lang, 'كلمة المرور (8 أحرف على الأقل)', 'Password (min 8 characters)')}
          </label>
          <input
            type="password"
            required
            minLength={8}
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
            ? t(lang, 'جاري إنشاء الحساب...', 'Creating account...')
            : role === 'CLINIC_OWNER'
            ? t(lang, 'إنشاء الحساب والانتقال لإعداد العيادة', 'Create Account & Setup Clinic')
            : t(lang, 'إنشاء الحساب', 'Create Account')}
        </button>
      </form>

      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        {t(lang, 'لديك حساب بالفعل؟', 'Already have an account?')}{' '}
        <Link href="/login" className="font-semibold text-teal-700 dark:text-teal-400 hover:underline">
          {t(lang, 'تسجيل الدخول', 'Sign In')}
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Suspense
          fallback={
            <div className="w-full max-w-lg h-96 rounded-xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
          }
        >
          <RegisterFormContent />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
