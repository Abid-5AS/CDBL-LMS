import AppShell from "@/components/app-shell";
import { Suspense } from "react";
import { ReportsContent } from "./components/ReportsContent";

export default function ReportsPage() {
  return (
    <AppShell title="Reports" pathname="/reports">
      <div className="space-y-6">
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Access analytics, insights, and detailed reports on leave management
          </p>
        </section>
        <Suspense fallback={<ReportsFallback />}>
          <ReportsContent />
        </Suspense>
      </div>
    </AppShell>
  );
}

function ReportsFallback() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
