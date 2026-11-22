'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { flexRender } from '@tanstack/react-table';
import {
  getCoreRowModel,
  getFilteredRowModel,
  type LegacyColumnDef,
  useLegacyTable,
} from '@tanstack/react-table/legacy';
import { CalendarClock, Plus, X } from 'lucide-react';
import { DashboardShell } from '@/src/components/DashboardShell';
import { useApp } from '@/src/components/AppProvider';
import { DAY_LABELS, formatCurrency, t } from '@/src/lib/i18n';

interface ScheduleSlotRow {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMin: number;
  isActive: boolean;
}

interface DoctorRow {
  id: number;
  specialtyId: number;
  nameAr: string;
  nameEn: string;
  titleAr: string;
  titleEn: string;
  roomNumber: string;
  consultationFee: number;
  yearsExperience: number;
  status: 'ACTIVE' | 'ON_LEAVE';
  leaveReason: string | null;
  specialtyNameAr: string;
  specialtyNameEn: string;
  todayBookings: number;
  totalBookings: number;
  scheduleSlots: ScheduleSlotRow[];
}

interface SpecialtyOption {
  id: number;
  nameAr: string;
  nameEn: string;
}

export default function DashboardDoctorsPage() {
  const { lang, user, clinic, authFetch } = useApp();
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [specialties, setSpecialties] = useState<SpecialtyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  // Edit Shift Drawer State
  const [editingDoc, setEditingDoc] = useState<DoctorRow | null>(null);
  const [editStart, setEditStart] = useState('09:00');
  const [editEnd, setEditEnd] = useState('16:30');
  const [editDuration, setEditDuration] = useState(30);
  const [editActiveDays, setEditActiveDays] = useState<number[]>([0, 1, 2, 3, 4, 6]);
  const [editRoom, setEditRoom] = useState('');
  const [editFee, setEditFee] = useState(300);
  const [editLeaveReason, setEditLeaveReason] = useState('');

  // Add Doctor Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSpecId, setNewSpecId] = useState<number>(0);
  const [newNameAr, setNewNameAr] = useState('');
  const [newNameEn, setNewNameEn] = useState('');
  const [newTitleAr, setNewTitleAr] = useState('');
  const [newTitleEn, setNewTitleEn] = useState('');
  const [newRoom, setNewRoom] = useState('Suite 215');
  const [newFee, setNewFee] = useState(280);
  const [savingForm, setSavingForm] = useState(false);

  const loadDoctors = useCallback(async () => {
    if (!user || user.role === 'PATIENT') return;
    try {
      const res = await authFetch('/api/doctors');
      const data = await res.json();
      if (res.ok) {
        setDoctors(data.doctors ?? []);
        setSpecialties(data.specialties ?? []);
        if (data.specialties?.[0] && !newSpecId) {
          setNewSpecId(data.specialties[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user, authFetch, newSpecId]);

  useEffect(() => {
    let active = true;
    if (!user || user.role === 'PATIENT') return;
    authFetch('/api/doctors')
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!active || !ok) return;
        setDoctors(data.doctors ?? []);
        setSpecialties(data.specialties ?? []);
        if (data.specialties?.[0]) {
          setNewSpecId((prev) => prev || data.specialties[0].id);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user, authFetch]);

  const toggleLeaveStatus = useCallback(
    async (doc: DoctorRow) => {
      setBusyId(doc.id);
      const nextStatus = doc.status === 'ACTIVE' ? 'ON_LEAVE' : 'ACTIVE';
      try {
        const res = await authFetch(`/api/doctors/${doc.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            status: nextStatus,
            leaveReason:
              nextStatus === 'ON_LEAVE'
                ? doc.leaveReason || t(lang, 'إجازة مجدولة', 'Scheduled Leave')
                : null,
          }),
        });
        if (res.ok) {
          await loadDoctors();
        }
      } finally {
        setBusyId(null);
      }
    },
    [authFetch, lang, loadDoctors]
  );

  const openShiftEditor = (doc: DoctorRow) => {
    setEditingDoc(doc);
    const activeSlots = doc.scheduleSlots.filter((s) => s.isActive);
    const sample = activeSlots[0] || doc.scheduleSlots[0];
    setEditStart(sample?.startTime || '09:00');
    setEditEnd(sample?.endTime || '16:30');
    setEditDuration(sample?.slotDurationMin || 30);
    setEditActiveDays(activeSlots.map((s) => s.dayOfWeek));
    setEditRoom(doc.roomNumber);
    setEditFee(doc.consultationFee);
    setEditLeaveReason(doc.leaveReason || '');
  };

  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    setSavingForm(true);
    try {
      const res = await authFetch(`/api/doctors/${editingDoc.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          roomNumber: editRoom,
          consultationFee: Number(editFee),
          leaveReason: editLeaveReason.trim() || null,
          shiftUpdate: {
            startTime: editStart,
            endTime: editEnd,
            slotDurationMin: Number(editDuration),
            activeDays: editActiveDays,
          },
        }),
      });
      if (res.ok) {
        setEditingDoc(null);
        await loadDoctors();
      }
    } finally {
      setSavingForm(false);
    }
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingForm(true);
    try {
      const res = await authFetch('/api/doctors', {
        method: 'POST',
        body: JSON.stringify({
          specialtyId: Number(newSpecId),
          nameAr: newNameAr,
          nameEn: newNameEn,
          titleAr: newTitleAr,
          titleEn: newTitleEn,
          roomNumber: newRoom,
          consultationFee: Number(newFee),
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewNameAr('');
        setNewNameEn('');
        setNewTitleAr('');
        setNewTitleEn('');
        await loadDoctors();
      }
    } finally {
      setSavingForm(false);
    }
  };

  const columns = useMemo<LegacyColumnDef<DoctorRow>[]>(
    () => [
      {
        accessorKey: 'nameEn',
        header: () => t(lang, 'الطبيب', 'Physician'),
        cell: ({ row }) => (
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {lang === 'ar' ? row.original.nameAr : row.original.nameEn}
            </div>
            <div className="text-[11px] text-slate-500">
              {lang === 'ar' ? row.original.titleAr : row.original.titleEn}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'specialtyNameEn',
        header: () => t(lang, 'التخصص والغرفة', 'Specialty & Suite'),
        cell: ({ row }) => (
          <div className="text-xs">
            <div className="font-medium text-slate-800 dark:text-slate-200">
              {lang === 'ar' ? row.original.specialtyNameAr : row.original.specialtyNameEn}
            </div>
            <div className="text-[11px] text-slate-500">{row.original.roomNumber}</div>
          </div>
        ),
      },
      {
        id: 'schedule',
        header: () => t(lang, 'أيام ووقت الدوام', 'Shift Window'),
        cell: ({ row }) => {
          const activeDays = row.original.scheduleSlots.filter((s) => s.isActive);
          const sample = activeDays[0];
          return (
            <div className="text-xs tabular-nums">
              <div className="font-mono text-slate-800 dark:text-slate-200">
                {sample ? `${sample.startTime} – ${sample.endTime}` : '—'}
              </div>
              <div className="text-[11px] text-slate-500">
                {activeDays
                  .map((s) =>
                    lang === 'ar'
                      ? DAY_LABELS[s.dayOfWeek].shortAr
                      : DAY_LABELS[s.dayOfWeek].shortEn
                  )
                  .join(' · ')}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'consultationFee',
        header: () => t(lang, 'رسوم الكشف', 'Fee'),
        cell: ({ row }) => (
          <span className="text-xs font-semibold tabular-nums text-slate-900 dark:text-white whitespace-nowrap">
            {formatCurrency(row.original.consultationFee, clinic?.currency || 'SAR', lang)}
          </span>
        ),
      },
      {
        accessorKey: 'todayBookings',
        header: () => t(lang, 'مواعيد اليوم', 'Today'),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-200">
            {row.original.todayBookings}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: () => t(lang, 'الحالة', 'Availability'),
        cell: ({ row }) => {
          const onLeave = row.original.status === 'ON_LEAVE';
          return (
            <div>
              <div
                className={`text-xs font-semibold whitespace-nowrap ${
                  onLeave
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-emerald-700 dark:text-emerald-400'
                }`}
              >
                {onLeave ? t(lang, 'في إجازة', 'On Leave') : t(lang, 'نشط', 'Active')}
              </div>
              {onLeave && row.original.leaveReason && (
                <div className="text-[11px] text-slate-500 truncate max-w-[160px]">
                  {row.original.leaveReason}
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: () => t(lang, 'إدارة الجدول', 'Schedule Controls'),
        cell: ({ row }) => {
          const doc = row.original;
          const busy = busyId === doc.id;
          return (
            <div className="flex items-center gap-2 whitespace-nowrap">
              <button
                type="button"
                onClick={() => openShiftEditor(doc)}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <CalendarClock className="h-3.5 w-3.5" />
                <span>{t(lang, 'تعديل الوردية', 'Edit Shift')}</span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => toggleLeaveStatus(doc)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50 ${
                  doc.status === 'ACTIVE'
                    ? 'border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                    : 'bg-teal-600 text-white hover:bg-teal-700'
                }`}
              >
                {doc.status === 'ACTIVE'
                  ? t(lang, 'تفعيل إجازة', 'Set Leave')
                  : t(lang, 'إعادة تفعيل', 'Activate')}
              </button>
            </div>
          );
        },
      },
    ],
    [lang, clinic, busyId, toggleLeaveStatus]
  );

  const table = useLegacyTable({
    data: doctors,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <DashboardShell
      titleAr="إدارة الأطباء وجداول الدوام والإجازات"
      titleEn="Physicians, Shifts & Leave Management"
      breadcrumbAr="الأطباء"
      breadcrumbEn="Doctors"
      actions={
        user?.role === 'CLINIC_OWNER' ? (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 text-xs font-semibold text-white hover:bg-teal-700 cursor-pointer whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{t(lang, 'إضافة طبيب', 'Add Physician')}</span>
          </button>
        ) : null
      }
    >
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-12 rounded-lg bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr
                    key={hg.id}
                    className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs text-slate-500"
                  >
                    {hg.headers.map((header) => (
                      <th key={header.id} className="px-4 py-3 text-start font-semibold whitespace-nowrap">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3.5 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Shift & Leave Modal */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveShift}
            className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {lang === 'ar' ? editingDoc.nameAr : editingDoc.nameEn}
                </h2>
                <div className="text-xs text-slate-500">
                  {t(lang, 'تحديث وردية الدوام والرسوم', 'Update shift schedule, room & consultation fee')}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingDoc(null)}
                className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {t(lang, 'أيام الدوام النشطة', 'Active Shift Days')}
              </label>
              <div className="grid grid-cols-7 gap-1.5">
                {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                  const active = editActiveDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() =>
                        setEditActiveDays((prev) =>
                          prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
                        )
                      }
                      className={`h-9 rounded-md border text-[11px] font-semibold cursor-pointer ${
                        active
                          ? 'border-teal-600 bg-teal-600 text-white'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      {lang === 'ar' ? DAY_LABELS[day].shortAr : DAY_LABELS[day].shortEn}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t(lang, 'البداية', 'Start')}
                </label>
                <input
                  type="time"
                  value={editStart}
                  onChange={(e) => setEditStart(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 text-sm tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t(lang, 'النهاية', 'End')}
                </label>
                <input
                  type="time"
                  value={editEnd}
                  onChange={(e) => setEditEnd(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 text-sm tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t(lang, 'المدة (د)', 'Slot (min)')}
                </label>
                <select
                  value={editDuration}
                  onChange={(e) => setEditDuration(Number(e.target.value))}
                  className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 text-sm tabular-nums"
                >
                  {[15, 20, 30, 45, 60].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t(lang, 'الغرفة / العيادة', 'Suite')}
                </label>
                <input
                  type="text"
                  value={editRoom}
                  onChange={(e) => setEditRoom(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t(lang, 'رسوم الكشف', 'Fee')}
                </label>
                <input
                  type="number"
                  min={50}
                  value={editFee}
                  onChange={(e) => setEditFee(Number(e.target.value))}
                  className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t(lang, 'ملاحظة الإجازة (اختياري)', 'Leave Note (Optional)')}
              </label>
              <input
                type="text"
                value={editLeaveReason}
                onChange={(e) => setEditLeaveReason(e.target.value)}
                placeholder={t(lang, 'مثال: مؤتمر طبي سنوي', 'e.g., Annual Medical Symposium')}
                className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingDoc(null)}
                className="h-10 rounded-lg border border-slate-300 dark:border-slate-700 px-4 text-xs font-semibold cursor-pointer"
              >
                {t(lang, 'إلغاء', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={savingForm}
                className="h-10 rounded-lg bg-teal-600 px-5 text-xs font-semibold text-white hover:bg-teal-700 cursor-pointer disabled:opacity-50"
              >
                {savingForm ? t(lang, 'جاري الحفظ...', 'Saving...') : t(lang, 'حفظ التعديلات', 'Save Shift')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Doctor Modal (Clinic Owner Only) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddDoctor}
            className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t(lang, 'إضافة طبيب جديد للعيادة', 'Add New Physician')}
              </h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-900 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                {t(lang, 'التخصص', 'Specialty')}
              </label>
              <select
                value={newSpecId}
                onChange={(e) => setNewSpecId(Number(e.target.value))}
                className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm"
              >
                {specialties.map((s) => (
                  <option key={s.id} value={s.id}>
                    {lang === 'ar' ? s.nameAr : s.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  {t(lang, 'الاسم بالعربية', 'Name (Arabic)')}
                </label>
                <input
                  type="text"
                  required
                  value={newNameAr}
                  onChange={(e) => setNewNameAr(e.target.value)}
                  placeholder="د. سامي الحسن"
                  className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  {t(lang, 'الاسم بالإنجليزية', 'Name (English)')}
                </label>
                <input
                  type="text"
                  required
                  value={newNameEn}
                  onChange={(e) => setNewNameEn(e.target.value)}
                  placeholder="Dr. Sami Al-Hassan"
                  className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  {t(lang, 'المسمى الوظيفي (عربي)', 'Title (Arabic)')}
                </label>
                <input
                  type="text"
                  required
                  value={newTitleAr}
                  onChange={(e) => setNewTitleAr(e.target.value)}
                  placeholder="استشاري متخصص"
                  className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  {t(lang, 'المسمى الوظيفي (إنجليزي)', 'Title (English)')}
                </label>
                <input
                  type="text"
                  required
                  value={newTitleEn}
                  onChange={(e) => setNewTitleEn(e.target.value)}
                  placeholder="Specialist Consultant"
                  className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  {t(lang, 'رقم الغرفة', 'Suite Number')}
                </label>
                <input
                  type="text"
                  required
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  {t(lang, 'رسوم الكشفية', 'Consultation Fee')}
                </label>
                <input
                  type="number"
                  required
                  min={50}
                  value={newFee}
                  onChange={(e) => setNewFee(Number(e.target.value))}
                  className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm tabular-nums"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="h-10 rounded-lg border border-slate-300 dark:border-slate-700 px-4 text-xs font-semibold cursor-pointer"
              >
                {t(lang, 'إلغاء', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={savingForm}
                className="h-10 rounded-lg bg-teal-600 px-5 text-xs font-semibold text-white hover:bg-teal-700 cursor-pointer disabled:opacity-50"
              >
                {savingForm ? t(lang, 'جاري الإضافة...', 'Adding...') : t(lang, 'حفظ الطبيب', 'Add Doctor')}
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardShell>
  );
}
