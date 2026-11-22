'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Lock,
  MessageCircle,
  Printer,
  Stethoscope,
  User,
} from 'lucide-react';
import { SiteHeader } from '@/src/components/SiteHeader';
import { SiteFooter } from '@/src/components/SiteFooter';
import { useApp } from '@/src/components/AppProvider';
import { DAY_LABELS, formatCurrency, t } from '@/src/lib/i18n';

interface Specialty {
  id: number;
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  consultationFee: number;
  durationMin: number;
}

interface Doctor {
  id: number;
  specialtyId: number;
  nameAr: string;
  nameEn: string;
  titleAr: string;
  titleEn: string;
  bioAr: string;
  bioEn: string;
  roomNumber: string;
  consultationFee: number;
  yearsExperience: number;
  status: string;
  leaveReason: string | null;
  specialtyNameAr: string;
  specialtyNameEn: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  reason?: 'BOOKED' | 'DOCTOR_ON_LEAVE';
}

interface TicketConfirmation {
  id: number;
  referenceCode: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  patientName: string;
  patientPhone: string;
  feeAmount: number;
  currency: string;
  clinicNameAr: string;
  clinicNameEn: string;
  clinicCityAr: string;
  clinicCityEn: string;
  clinicPhone: string;
  doctorNameAr: string;
  doctorNameEn: string;
  doctorTitleAr: string;
  doctorTitleEn: string;
  doctorRoom: string;
  specialtyNameAr: string;
  specialtyNameEn: string;
}

function getNext7Days(): Array<{ iso: string; dayOfWeek: number; dayNum: number; monthShort: string }> {
  const days = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const [y, m, day] = iso.split('-').map(Number);
    const utcDay = new Date(Date.UTC(y, m - 1, day)).getUTCDay();
    days.push({
      iso,
      dayOfWeek: utcDay,
      dayNum: day,
      monthShort: months[m - 1],
    });
  }
  return days;
}

