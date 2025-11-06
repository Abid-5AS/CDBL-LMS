import { Suspense } from "react";
import { ReportsContent } from "./components/ReportsContent";

export default function ReportsPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-8 mt-20 space-y-8">
      <section className="glass-card rounded-2xl p-6 backdrop-blur-lg bg-white/60 dark:bg-neutral-950/60 border border-neutral-200/70 dark:border-neutral-800/70 shadow-lg">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Reports & Analytics</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          View leave statistics, departmental summaries, and generate exportable insights
        </p>
      </section>
      <Suspense fallback={<ReportsFallback />}>
        <ReportsContent />
      </Suspense>
    </div>
  );
}

function ReportsFallback() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
    </div>
  );
}
