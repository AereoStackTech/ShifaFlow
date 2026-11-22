'use client';

import React from 'react';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0B1120] px-4 text-slate-900 dark:text-slate-100">
      <div className="max-w-md w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center space-y-4">
        <div className="font-mono text-4xl font-bold tabular-nums text-rose-600 dark:text-rose-400">
          500
        </div>
        <h1 className="text-xl font-bold">
          حدث خطأ غير متوقع · Something went wrong
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {error.message || 'An unexpected application error occurred while rendering this view.'}
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-teal-600 px-5 text-sm font-semibold text-white hover:bg-teal-700 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>إعادة المحاولة · Retry</span>
          </button>
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-lg border border-slate-300 dark:border-slate-700 px-4 text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
