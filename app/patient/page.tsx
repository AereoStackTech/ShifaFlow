'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  CalendarClock,
  Clock,
  FileText,
  Printer,
  User,
  X,
} from 'lucide-react';
import { SiteHeader } from '@/src/components/SiteHeader';
import { SiteFooter } from '@/src/components/SiteFooter';
import { useApp } from '@/src/components/AppProvider';
import { formatCurrency, STATUS_LABELS, t } from '@/src/lib/i18n';

interface PatientAppointment {
  id: number;
  referenceCode: string;
  doctorId: number;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  feeAmount: number;
  currency: string;
  doctorNameAr: string;
  doctorNameEn: string;
  doctorRoom: string;
  specialtyNameAr: string;
  specialtyNameEn: string;
}

interface PrescriptionItem {
  id: number;
  prescriptionCode: string;
  patientName: string;
  diagnosisAr: string;
  diagnosisEn: string;
  notesAr: string | null;
  notesEn: string | null;
  issuedDate: string;
  doctorNameAr: string;
  doctorNameEn: string;
  doctorTitleAr: string;
  doctorTitleEn: string;
  specialtyNameAr: string;
  specialtyNameEn: string;
  clinicNameAr: string;
  clinicNameEn: string;
  clinicCityAr: string;
  clinicCityEn: string;
  clinicPhone: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequencyAr: string;
    frequencyEn: string;
    durationAr: string;
    durationEn: string;
    instructionsAr: string;
    instructionsEn: string;
  }>;
}

interface SlotOption {
  startTime: string;
  endTime: string;
  available: boolean;
}

