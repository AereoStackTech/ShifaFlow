'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CalendarPlus, RefreshCw } from 'lucide-react';
import { DashboardShell } from '@/src/components/DashboardShell';
import { useApp } from '@/src/components/AppProvider';
import { formatCurrency, STATUS_LABELS, t } from '@/src/lib/i18n';

interface OverviewResponse {
  clinic: { nameAr: string; nameEn: string; currency: string } | null;
  subscription: { planTier: string; billingCycle: string; status: string } | null;
  kpis: {
    todaysBookings: number;
    waitingPatients: number;
    dailyRevenue: number;
    occupancyRate: number;
    activeDoctors: number;
    totalDoctors: number;
    currency: string;
  };
  dailySeries: Array<{ date: string; label: string; bookings: number; revenue: number }>;
  specialtyBreakdown: Array<{
    specialtyId: number;
    nameAr: string;
    nameEn: string;
    bookings: number;
    revenue: number;
  }>;
  upcomingQueue: Array<{
    id: number;
    referenceCode: string;
    patientName: string;
    startTime: string;
    status: string;
    doctorNameAr: string;
    doctorNameEn: string;
    doctorRoom: string;
    specialtyNameAr: string;
    specialtyNameEn: string;
  }>;
}

export default function DashboardOverviewPage() {
  const { lang, user, authFetch } = useApp();
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadOverview = useCallback(async () => {
    if (!user || user.role === 'PATIENT') return;
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/dashboard/overview');
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to load dashboard overview.');
      } else {
        setData(json);
      }
    } catch {
      setError('Unable to reach clinic dashboard service.');
    } finally {
      setLoading(false);
    }
  }, [user, authFetch]);

  useEffect(() => {
    let active = true;
    if (!user || user.role === 'PATIENT') return;
    authFetch('/api/dashboard/overview')
      .then((res) => res.json().then((json) => ({ ok: res.ok, json })))
      .then(({ ok, json }) => {
        if (!active) return;
        if (!ok) setError(json.error || 'Failed to load dashboard overview.');
        else setData(json);
      })
      .catch(() => {
        if (active) setError('Unable to reach clinic dashboard service.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user, authFetch]);

  const advanceStatus = async (id: number, nextStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await authFetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        await loadOverview();
      }
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <DashboardShell
      titleAr="لوحة المؤشرات الحية للعيادة"
      titleEn="Live Clinic Operations Overview"
      breadcrumbAr="المؤشرات اليومية"
      breadcrumbEn="Overview"
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadOverview}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t(lang, 'تحديث', 'Refresh')}</span>
          </button>
          <Link
            href="/book"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 text-xs font-semibold text-white hover:bg-teal-700 whitespace-nowrap"
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            <span>{t(lang, 'حجز جديد', 'New Booking')}</span>
          </Link>
        </div>
      }
    >
      {error && (
        <div className="mb-6 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      {loading || !data ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-28 rounded-xl bg-slate-200/70 dark:bg-slate-800/70" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 h-72 rounded-xl bg-slate-200/70 dark:bg-slate-800/70" />
            <div className="lg:col-span-5 h-72 rounded-xl bg-slate-200/70 dark:bg-slate-800/70" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 4 Live KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t(lang, 'حجوزات اليوم', "Today's Bookings")}
              </div>
              <div className="mt-2 text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
                {data.kpis.todaysBookings}
              </div>
              <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                {t(lang, 'مواعيد نشطة ومؤكدة لليوم', 'Active scheduled visits today')}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t(lang, 'المرضى في الانتظار', 'Waiting Patients')}
              </div>
              <div className="mt-2 text-3xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                {data.kpis.waitingPatients}
              </div>
              <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                {t(lang, 'بانتظار الدخول أو تسجيل الوصول', 'Confirmed & checked-in queue')}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t(lang, 'الإيرادات اليومية المتوقعة', 'Daily Revenue')}
              </div>
              <div className="mt-2 text-3xl font-bold tabular-nums text-teal-700 dark:text-teal-400">
                {formatCurrency(data.kpis.dailyRevenue, data.kpis.currency, lang)}
              </div>
              <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                {t(lang, 'إجمالي الكشفيات غير الملغاة اليوم', 'Total non-cancelled fees today')}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t(lang, 'نسبة الإشغال', 'Occupancy Rate')}
              </div>
              <div className="mt-2 text-3xl font-bold tabular-nums text-sky-700 dark:text-sky-400">
                {data.kpis.occupancyRate}%
              </div>
              <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {data.kpis.activeDoctors}/{data.kpis.totalDoctors}{' '}
                {t(lang, 'أطباء نشطون اليوم', 'physicians active today')}
              </div>
            </div>
          </div>

          {/* Interactive Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 7-Day Revenue & Bookings Area Chart */}
            <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    {t(lang, 'اتجاه الإيرادات اليومية (٧ أيام)', '7-Day Daily Revenue Trend')}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t(
                      lang,
                      'محسوب مباشرة من سجلات المواعيد في PostgreSQL',
                      'Computed live from PostgreSQL appointment records'
                    )}
                  </p>
                </div>
                <span className="font-mono text-xs tabular-nums text-slate-500">
                  {data.kpis.currency}
                </span>
              </div>

              <div className="h-64 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data.dailySeries}
                    margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="tealRevFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0D9488" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#0D9488" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name={t(lang, 'الإيرادات', 'Revenue')}
                      stroke="#0D9488"
                      strokeWidth={2}
                      fill="url(#tealRevFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bookings by Specialty Bar Chart */}
            <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
              <div className="mb-4">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t(lang, 'توزيع الحجوزات حسب التخصص', 'Bookings by Specialty')}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t(lang, 'عدد الزيارات النشطة والمكتملة لكل قسم', 'Confirmed & completed volume per department')}
                </p>
              </div>

              <div className="h-64 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.specialtyBreakdown.map((s) => ({
                      name: lang === 'ar' ? s.nameAr.slice(0, 14) : s.nameEn,
                      bookings: s.bookings,
                    }))}
                    layout="vertical"
                    margin={{ top: 5, right: 16, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={108}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="bookings" fill="#0284C7" radius={[0, 4, 4, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Today's Live Queue with 1-Click Transitions */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t(lang, 'جدول استقبال اليوم (تحديث بنقرة واحدة)', "Today's Live Queue (One-Click Actions)")}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t(lang, 'سجّل وصول المريض أو انقله إلى الكشف مباشرة', 'Advance patient visit statuses in real time')}
                </p>
              </div>
              <Link
                href="/dashboard/appointments"
                className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline whitespace-nowrap"
              >
                {t(lang, 'فتح جدول المواعيد الكامل', 'Open Full Table')}
              </Link>
            </div>

            {data.upcomingQueue.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                {t(lang, 'لا توجد مواعيد مسجلة لليوم.', 'No appointments scheduled for today.')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs text-slate-500">
                      <th className="px-5 py-3 text-start font-semibold">{t(lang, 'الوقت', 'Time')}</th>
                      <th className="px-5 py-3 text-start font-semibold">{t(lang, 'المريض', 'Patient')}</th>
                      <th className="px-5 py-3 text-start font-semibold">{t(lang, 'الطبيب والغرفة', 'Doctor & Suite')}</th>
                      <th className="px-5 py-3 text-start font-semibold">{t(lang, 'الحالة', 'Status')}</th>
                      <th className="px-5 py-3 text-end font-semibold">{t(lang, 'إجراء سريع', 'Quick Action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {data.upcomingQueue.map((row) => {
                      const st = STATUS_LABELS[row.status] || STATUS_LABELS.CONFIRMED;
                      const busy = updatingId === row.id;
                      return (
                        <tr key={row.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                          <td className="px-5 py-3 font-mono text-xs font-semibold tabular-nums text-slate-900 dark:text-white whitespace-nowrap">
                            {row.startTime}
                          </td>
                          <td className="px-5 py-3">
                            <div className="font-medium text-slate-900 dark:text-white">
                              {row.patientName}
                            </div>
                            <div className="font-mono text-[11px] text-slate-400">
                              {row.referenceCode}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-300">
                            <div>{lang === 'ar' ? row.doctorNameAr : row.doctorNameEn}</div>
                            <div className="text-slate-400">{row.doctorRoom}</div>
                          </td>
                          <td className={`px-5 py-3 text-xs font-semibold whitespace-nowrap ${st.colorClass}`}>
                            {lang === 'ar' ? st.ar : st.en}
                          </td>
                          <td className="px-5 py-3 text-end whitespace-nowrap">
                            {row.status === 'CONFIRMED' && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => advanceStatus(row.id, 'CHECKED_IN')}
                                className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 cursor-pointer disabled:opacity-50"
                              >
                                {t(lang, 'تسجيل الوصول', 'Check In')}
                              </button>
                            )}
                            {row.status === 'CHECKED_IN' && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => advanceStatus(row.id, 'IN_CONSULTATION')}
                                className="rounded-md bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 cursor-pointer disabled:opacity-50"
                              >
                                {t(lang, 'بدء الكشف', 'Start Consult')}
                              </button>
                            )}
                            {row.status === 'IN_CONSULTATION' && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => advanceStatus(row.id, 'COMPLETED')}
                                className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer disabled:opacity-50"
                              >
                                {t(lang, 'إنهاء الزيارة', 'Complete')}
                              </button>
                            )}
                            {(row.status === 'COMPLETED' || row.status === 'CANCELLED') && (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
