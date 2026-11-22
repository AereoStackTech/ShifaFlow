export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] p-6 sm:p-10">
      <div className="mx-auto max-w-7xl space-y-6 animate-pulse">
        <div className="h-12 w-full rounded-xl bg-slate-200/70 dark:bg-slate-800/70" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-6 h-64 rounded-xl bg-slate-200/70 dark:bg-slate-800/70" />
          <div className="lg:col-span-6 h-64 rounded-xl bg-slate-200/70 dark:bg-slate-800/70" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-200/70 dark:bg-slate-800/70" />
          ))}
        </div>
      </div>
    </div>
  );
}