function BookingWizardContent() {
  const { lang, user, authFetch } = useApp();
  const searchParams = useSearchParams();

  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [currency, setCurrency] = useState('SAR');
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<number | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [patientName, setPatientName] = useState(
    () => (user ? (lang === 'ar' ? user.fullNameAr : user.fullNameEn) : '')
  );
  const [patientPhone, setPatientPhone] = useState(() => user?.phone || '');
  const [patientEmail, setPatientEmail] = useState(() => user?.email || '');
  const [patientNotes, setPatientNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<TicketConfirmation | null>(null);

  const upcomingDays = useMemo(() => getNext7Days(), []);

  // Load catalog & apply query params
  useEffect(() => {
    let active = true;
    fetch('/api/public/catalog')
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        setSpecialties(data.specialties ?? []);
        setDoctors(data.doctors ?? []);
        if (data.clinic?.currency) setCurrency(data.clinic.currency);

        const qSpec = Number(searchParams.get('specialtyId'));
        const qDoc = Number(searchParams.get('doctorId'));
        const qDate = searchParams.get('date');
        if (qDate && /^\d{4}-\d{2}-\d{2}$/.test(qDate)) {
          setSelectedDate(qDate);
        }
        if (qDoc && (data.doctors ?? []).some((d: Doctor) => d.id === qDoc)) {
          const doc = (data.doctors as Doctor[]).find((d) => d.id === qDoc)!;
          setSelectedSpecialtyId(doc.specialtyId);
          setSelectedDoctorId(doc.id);
          setStep(3);
        } else if (qSpec && (data.specialties ?? []).some((s: Specialty) => s.id === qSpec)) {
          setSelectedSpecialtyId(qSpec);
          setStep(2);
        }
      })
      .catch(() => setError('Unable to load clinic catalog.'))
      .finally(() => {
        if (active) setLoadingCatalog(false);
      });
    return () => {
      active = false;
    };
  }, [searchParams]);

  // Load real-time slots whenever doctorId or date changes
  useEffect(() => {
    if (!selectedDoctorId || !selectedDate) return;
    let active = true;
    fetch(`/api/slots?doctorId=${selectedDoctorId}&date=${selectedDate}`)
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        setSlots(data.slots ?? []);
        setSelectedSlot(null);
      })
      .catch(() => {
        if (active) setError('Could not load available slots.');
      })
      .finally(() => {
        if (active) setLoadingSlots(false);
      });
    return () => {
      active = false;
    };
  }, [selectedDoctorId, selectedDate]);

  const selectedSpecialty = useMemo(
    () => specialties.find((s) => s.id === selectedSpecialtyId) || null,
    [specialties, selectedSpecialtyId]
  );

  const filteredDoctors = useMemo(() => {
    if (!selectedSpecialtyId) return doctors;
    return doctors.filter((d) => d.specialtyId === selectedSpecialtyId);
  }, [doctors, selectedSpecialtyId]);

  const selectedDoctor = useMemo(
    () => doctors.find((d) => d.id === selectedDoctorId) || null,
    [doctors, selectedDoctorId]
  );

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor || !selectedSpecialtyId || !selectedSlot) {
      setError(t(lang, 'يرجى اختيار الوقت المتاح أولاً.', 'Please select an available time slot.'));
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await authFetch('/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          specialtyId: selectedSpecialtyId,
          appointmentDate: selectedDate,
          startTime: selectedSlot,
          patientName,
          patientPhone,
          patientEmail,
          patientNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not complete booking.');
        // Refresh slots immediately in case of 409 conflict
        if (res.status === 409) {
          const slotRes = await fetch(`/api/slots?doctorId=${selectedDoctor.id}&date=${selectedDate}`);
          const slotData = await slotRes.json();
          setSlots(slotData.slots ?? []);
          setSelectedSlot(null);
        }
        return;
      }
      setTicket(data.appointment);
      setStep(4);
    } catch {
      setError(t(lang, 'حدث خطأ أثناء تأكيد الحجز.', 'Network error while confirming booking.'));
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappHref = useMemo(() => {
    if (!ticket) return '#';
    const text =
      lang === 'ar'
        ? `تذكرة حجز شفاء فلو\nالرقم المرجعي: ${ticket.referenceCode}\nالعيادة: ${ticket.clinicNameAr}\nالطبيب: ${ticket.doctorNameAr} (${ticket.doctorRoom})\nالتاريخ: ${ticket.appointmentDate}\nالوقت: ${ticket.startTime} - ${ticket.endTime}\nالمريض: ${ticket.patientName}`
        : `ShifaFlow Booking Ticket\nRef: ${ticket.referenceCode}\nClinic: ${ticket.clinicNameEn}\nDoctor: ${ticket.doctorNameEn} (${ticket.doctorRoom})\nDate: ${ticket.appointmentDate}\nTime: ${ticket.startTime} - ${ticket.endTime}\nPatient: ${ticket.patientName}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }, [ticket, lang]);

  const stepLabels = [
    { num: 1 as const, ar: '١. التخصص', en: '1. Specialty' },
    { num: 2 as const, ar: '٢. الطبيب', en: '2. Physician' },
    { num: 3 as const, ar: '٣. الوقت والبيانات', en: '3. Slot & Details' },
    { num: 4 as const, ar: '٤. تذكرة الـ QR', en: '4. QR Ticket' },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Header & Progress Bar */}
      <div className="no-print space-y-4">
        <div>
          <div className="text-xs font-semibold text-teal-700 dark:text-teal-400">
            {t(lang, 'حجز فوري بدون تضارب · قفل لحظي للوقت', 'Real-Time Conflict-Free Booking')}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            {t(lang, 'احجز موعدك الطبي في ٤ خطوات واضحة', 'Schedule Your Appointment in 4 Steps')}
          </h1>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {stepLabels.map((s) => {
            const active = step === s.num;
            const completed = step > s.num;
            const clickable = s.num < step && step !== 4;
            return (
              <button
                key={s.num}
                type="button"
                disabled={!clickable}
                onClick={() => clickable && setStep(s.num)}
                className={`flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-200'
                    : completed
                    ? 'border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 cursor-pointer'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500'
                }`}
              >
                <span className="truncate">{lang === 'ar' ? s.ar : s.en}</span>
                {completed && <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="no-print flex items-start gap-2.5 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: SPECIALTY */}
      {step === 1 && (
        <div className="space-y-4">
          {loadingCatalog ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="h-36 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {specialties.map((spec) => {
                const isSelected = selectedSpecialtyId === spec.id;
                return (
                  <button
                    key={spec.id}
                    type="button"
                    onClick={() => {
                      setSelectedSpecialtyId(spec.id);
                      setSelectedDoctorId(null);
                      setStep(2);
                    }}
                    className={`rounded-xl border p-5 text-start transition-colors flex flex-col justify-between space-y-4 cursor-pointer bg-white dark:bg-slate-900 ${
                      isSelected
                        ? 'border-teal-600 ring-1 ring-teal-600/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-teal-500'
                    }`}
                  >
                    <div className="space-y-2">
                      <Stethoscope className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        {lang === 'ar' ? spec.nameAr : spec.nameEn}
                      </h2>
                      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                        {lang === 'ar' ? spec.descriptionAr : spec.descriptionEn}
                      </p>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 text-xs tabular-nums">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(spec.consultationFee, currency, lang)}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {spec.durationMin} {t(lang, 'دقيقة', 'min')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* STEP 2: DOCTOR */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {selectedSpecialty
                ? lang === 'ar'
                  ? `أطباء تخصص ${selectedSpecialty.nameAr}`
                  : `${selectedSpecialty.nameEn} Physicians`
                : t(lang, 'اختر الطبيب', 'Choose a Physician')}
            </h2>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
            >
              {t(lang, 'تغيير التخصص', 'Change Specialty')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDoctors.map((doc) => {
              const onLeave = doc.status === 'ON_LEAVE';
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => {
                    setSelectedDoctorId(doc.id);
                    setStep(3);
                  }}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-start hover:border-teal-500 transition-colors flex flex-col justify-between space-y-4 cursor-pointer"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {lang === 'ar' ? doc.nameAr : doc.nameEn}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {lang === 'ar' ? doc.titleAr : doc.titleEn}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-semibold whitespace-nowrap ${
                          onLeave
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {onLeave ? t(lang, 'في إجازة', 'On Leave') : t(lang, 'متاح', 'Active')}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                      {lang === 'ar' ? doc.bioAr : doc.bioEn}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 text-xs tabular-nums">
                    <span className="text-slate-500 dark:text-slate-400">
                      {doc.roomNumber} · {doc.yearsExperience} {t(lang, 'سنة', 'yrs')}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(doc.consultationFee, currency, lang)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 3: REAL-TIME SLOT CALENDAR & PATIENT FORM */}
      {step === 3 && selectedDoctor && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Date & Real-Time Slot Grid */}
          <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {lang === 'ar' ? selectedDoctor.nameAr : selectedDoctor.nameEn}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {lang === 'ar' ? selectedDoctor.specialtyNameAr : selectedDoctor.specialtyNameEn} ·{' '}
                  {selectedDoctor.roomNumber} ·{' '}
                  <span className="tabular-nums font-medium text-slate-700 dark:text-slate-300">
                    {formatCurrency(selectedDoctor.consultationFee, currency, lang)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline shrink-0 cursor-pointer"
              >
                {t(lang, 'تغيير الطبيب', 'Change Doctor')}
              </button>
            </div>

            {/* Horizontal Touch-Friendly Date Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t(lang, 'اختر اليوم', 'Select Date')}
                </span>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-8 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 text-xs tabular-nums"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {upcomingDays.map((d) => {
                  const active = selectedDate === d.iso;
                  return (
                    <button
                      key={d.iso}
                      type="button"
                      onClick={() => setSelectedDate(d.iso)}
                      className={`min-w-[74px] rounded-lg border px-3 py-2.5 text-center transition-colors shrink-0 cursor-pointer ${
                        active
                          ? 'border-teal-600 bg-teal-600 text-white'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-teal-400'
                      }`}
                    >
                      <div className={`text-[11px] ${active ? 'text-teal-50' : 'text-slate-500'}`}>
                        {lang === 'ar'
                          ? DAY_LABELS[d.dayOfWeek].shortAr
                          : DAY_LABELS[d.dayOfWeek].shortEn}
                      </div>
                      <div className="text-base font-bold tabular-nums mt-0.5">{d.dayNum}</div>
                      <div className={`text-[10px] ${active ? 'text-teal-100' : 'text-slate-400'}`}>
                        {d.monthShort}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Available vs Locked Time Slots */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {t(lang, 'الأوقات المتاحة فعلياً', 'Live Available Time Slots')}
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  {t(lang, 'الأوقات المحجوزة مغلقة تلقائياً', 'Booked slots are locked automatically')}
                </span>
              </div>

              {selectedDoctor.status === 'ON_LEAVE' ? (
                <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4 text-sm text-amber-800 dark:text-amber-200">
                  {t(
                    lang,
                    `الطبيب في إجازة حالياً (${selectedDoctor.leaveReason || 'إجازة مجدولة'}). يرجى اختيار طبيب آخر.`,
                    `This physician is currently on leave (${selectedDoctor.leaveReason || 'Scheduled leave'}). Please choose another clinician.`
                  )}
                </div>
              ) : loadingSlots ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <div
                      key={n}
                      className="h-11 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse"
                    />
                  ))}
                </div>
              ) : slots.length === 0 ? (
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-6 text-center text-sm text-slate-600 dark:text-slate-400">
                  {t(
                    lang,
                    'لا توجد وردية عمل للطبيب في هذا اليوم. اختر تاريخاً آخر من الأعلى.',
                    'No shift scheduled on this day. Please pick another date above.'
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {slots.map((slot) => {
                    const isPicked = selectedSlot === slot.startTime;
                    if (!slot.available) {
                      return (
                        <div
                          key={slot.startTime}
                          title={t(lang, 'موعد محجوز ومغلق', 'Slot already booked')}
                          className="flex h-11 items-center justify-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-xs tabular-nums text-slate-400 dark:text-slate-600 line-through select-none"
                        >
                          <Lock className="h-3 w-3 shrink-0" />
                          <span>{slot.startTime}</span>
                        </div>
                      );
                    }
                    return (
                      <button
                        key={slot.startTime}
                        type="button"
                        onClick={() => setSelectedSlot(slot.startTime)}
                        className={`h-11 rounded-lg border text-xs font-semibold tabular-nums transition-colors cursor-pointer ${
                          isPicked
                            ? 'border-teal-600 bg-teal-600 text-white'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-teal-500'
                        }`}
                      >
                        {slot.startTime}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: Patient Details Form */}
          <form
            onSubmit={handleConfirmBooking}
            className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-4"
          >
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              <User className="h-4 w-4 text-teal-600" />
              <span>{t(lang, 'بيانات المريض وتأكيد الحجز', 'Patient Details & Confirmation')}</span>
            </div>

            <div className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 text-xs space-y-1 tabular-nums">
              <div className="flex justify-between">
                <span className="text-slate-500">{t(lang, 'التاريخ', 'Date')}</span>
                <span className="font-semibold text-slate-900 dark:text-white">{selectedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t(lang, 'الوقت المختار', 'Selected Slot')}</span>
                <span className="font-semibold text-teal-700 dark:text-teal-400">
                  {selectedSlot || t(lang, 'اختر من القائمة', 'Select a slot')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t(lang, 'رسوم الكشفية', 'Consultation Fee')}</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(selectedDoctor.consultationFee, currency, lang)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t(lang, 'اسم المريض الكامل *', 'Patient Full Name *')}
              </label>
              <input
                type="text"
                required
                minLength={2}
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder={t(lang, 'مثال: محمد العبدالله', 'e.g., Mohammed Al-Abdullah')}
                className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t(lang, 'رقم الجوال *', 'Mobile Number *')}
              </label>
              <input
                type="tel"
                required
                minLength={6}
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="+966 55 000 0000"
                className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm tabular-nums focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t(lang, 'البريد الإلكتروني (اختياري)', 'Email (Optional)')}
              </label>
              <input
                type="email"
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
                placeholder="patient@example.com"
                className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t(lang, 'سبب الزيارة / ملاحظات', 'Visit Reason / Notes')}
              </label>
              <textarea
                rows={2}
                value={patientNotes}
                onChange={(e) => setPatientNotes(e.target.value)}
                placeholder={t(lang, 'مثال: فحص دوري أو متابعة', 'e.g., Routine checkup or follow-up')}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 text-sm focus:border-teal-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedSlot || selectedDoctor.status === 'ON_LEAVE'}
              className="h-11 w-full rounded-lg bg-teal-600 text-sm font-semibold text-white hover:bg-teal-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting
                ? t(lang, 'جاري قفل الموعد وإصدار التذكرة...', 'Locking slot & issuing ticket...')
                : t(lang, 'تأكيد الحجز وإصدار تذكرة QR', 'Confirm & Issue QR Ticket')}
            </button>
          </form>
        </div>
      )}

      {/* STEP 4: DIGITAL QR CONFIRMATION TICKET */}
      {step === 4 && ticket && (
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="print-surface rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="bg-teal-700 text-white px-6 py-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 shrink-0" />
                <div>
                  <div className="text-xs text-teal-100">
                    {t(lang, 'تم تأكيد الحجز وقفل الموعد بنجاح', 'Appointment Confirmed & Slot Locked')}
                  </div>
                  <h2 className="text-lg font-bold">
                    {lang === 'ar' ? ticket.clinicNameAr : ticket.clinicNameEn}
                  </h2>
                </div>
              </div>
              <div className="text-end">
                <div className="text-[11px] text-teal-100">
                  {t(lang, 'الرقم المرجعي', 'Reference ID')}
                </div>
                <div className="font-mono text-base font-bold tabular-nums">
                  {ticket.referenceCode}
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              <div className="sm:col-span-7 space-y-4">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {t(lang, 'اسم المريض', 'Patient')}
                  </div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">
                    {ticket.patientName}
                  </div>
                  <div className="text-xs tabular-nums text-slate-500">{ticket.patientPhone}</div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {t(lang, 'الطبيب', 'Physician')}
                    </div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {lang === 'ar' ? ticket.doctorNameAr : ticket.doctorNameEn}
                    </div>
                    <div className="text-xs text-slate-500">
                      {lang === 'ar' ? ticket.specialtyNameAr : ticket.specialtyNameEn}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {t(lang, 'الغرفة / الجناح', 'Suite')}
                    </div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {ticket.doctorRoom}
                    </div>
                    <div className="text-xs tabular-nums text-slate-500">
                      {formatCurrency(ticket.feeAmount, ticket.currency, lang)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4 tabular-nums">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-teal-600 shrink-0" />
                    <div>
                      <div className="text-[11px] text-slate-500">{t(lang, 'التاريخ', 'Date')}</div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {ticket.appointmentDate}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-teal-600 shrink-0" />
                    <div>
                      <div className="text-[11px] text-slate-500">{t(lang, 'الوقت', 'Time')}</div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {ticket.startTime} – {ticket.endTime}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Scannable QR Code */}
              <div className="sm:col-span-5 flex flex-col items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white p-5">
                <QRCodeSVG
                  value={JSON.stringify({
                    ref: ticket.referenceCode,
                    clinic: ticket.clinicNameEn,
                    doctor: ticket.doctorNameEn,
                    date: ticket.appointmentDate,
                    time: ticket.startTime,
                  })}
                  size={156}
                  level="M"
                  bgColor="#FFFFFF"
                  fgColor="#0F172A"
                />
                <div className="mt-3 text-center">
                  <div className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                    {ticket.referenceCode}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {t(lang, 'أبرز الرمز عند مكتب الاستقبال', 'Scan at front desk check-in')}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 px-6 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>
                {lang === 'ar' ? ticket.clinicCityAr : ticket.clinicCityEn} · {ticket.clinicPhone}
              </span>
              <span>
                {t(
                  lang,
                  'يرجى الحضور قبل الموعد بـ ١٠ دقائق',
                  'Please arrive 10 minutes before your slot'
                )}
              </span>
            </div>
          </div>

          {/* Actions: Print, WhatsApp Share, Book Another */}
          <div className="no-print flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-slate-900 dark:bg-white px-5 text-sm font-semibold text-white dark:text-slate-900 hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>{t(lang, 'طباعة التذكرة / حفظ PDF', 'Print / Save Ticket PDF')}</span>
            </button>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{t(lang, 'مشاركة عبر واتساب', 'Share on WhatsApp')}</span>
            </a>

            <button
              type="button"
              onClick={() => {
                setTicket(null);
                setSelectedSlot(null);
                setStep(1);
              }}
              className="inline-flex h-11 items-center rounded-lg border border-slate-300 dark:border-slate-700 px-5 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {t(lang, 'حجز موعد آخر', 'Book Another')}
            </button>

            <Link
              href="/patient"
              className="inline-flex h-11 items-center text-sm font-semibold text-teal-700 dark:text-teal-400 hover:underline px-2"
            >
              {t(lang, 'بوابة المريض', 'Open Patient Portal')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100">
      <SiteHeader />
      <main className="flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <Suspense
          fallback={
            <div className="mx-auto max-w-5xl h-96 rounded-xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
          }
        >
          <BookingWizardContent />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