export default function PatientPortalPage() {
  const { lang, user, loginAsDemoRole, authFetch } = useApp();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [activeTab, setActiveTab] = useState<'APPOINTMENTS' | 'PRESCRIPTIONS'>('APPOINTMENTS');

  // Reschedule Modal State
  const [rescheduleTarget, setRescheduleTarget] = useState<PatientAppointment | null>(null);
  const [newDate, setNewDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<SlotOption[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedNewSlot, setSelectedNewSlot] = useState<string | null>(null);
  const [savingReschedule, setSavingReschedule] = useState(false);
  const [portalMessage, setPortalMessage] = useState<string | null>(null);

  // Printable PDF Prescription Modal State
  const [activeRx, setActiveRx] = useState<PrescriptionItem | null>(null);

  const loadPortal = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await authFetch('/api/patient/portal');
      const data = await res.json();
      if (res.ok) {
        setAppointments(data.appointments ?? []);
        setPrescriptions(data.prescriptions ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [user, authFetch]);

  useEffect(() => {
    let active = true;
    if (!user) return;
    authFetch('/api/patient/portal')
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!active || !ok) return;
        setAppointments(data.appointments ?? []);
        setPrescriptions(data.prescriptions ?? []);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user, authFetch]);

  // Fetch open slots when rescheduling
  useEffect(() => {
    if (!rescheduleTarget || !newDate) return;
    let active = true;
    fetch(`/api/slots?doctorId=${rescheduleTarget.doctorId}&date=${newDate}`)
      .then((res) => res.json())
      .then((data) => {
        if (active) {
          setAvailableSlots(data.slots ?? []);
          setSelectedNewSlot(null);
        }
      })
      .finally(() => {
        if (active) setLoadingSlots(false);
      });
    return () => {
      active = false;
    };
  }, [rescheduleTarget, newDate]);

  const openReschedule = (appt: PatientAppointment) => {
    setPortalMessage(null);
    setRescheduleTarget(appt);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setNewDate(appt.appointmentDate >= new Date().toISOString().slice(0, 10) ? appt.appointmentDate : tomorrow.toISOString().slice(0, 10));
  };

  const confirmReschedule = async () => {
    if (!rescheduleTarget || !newDate || !selectedNewSlot) return;
    setSavingReschedule(true);
    try {
      const res = await authFetch(`/api/appointments/${rescheduleTarget.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          appointmentDate: newDate,
          startTime: selectedNewSlot,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPortalMessage(data.error || 'Could not reschedule appointment.');
      } else {
        setRescheduleTarget(null);
        setPortalMessage(
          t(
            lang,
            'تمت إعادة جدولة الموعد بنجاح وتحديث التوقيت في جدول الطبيب.',
            'Appointment rescheduled successfully and slot updated.'
          )
        );
        await loadPortal();
      }
    } finally {
      setSavingReschedule(false);
    }
  };

  const cancelAppointment = async (id: number) => {
    setPortalMessage(null);
    const res = await authFetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'CANCELLED' }),
    });
    if (res.ok) {
      setPortalMessage(t(lang, 'تم إلغاء الموعد وإعادة فتح الوقت.', 'Appointment cancelled.'));
      await loadPortal();
    }
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const upcoming = appointments.filter(
    (a) => a.appointmentDate >= todayStr && a.status !== 'COMPLETED' && a.status !== 'CANCELLED'
  );
  const past = appointments.filter(
    (a) => a.appointmentDate < todayStr || a.status === 'COMPLETED' || a.status === 'CANCELLED'
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100">
      <SiteHeader />

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {!user ? (
          <div className="no-print max-w-lg mx-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center space-y-4">
            <User className="h-9 w-9 text-teal-600 dark:text-teal-400 mx-auto" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {t(lang, 'بوابة المريض الخاصة', 'Patient Health & Visits Portal')}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t(
                lang,
                'سجّل الدخول لمتابعة مواعيدك القادمة، إعادة الجدولة الذاتية، وتحميل وصفاتك الطبية بصيغة PDF.',
                'Sign in to track upcoming visits, reschedule appointments against live availability, and download formatted PDF prescriptions.'
              )}
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => loginAsDemoRole('PATIENT')}
                className="h-10 rounded-lg bg-teal-600 px-5 text-sm font-semibold text-white hover:bg-teal-700 cursor-pointer"
              >
                {t(lang, 'الدخول السريع كمريض تجريبي (خالد الشمري)', 'Sign In as Demo Patient')}
              </button>
              <Link
                href="/login"
                className="inline-flex h-10 items-center rounded-lg border border-slate-300 dark:border-slate-700 px-5 text-sm font-semibold"
              >
                {t(lang, 'تسجيل الدخول', 'Sign In')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Portal Header */}
            <div className="no-print flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
              <div>
                <div className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                  {t(lang, 'بوابة المريض الشخصية', 'Patient Self-Service Portal')}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
                  {lang === 'ar' ? user.fullNameAr : user.fullNameEn}
                </h1>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
                  {user.email} {user.phone ? `· ${user.phone}` : ''}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveTab('APPOINTMENTS')}
                    className={`rounded-md px-3.5 py-1.5 text-xs font-semibold cursor-pointer ${
                      activeTab === 'APPOINTMENTS'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {t(lang, 'مواعيدي', 'Appointments')} ({appointments.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('PRESCRIPTIONS')}
                    className={`rounded-md px-3.5 py-1.5 text-xs font-semibold cursor-pointer ${
                      activeTab === 'PRESCRIPTIONS'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {t(lang, 'الوصفات الطبية PDF', 'Prescriptions PDF')} ({prescriptions.length})
                  </button>
                </div>

                <Link
                  href="/book"
                  className="inline-flex h-9 items-center rounded-lg bg-teal-600 px-4 text-xs font-semibold text-white hover:bg-teal-700 whitespace-nowrap"
                >
                  {t(lang, 'حجز موعد جديد', 'Book New Visit')}
                </Link>
              </div>
            </div>

            {portalMessage && (
              <div className="no-print rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/40 px-4 py-3 text-sm text-teal-800 dark:text-teal-200">
                {portalMessage}
              </div>
            )}

            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-28 rounded-xl bg-slate-200/70 dark:bg-slate-800/70" />
                ))}
              </div>
            ) : activeTab === 'APPOINTMENTS' ? (
              <div className="no-print space-y-8">
                {/* Upcoming Appointments */}
                <section className="space-y-3">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {t(lang, 'المواعيد القادمة', 'Upcoming Appointments')}
                  </h2>
                  {upcoming.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center space-y-3">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {t(lang, 'لا توجد مواعيد قادمة حالياً.', 'You have no upcoming appointments.')}
                      </p>
                      <Link
                        href="/book"
                        className="inline-flex h-9 items-center rounded-lg bg-teal-600 px-4 text-xs font-semibold text-white"
                      >
                        {t(lang, 'احجز موعدك القادم', 'Schedule a Visit')}
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {upcoming.map((appt) => {
                        const st = STATUS_LABELS[appt.status] || STATUS_LABELS.CONFIRMED;
                        return (
                          <div
                            key={appt.id}
                            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-mono text-xs text-slate-500">
                                  {appt.referenceCode}
                                </div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                                  {lang === 'ar' ? appt.doctorNameAr : appt.doctorNameEn}
                                </h3>
                                <div className="text-xs text-slate-500">
                                  {lang === 'ar' ? appt.specialtyNameAr : appt.specialtyNameEn} ·{' '}
                                  {appt.doctorRoom}
                                </div>
                              </div>
                              <span className={`text-xs font-semibold ${st.colorClass}`}>
                                {lang === 'ar' ? st.ar : st.en}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-xs tabular-nums text-slate-700 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-3">
                              <span className="inline-flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-teal-600" />
                                {appt.appointmentDate}
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-teal-600" />
                                {appt.startTime} – {appt.endTime}
                              </span>
                              <span className="ms-auto font-semibold">
                                {formatCurrency(appt.feeAmount, appt.currency, lang)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => openReschedule(appt)}
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-teal-600 px-3.5 text-xs font-semibold text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 cursor-pointer"
                              >
                                <CalendarClock className="h-3.5 w-3.5" />
                                <span>{t(lang, 'إعادة جدولة', 'Reschedule')}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => cancelAppointment(appt.id)}
                                className="inline-flex h-9 items-center rounded-lg border border-slate-200 dark:border-slate-700 px-3.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                              >
                                {t(lang, 'إلغاء الموعد', 'Cancel')}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Past Visits */}
                <section className="space-y-3">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {t(lang, 'سجل الزيارات السابقة', 'Past Visit History')}
                  </h2>
                  {past.length === 0 ? (
                    <div className="text-sm text-slate-500">
                      {t(lang, 'لا يوجد سجل زيارات سابقة.', 'No completed visits yet.')}
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs text-slate-500">
                            <th className="px-4 py-3 text-start font-semibold">{t(lang, 'المرجع', 'Ref')}</th>
                            <th className="px-4 py-3 text-start font-semibold">{t(lang, 'التاريخ', 'Date')}</th>
                            <th className="px-4 py-3 text-start font-semibold">{t(lang, 'الطبيب والتخصص', 'Physician')}</th>
                            <th className="px-4 py-3 text-start font-semibold">{t(lang, 'الحالة', 'Status')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {past.map((a) => {
                            const st = STATUS_LABELS[a.status] || STATUS_LABELS.COMPLETED;
                            return (
                              <tr key={a.id}>
                                <td className="px-4 py-3 font-mono text-xs tabular-nums text-slate-500">
                                  {a.referenceCode}
                                </td>
                                <td className="px-4 py-3 text-xs tabular-nums font-medium">
                                  {a.appointmentDate} · {a.startTime}
                                </td>
                                <td className="px-4 py-3 text-xs">
                                  <div className="font-semibold text-slate-900 dark:text-white">
                                    {lang === 'ar' ? a.doctorNameAr : a.doctorNameEn}
                                  </div>
                                  <div className="text-slate-500">
                                    {lang === 'ar' ? a.specialtyNameAr : a.specialtyNameEn}
                                  </div>
                                </td>
                                <td className={`px-4 py-3 text-xs font-semibold ${st.colorClass}`}>
                                  {lang === 'ar' ? st.ar : st.en}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </div>
            ) : (
              /* PRESCRIPTIONS TAB */
              <div className="no-print space-y-4">
                {prescriptions.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center text-sm text-slate-500">
                    {t(
                      lang,
                      'لا توجد وصفات طبية صادرة لحسابك حالياً. جرّب الدخول بحساب المريض التجريبي (خالد الشمري) لاستعراض الوصفات.',
                      'No prescriptions issued for this account yet. Sign in as the Demo Patient to preview formatted PDF prescriptions.'
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {prescriptions.map((rx) => (
                      <div
                        key={rx.id}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between text-xs tabular-nums">
                            <span className="font-mono font-semibold text-teal-700 dark:text-teal-400">
                              {rx.prescriptionCode}
                            </span>
                            <span className="text-slate-500">{rx.issuedDate}</span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {lang === 'ar' ? rx.diagnosisAr : rx.diagnosisEn}
                          </h3>
                          <div className="text-xs text-slate-500">
                            {lang === 'ar' ? rx.doctorNameAr : rx.doctorNameEn} ·{' '}
                            {lang === 'ar' ? rx.specialtyNameAr : rx.specialtyNameEn}
                          </div>
                          <ul className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                            {rx.medications.map((m, i) => (
                              <li key={i} className="truncate">
                                • {m.name} ({m.dosage})
                              </li>
                            ))}
                          </ul>
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveRx(rx)}
                          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 dark:bg-teal-600 text-xs font-semibold text-white hover:opacity-90 cursor-pointer"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>{t(lang, 'معاينة وتحميل PDF', 'Preview & Download PDF')}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Self-Service Reschedule Modal */}
            {rescheduleTarget && (
              <div className="no-print fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        {t(lang, 'إعادة جدولة الموعد', 'Reschedule Appointment')}
                      </h2>
                      <div className="text-xs text-slate-500">
                        {lang === 'ar'
                          ? rescheduleTarget.doctorNameAr
                          : rescheduleTarget.doctorNameEn}{' '}
                        · {rescheduleTarget.referenceCode}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRescheduleTarget(null)}
                      className="p-1 text-slate-400 hover:text-slate-900 cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      {t(lang, 'التاريخ الجديد', 'New Preferred Date')}
                    </label>
                    <input
                      type="date"
                      value={newDate}
                      min={todayStr}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm tabular-nums"
                    />
                  </div>

                  <div>
                    <div className="text-xs font-semibold mb-2">
                      {t(lang, 'الأوقات المتاحة', 'Open Time Slots')}
                    </div>
                    {loadingSlots ? (
                      <div className="h-24 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
                    ) : (
                      <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                        {availableSlots
                          .filter((s) => s.available)
                          .map((slot) => (
                            <button
                              key={slot.startTime}
                              type="button"
                              onClick={() => setSelectedNewSlot(slot.startTime)}
                              className={`h-9 rounded-lg border text-xs font-semibold tabular-nums cursor-pointer ${
                                selectedNewSlot === slot.startTime
                                  ? 'border-teal-600 bg-teal-600 text-white'
                                  : 'border-slate-200 dark:border-slate-700 hover:border-teal-500'
                              }`}
                            >
                              {slot.startTime}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setRescheduleTarget(null)}
                      className="h-10 rounded-lg border border-slate-300 dark:border-slate-700 px-4 text-xs font-semibold cursor-pointer"
                    >
                      {t(lang, 'إلغاء', 'Cancel')}
                    </button>
                    <button
                      type="button"
                      disabled={!selectedNewSlot || savingReschedule}
                      onClick={confirmReschedule}
                      className="h-10 rounded-lg bg-teal-600 px-5 text-xs font-semibold text-white hover:bg-teal-700 cursor-pointer disabled:opacity-50"
                    >
                      {savingReschedule
                        ? t(lang, 'جاري التحديث...', 'Updating...')
                        : t(lang, 'تأكيد الموعد الجديد', 'Confirm New Slot')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Printable PDF Medical Prescription View */}
            {activeRx && (
              <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs overflow-y-auto p-4 sm:p-8 flex items-start justify-center">
                <div className="w-full max-w-3xl space-y-4">
                  <div className="no-print flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex h-10 items-center gap-2 rounded-lg bg-teal-600 px-5 text-sm font-semibold text-white hover:bg-teal-700 cursor-pointer"
                    >
                      <Printer className="h-4 w-4" />
                      <span>{t(lang, 'طباعة / حفظ كملف PDF', 'Print / Save as PDF')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveRx(null)}
                      className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-white dark:bg-slate-900 px-4 text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                      <span>{t(lang, 'إغلاق', 'Close')}</span>
                    </button>
                  </div>

                  {/* Formal Printable Medical Prescription Document */}
                  <div className="print-surface rounded-xl border border-slate-200 bg-white text-slate-900 p-8 sm:p-10 space-y-6 shadow-lg">
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-teal-700 pb-5">
                      <div>
                        <div className="text-xl font-bold text-slate-900">
                          {lang === 'ar' ? activeRx.clinicNameAr : activeRx.clinicNameEn}
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          {lang === 'ar' ? activeRx.clinicCityAr : activeRx.clinicCityEn} ·{' '}
                          {activeRx.clinicPhone}
                        </div>
                      </div>
                      <div className="text-end tabular-nums">
                        <div className="text-xs font-semibold text-teal-700">
                          {t(lang, 'وصفة طبية إلكترونية', 'Electronic Medical Prescription')}
                        </div>
                        <div className="font-mono text-base font-bold text-slate-900">
                          {activeRx.prescriptionCode}
                        </div>
                        <div className="text-xs text-slate-500">
                          {t(lang, 'تاريخ الإصدار:', 'Issued:')} {activeRx.issuedDate}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg bg-slate-50 border border-slate-200 p-4 text-xs">
                      <div>
                        <div className="text-slate-500">{t(lang, 'اسم المريض', 'Patient Name')}</div>
                        <div className="text-sm font-bold text-slate-900 mt-0.5">
                          {activeRx.patientName}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500">{t(lang, 'الطبيب المعالج', 'Prescribing Physician')}</div>
                        <div className="text-sm font-bold text-slate-900 mt-0.5">
                          {lang === 'ar' ? activeRx.doctorNameAr : activeRx.doctorNameEn}
                        </div>
                        <div className="text-slate-600">
                          {lang === 'ar' ? activeRx.doctorTitleAr : activeRx.doctorTitleEn}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-slate-500">
                        {t(lang, 'التشخيص السريري', 'Clinical Assessment / Diagnosis')}
                      </div>
                      <div className="mt-1 text-base font-bold text-slate-900">
                        {lang === 'ar' ? activeRx.diagnosisAr : activeRx.diagnosisEn}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-slate-500">
                        {t(lang, 'الأدوية الموصوفة والجرعات (Rx)', 'Prescribed Medications (Rx)')}
                      </div>
                      <table className="w-full text-xs border border-slate-200">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                            <th className="p-3 text-start font-semibold">{t(lang, 'الدواء', 'Medication')}</th>
                            <th className="p-3 text-start font-semibold">{t(lang, 'الجرعة', 'Dosage')}</th>
                            <th className="p-3 text-start font-semibold">{t(lang, 'التكرار والمدة', 'Frequency & Duration')}</th>
                            <th className="p-3 text-start font-semibold">{t(lang, 'التعليمات', 'Instructions')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {activeRx.medications.map((m, idx) => (
                            <tr key={idx}>
                              <td className="p-3 font-semibold text-slate-900">{m.name}</td>
                              <td className="p-3 tabular-nums text-slate-700">{m.dosage}</td>
                              <td className="p-3 text-slate-700">
                                <div>{lang === 'ar' ? m.frequencyAr : m.frequencyEn}</div>
                                <div className="text-slate-500">
                                  {lang === 'ar' ? m.durationAr : m.durationEn}
                                </div>
                              </td>
                              <td className="p-3 text-slate-600">
                                {lang === 'ar' ? m.instructionsAr : m.instructionsEn}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {(activeRx.notesAr || activeRx.notesEn) && (
                      <div className="border-t border-slate-200 pt-4 text-xs text-slate-700">
                        <span className="font-semibold text-slate-900">
                          {t(lang, 'ملاحظات الطبيب: ', 'Physician Notes: ')}
                        </span>
                        {lang === 'ar' ? activeRx.notesAr : activeRx.notesEn}
                      </div>
                    )}

                    <div className="border-t border-slate-200 pt-5 flex items-center justify-between text-[11px] text-slate-500">
                      <span>
                        {t(
                          lang,
                          'وصفة تجريبية افتراضية صادرة عبر مفهوم شفاء فلو لأغراض العرض التقني فقط.',
                          'Fictional demonstration prescription generated by ShifaFlow Portfolio Concept.'
                        )}
                      </span>
                      <span className="font-mono tabular-nums">{activeRx.prescriptionCode}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
