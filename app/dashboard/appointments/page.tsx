'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { flexRender } from '@tanstack/react-table';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type LegacyColumnDef,
  useLegacyTable,
} from '@tanstack/react-table/legacy';
import { ArrowUpDown, Download, Search } from 'lucide-react';
import { DashboardShell } from '@/src/components/DashboardShell';
import { useApp } from '@/src/components/AppProvider';
import { formatCurrency, STATUS_LABELS, t } from '@/src/lib/i18n';

interface AppointmentRow {
  id: number;
  referenceCode: string;
  patientName: string;
  patientPhone: string;
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

const STATUS_OPTIONS = [
  'ALL',
  'CONFIRMED',
  'CHECKED_IN',
  'IN_CONSULTATION',
  'COMPLETED',
  'CANCELLED',
] as const;

export default function DashboardAppointmentsPage() {
  const { lang, user, authFetch } = useApp();
  const [rows, setRows] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadAppointments = useCallback(async () => {
    if (!user || user.role === 'PATIENT') return;
    try {
      const res = await authFetch('/api/appointments');
      const data = await res.json();
      if (res.ok) {
        setRows(data.appointments ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [user, authFetch]);

  useEffect(() => {
    let active = true;
    if (!user || user.role === 'PATIENT') return;
    authFetch('/api/appointments')
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (active && ok) setRows(data.appointments ?? []);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user, authFetch]);

  const updateStatus = useCallback(
    async (id: number, status: string) => {
      setUpdatingId(id);
      try {
        const res = await authFetch(`/api/appointments/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        });
        if (res.ok) {
          setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
        }
      } finally {
        setUpdatingId(null);
      }
    },
    [authFetch]
  );

  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== 'ALL' && row.status !== statusFilter) return false;
      if (!q) return true;
      return (
        row.referenceCode.toLowerCase().includes(q) ||
        row.patientName.toLowerCase().includes(q) ||
        row.patientPhone.toLowerCase().includes(q) ||
        row.doctorNameAr.toLowerCase().includes(q) ||
        row.doctorNameEn.toLowerCase().includes(q) ||
        row.specialtyNameAr.toLowerCase().includes(q) ||
        row.specialtyNameEn.toLowerCase().includes(q)
      );
    });
  }, [rows, searchQuery, statusFilter]);

  const columns = useMemo<LegacyColumnDef<AppointmentRow>[]>(
    () => [
      {
        accessorKey: 'referenceCode',
        header: () => t(lang, 'المرجع', 'Reference'),
        cell: (info) => (
          <span className="font-mono text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-300">
            {String(info.getValue())}
          </span>
        ),
      },
      {
        accessorKey: 'appointmentDate',
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="inline-flex items-center gap-1 cursor-pointer hover:text-slate-900 dark:hover:text-white"
          >
            <span>{t(lang, 'التاريخ والوقت', 'Date & Time')}</span>
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="tabular-nums whitespace-nowrap">
            <div className="text-xs font-semibold text-slate-900 dark:text-white">
              {row.original.appointmentDate}
            </div>
            <div className="font-mono text-[11px] text-slate-500">
              {row.original.startTime} – {row.original.endTime}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'patientName',
        header: () => t(lang, 'المريض', 'Patient'),
        cell: ({ row }) => (
          <div>
            <div className="text-xs font-semibold text-slate-900 dark:text-white">
              {row.original.patientName}
            </div>
            <div className="text-[11px] tabular-nums text-slate-500">
              {row.original.patientPhone}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'doctorNameEn',
        header: () => t(lang, 'الطبيب والتخصص', 'Physician'),
        cell: ({ row }) => (
          <div>
            <div className="text-xs font-medium text-slate-900 dark:text-slate-100">
              {lang === 'ar' ? row.original.doctorNameAr : row.original.doctorNameEn}
            </div>
            <div className="text-[11px] text-slate-500">
              {lang === 'ar' ? row.original.specialtyNameAr : row.original.specialtyNameEn} ·{' '}
              {row.original.doctorRoom}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'feeAmount',
        header: () => t(lang, 'الرسوم', 'Fee'),
        cell: ({ row }) => (
          <span className="text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-200 whitespace-nowrap">
            {formatCurrency(row.original.feeAmount, row.original.currency, lang)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: () => t(lang, 'الحالة', 'Status'),
        cell: ({ row }) => {
          const st = STATUS_LABELS[row.original.status] || STATUS_LABELS.CONFIRMED;
          return (
            <span className={`text-xs font-semibold whitespace-nowrap ${st.colorClass}`}>
              {lang === 'ar' ? st.ar : st.en}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: () => t(lang, 'تحديث فوري', 'One-Click Status'),
        cell: ({ row }) => {
          const item = row.original;
          const busy = updatingId === item.id;
          return (
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              {item.status !== 'CHECKED_IN' &&
                item.status !== 'COMPLETED' &&
                item.status !== 'CANCELLED' && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => updateStatus(item.id, 'CHECKED_IN')}
                    className="rounded-md border border-amber-300 dark:border-amber-800 px-2 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 cursor-pointer disabled:opacity-50"
                  >
                    {t(lang, 'وصول', 'Check-In')}
                  </button>
                )}
              {item.status !== 'IN_CONSULTATION' &&
                item.status !== 'COMPLETED' &&
                item.status !== 'CANCELLED' && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => updateStatus(item.id, 'IN_CONSULTATION')}
                    className="rounded-md border border-teal-300 dark:border-teal-800 px-2 py-1 text-[11px] font-semibold text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 cursor-pointer disabled:opacity-50"
                  >
                    {t(lang, 'كشف', 'Consult')}
                  </button>
                )}
              {item.status !== 'COMPLETED' && item.status !== 'CANCELLED' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => updateStatus(item.id, 'COMPLETED')}
                  className="rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 cursor-pointer disabled:opacity-50"
                >
                  {t(lang, 'مكتمل', 'Complete')}
                </button>
              )}
              {item.status !== 'CANCELLED' && item.status !== 'COMPLETED' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => updateStatus(item.id, 'CANCELLED')}
                  className="rounded-md border border-rose-200 dark:border-rose-900 px-2 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer disabled:opacity-50"
                >
                  {t(lang, 'إلغاء', 'Cancel')}
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [lang, updatingId, updateStatus]
  );

  const table = useLegacyTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageIndex: 0, pageSize: 10 },
    },
  });

  const exportCsv = () => {
    const headers = [
      'Reference',
      'Date',
      'StartTime',
      'EndTime',
      'Patient',
      'Phone',
      'Doctor',
      'Specialty',
      'Status',
      'Fee',
      'Currency',
    ];
    const escape = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;
    const csvRows = [
      headers.join(','),
      ...filteredData.map((r) =>
        [
          r.referenceCode,
          r.appointmentDate,
          r.startTime,
          r.endTime,
          r.patientName,
          r.patientPhone,
          lang === 'ar' ? r.doctorNameAr : r.doctorNameEn,
          lang === 'ar' ? r.specialtyNameAr : r.specialtyNameEn,
          r.status,
          r.feeAmount,
          r.currency,
        ]
          .map(escape)
          .join(',')
      ),
    ];
    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shifaflow-appointments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardShell
      titleAr="جدول إدارة المواعيد"
      titleEn="Appointments Command Table"
      breadcrumbAr="المواعيد"
      breadcrumbEn="Appointments"
      actions={
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-white px-3.5 text-xs font-semibold text-white dark:text-slate-900 hover:opacity-90 cursor-pointer whitespace-nowrap"
        >
          <Download className="h-3.5 w-3.5" />
          <span>{t(lang, 'تصدير CSV', 'Export CSV')}</span>
        </button>
      }
    >
      <div className="space-y-4">
        {/* Search & Status Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t(
                lang,
                'بحث باسم المريض، الرقم المرجعي، الطبيب أو الجوال...',
                'Search patient, reference ID, physician, or phone...'
              )}
              className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ps-9 pe-3 text-sm focus:border-teal-600 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800">
            {STATUS_OPTIONS.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {st === 'ALL'
                  ? t(lang, 'الكل', 'All')
                  : lang === 'ar'
                  ? STATUS_LABELS[st].ar
                  : STATUS_LABELS[st].en}
              </button>
            ))}
          </div>
        </div>

        {/* TanStack Table Container */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3 animate-pulse">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="h-11 rounded-lg bg-slate-100 dark:bg-slate-800" />
              ))}
            </div>
          ) : filteredData.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                {t(lang, 'لا توجد مواعيد مطابقة للبحث', 'No matching appointments found')}
              </div>
              <p className="text-xs text-slate-500">
                {t(
                  lang,
                  'جرّب تغيير الفلتر أو مسح نص البحث لعرض جميع المواعيد.',
                  'Adjust the status filter or clear your search query.'
                )}
              </p>
            </div>
          ) : (
            <>
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
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-4 py-3 align-middle">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              <div className="border-t border-slate-200 dark:border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                <div>
                  {t(lang, 'إجمالي النتائج:', 'Total results:')} {filteredData.length} ·{' '}
                  {t(lang, 'صفحة', 'Page')} {table.getState().pagination.pageIndex + 1}{' '}
                  {t(lang, 'من', 'of')} {Math.max(1, table.getPageCount())}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="h-8 rounded-md border border-slate-200 dark:border-slate-700 px-3 font-semibold disabled:opacity-40 cursor-pointer"
                  >
                    {t(lang, 'السابق', 'Previous')}
                  </button>
                  <button
                    type="button"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="h-8 rounded-md border border-slate-200 dark:border-slate-700 px-3 font-semibold disabled:opacity-40 cursor-pointer"
                  >
                    {t(lang, 'التالي', 'Next')}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
