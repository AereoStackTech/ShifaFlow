'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Building2, Clock, Coins } from 'lucide-react';
import { SiteHeader } from '@/src/components/SiteHeader';
import { SiteFooter } from '@/src/components/SiteFooter';
import { useApp } from '@/src/components/AppProvider';
import { DAY_LABELS, t } from '@/src/lib/i18n';

function OnboardingWizardContent() {
  const { lang, user, clinic, authFetch, loginAsDemoRole, refreshMe } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get('plan') as
    | 'SOLO_CLINIC'
    | 'MULTI_DOCTOR'
    | 'HOSPITAL_ENTERPRISE'
    | null;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [nameAr, setNameAr] = useState(clinic?.nameAr || 'عيادة الشفاء التخصصية');
  const [nameEn, setNameEn] = useState(clinic?.nameEn || 'Al-Shifa Specialty Clinic');
  const [cityAr, setCityAr] = useState(clinic?.cityAr || 'الرياض، المملكة العربية السعودية');
  const [cityEn, setCityEn] = useState(clinic?.cityEn || 'Riyadh, Saudi Arabia');
  const [phone, setPhone] = useState(clinic?.phone || '+966 11 555 0140');

  const [currency, setCurrency] = useState<'SAR' | 'AED' | 'USD' | 'EGP'>(
    (clinic?.currency as 'SAR' | 'AED' | 'USD' | 'EGP') || 'SAR'
  );
  const [defaultDurationMin, setDefaultDurationMin] = useState<number>(
    clinic?.defaultDurationMin || 30
  );

  const [workStart, setWorkStart] = useState(clinic?.workStart || '09:00');
  const [workEnd, setWorkEnd] = useState(clinic?.workEnd || '17:00');
  const [workingDays, setWorkingDays] = useState<number[]>(() =>
    clinic?.workingDays
      ? clinic.workingDays
          .split(',')
          .map(Number)
          .filter((n) => !Number.isNaN(n))
      : [0, 1, 2, 3, 4, 6]
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'CLINIC_OWNER') return;
    let active = true;
    authFetch('/api/clinic/onboarding')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data?.clinic) return;
        const c = data.clinic;
        setNameAr(c.nameAr);
        setNameEn(c.nameEn);
        setCityAr(c.cityAr);
        setCityEn(c.cityEn);
        setPhone(c.phone);
        setCurrency((c.currency as 'SAR' | 'AED' | 'USD' | 'EGP') || 'SAR');
        setDefaultDurationMin(c.defaultDurationMin || 30);
        setWorkStart(c.workStart || '09:00');
        setWorkEnd(c.workEnd || '17:00');
        if (c.workingDays) {
          setWorkingDays(
            String(c.workingDays)
              .split(',')
              .map(Number)
              .filter((n: number) => !Number.isNaN(n))
          );
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user, authFetch]);

  const toggleDay = (day: number) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleFinish = async () => {
    setError(null);
    if (workingDays.length === 0) {
      setError(t(lang, 'يرجى اختيار يوم عمل واحد على الأقل.', 'Select at least one working day.'));
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch('/api/clinic/onboarding', {
        method: 'POST',
        body: JSON.stringify({
          nameAr,
          nameEn,
          cityAr,
          cityEn,
          phone,
          currency,
          workStart,
          workEnd,
          workingDays: workingDays.join(','),
          defaultDurationMin,
          planTier: planParam || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not save clinic settings.');
      } else {
        await refreshMe();
        router.push('/dashboard');
      }
    } catch {
      setError(t(lang, 'تعذر حفظ إعدادات العيادة.', 'Failed to save workspace configuration.'));
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.role !== 'CLINIC_OWNER') {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center space-y-4">
        <Building2 className="h-9 w-9 text-teal-600 dark:text-teal-400 mx-auto" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          {t(lang, 'معالج إعداد العيادة مخصص لمالك العيادة', 'Clinic Setup Wizard (Clinic Owner)')}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t(
            lang,
            'سجّل الدخول بحساب مالك العيادة (CLINIC_OWNER) لتخصيص اسم العيادة والعملة وساعات العمل.',
            'Sign in as a Clinic Owner to configure workspace branding, currency, and clinical hours.'
          )}
        </p>
        <div className="pt-2 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => loginAsDemoRole('CLINIC_OWNER')}
            className="h-10 rounded-lg bg-teal-600 px-5 text-sm font-semibold text-white hover:bg-teal-700 cursor-pointer"
          >
            {t(lang, 'الدخول الفوري كمالك عيادة (تجريبي)', 'Enter as Demo Clinic Owner')}
          </button>
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="h-10 rounded-lg border border-slate-300 dark:border-slate-700 px-5 text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
          >
            {t(lang, 'صفحة تسجيل الدخول', 'Go to Sign In')}
          </button>
        </div>
      </div>
    );
  }

  const stepsMeta = [
    { id: 1 as const, labelAr: 'هوية العيادة', labelEn: 'Clinic Profile', icon: Building2 },
    { id: 2 as const, labelAr: 'العملة ومدة الكشف', labelEn: 'Currency & Duration', icon: Coins },
    { id: 3 as const, labelAr: 'أيام وساعات الدوام', labelEn: 'Working Hours', icon: Clock },
  ];

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="space-y-1.5">
        <div className="text-xs font-semibold text-teal-700 dark:text-teal-400">
          {t(lang, 'معالج إعداد العيادة · ٣ خطوات', 'Clinic Workspace Onboarding · 3 Steps')}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          {t(lang, 'تهيئة إعدادات المركز الطبي', 'Configure Your Clinical Workspace')}
        </h1>
      </div>

      {/* Stepper */}
      <div className="grid grid-cols-3 gap-2">
        {stepsMeta.map((s) => {
          const active = step === s.id;
          const done = step > s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(s.id)}
              className={`rounded-lg border p-3 text-start transition-colors cursor-pointer ${
                active
                  ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40'
                  : done
                  ? 'border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-900'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold tabular-nums">
                <span className={active ? 'text-teal-700 dark:text-teal-400' : 'text-slate-500'}>
                  0{s.id}
                </span>
                {done && <Check className="h-3.5 w-3.5 text-emerald-600" />}
              </div>
              <div className="mt-1 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                {lang === 'ar' ? s.labelAr : s.labelEn}
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t(lang, 'اسم العيادة (بالعربية)', 'Clinic Name (Arabic)')}
                </label>
                <input
                  type="text"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t(lang, 'اسم العيادة (بالإنجليزية)', 'Clinic Name (English)')}
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t(lang, 'المدينة (عربي)', 'City (Arabic)')}
                </label>
                <input
                  type="text"
                  value={cityAr}
                  onChange={(e) => setCityAr(e.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t(lang, 'المدينة (إنجليزي)', 'City (English)')}
                </label>
                <input
                  type="text"
                  value={cityEn}
                  onChange={(e) => setCityEn(e.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t(lang, 'هاتف الاستقبال', 'Reception Phone')}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-11 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm tabular-nums focus:border-teal-600 focus:outline-none"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {t(lang, 'العملة الافتراضية للعيادة', 'Primary Clinic Currency')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(
                  [
                    { code: 'SAR', labelAr: 'ريال سعودي (SAR)', labelEn: 'SAR — Saudi Riyal' },
                    { code: 'AED', labelAr: 'درهم إماراتي (AED)', labelEn: 'AED — UAE Dirham' },
                    { code: 'USD', labelAr: 'دولار أمريكي (USD)', labelEn: 'USD — US Dollar' },
                    { code: 'EGP', labelAr: 'جنيه مصري (EGP)', labelEn: 'EGP — Egyptian Pound' },
                  ] as const
                ).map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setCurrency(c.code)}
                    className={`rounded-lg border p-3 text-xs font-semibold transition-colors cursor-pointer ${
                      currency === c.code
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-200'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {lang === 'ar' ? c.labelAr : c.labelEn}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {t(lang, 'المدة الافتراضية للكشفية (بالدقائق)', 'Default Consultation Slot Duration')}
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                {[15, 20, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDefaultDurationMin(mins)}
                    className={`h-11 rounded-lg border text-sm font-semibold tabular-nums transition-colors cursor-pointer ${
                      defaultDurationMin === mins
                        ? 'border-teal-600 bg-teal-600 text-white'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {mins} {t(lang, 'د', 'min')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {t(lang, 'أيام العمل الأسبوعية', 'Weekly Operating Days')}
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                  const selected = workingDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`h-11 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                        selected
                          ? 'border-teal-600 bg-teal-600 text-white'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {lang === 'ar' ? DAY_LABELS[day].shortAr : DAY_LABELS[day].shortEn}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t(lang, 'بداية الدوام', 'Opening Time')}
                </label>
                <input
                  type="time"
                  value={workStart}
                  onChange={(e) => setWorkStart(e.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t(lang, 'نهاية الدوام', 'Closing Time')}
                </label>
                <input
                  type="time"
                  value={workEnd}
                  onChange={(e) => setWorkEnd(e.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm tabular-nums"
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-5">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
              className="h-10 rounded-lg border border-slate-300 dark:border-slate-700 px-5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              {t(lang, 'السابق', 'Previous')}
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
              className="h-10 rounded-lg bg-teal-600 px-6 text-sm font-semibold text-white hover:bg-teal-700 cursor-pointer"
            >
              {t(lang, 'الخطوة التالية', 'Continue')}
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={handleFinish}
              className="h-10 rounded-lg bg-teal-600 px-6 text-sm font-semibold text-white hover:bg-teal-700 cursor-pointer disabled:opacity-60"
            >
              {saving
                ? t(lang, 'جاري الحفظ...', 'Saving...')
                : t(lang, 'حفظ وفتح لوحة العيادة', 'Save & Open Dashboard')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100">
      <SiteHeader />
      <main className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <Suspense
          fallback={
            <div className="mx-auto max-w-2xl h-80 rounded-xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
          }
        >
          <OnboardingWizardContent />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
