export type Lang = 'ar' | 'en';

export function t(lang: Lang, ar: string, en: string): string {
  return lang === 'ar' ? ar : en;
}

export const ROLE_LABELS: Record<string, { ar: string; en: string }> = {
  CLINIC_OWNER: { ar: 'مالك العيادة', en: 'Clinic Owner' },
  DOCTOR: { ar: 'طبيب', en: 'Doctor' },
  RECEPTIONIST: { ar: 'موظف الاستقبال', en: 'Receptionist' },
  PATIENT: { ar: 'مريض', en: 'Patient' },
};

export const STATUS_LABELS: Record<
  string,
  { ar: string; en: string; colorClass: string; dotClass: string }
> = {
  CONFIRMED: {
    ar: 'مؤكد',
    en: 'Confirmed',
    colorClass: 'text-sky-700 dark:text-sky-300',
    dotClass: 'bg-sky-600 dark:bg-sky-400',
  },
  CHECKED_IN: {
    ar: 'في الانتظار',
    en: 'Checked-In',
    colorClass: 'text-amber-700 dark:text-amber-300',
    dotClass: 'bg-amber-600 dark:bg-amber-400',
  },
  IN_CONSULTATION: {
    ar: 'داخل العيادة',
    en: 'In Consultation',
    colorClass: 'text-teal-700 dark:text-teal-300',
    dotClass: 'bg-teal-600 dark:bg-teal-400',
  },
  COMPLETED: {
    ar: 'مكتمل',
    en: 'Completed',
    colorClass: 'text-emerald-700 dark:text-emerald-300',
    dotClass: 'bg-emerald-600 dark:bg-emerald-400',
  },
  CANCELLED: {
    ar: 'ملغى',
    en: 'Cancelled',
    colorClass: 'text-rose-700 dark:text-rose-300',
    dotClass: 'bg-rose-600 dark:bg-rose-400',
  },
  NO_SHOW: {
    ar: 'لم يحضر',
    en: 'No-Show',
    colorClass: 'text-slate-600 dark:text-slate-400',
    dotClass: 'bg-slate-500 dark:bg-slate-400',
  },
};

export const DAY_LABELS: Record<number, { ar: string; en: string; shortAr: string; shortEn: string }> = {
  0: { ar: 'الأحد', en: 'Sunday', shortAr: 'أحد', shortEn: 'Sun' },
  1: { ar: 'الاثنين', en: 'Monday', shortAr: 'إثنين', shortEn: 'Mon' },
  2: { ar: 'الثلاثاء', en: 'Tuesday', shortAr: 'ثلاثاء', shortEn: 'Tue' },
  3: { ar: 'الأربعاء', en: 'Wednesday', shortAr: 'أربعاء', shortEn: 'Wed' },
  4: { ar: 'الخميس', en: 'Thursday', shortAr: 'خميس', shortEn: 'Thu' },
  5: { ar: 'الجمعة', en: 'Friday', shortAr: 'جمعة', shortEn: 'Fri' },
  6: { ar: 'السبت', en: 'Saturday', shortAr: 'سبت', shortEn: 'Sat' },
};

export function formatCurrency(amount: number, currency: string, lang: Lang): string {
  const symbols: Record<string, { ar: string; en: string }> = {
    SAR: { ar: 'ر.س', en: 'SAR' },
    AED: { ar: 'د.إ', en: 'AED' },
    USD: { ar: '$', en: '$' },
    EGP: { ar: 'ج.م', en: 'EGP' },
  };
  const sym = symbols[currency] || { ar: currency, en: currency };
  if (currency === 'USD') {
    return `$${amount.toLocaleString('en-US')}`;
  }
  return lang === 'ar'
    ? `${amount.toLocaleString('en-US')} ${sym.ar}`
    : `${sym.en} ${amount.toLocaleString('en-US')}`;
}
