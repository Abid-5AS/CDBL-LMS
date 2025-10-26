import { Suspense } from "react";
import AppShell from "@/components/app-shell";
import DashboardContent from "./dashboard-content";

export default function DashboardPage() {
  return (
    <AppShell title="Dashboard" pathname="/dashboard">
      <Suspense fallback={<DashboardFallback />}>
        <DashboardContent />
      </Suspense>
    </AppShell>
  );
}

function DashboardFallback() {
  return (
    <div className="space-y-8">
      <div className="h-36 rounded-xl border border-slate-200 bg-white p-6 shadow-sm" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 rounded-xl border border-slate-200 bg-white shadow-sm" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-12 rounded-xl border border-slate-200 bg-white" />
          <div className="h-64 rounded-xl border border-slate-200 bg-white" />
        </div>
        <div className="space-y-4">
          <div className="h-32 rounded-xl border border-slate-200 bg-white" />
          <div className="h-32 rounded-xl border border-slate-200 bg-white" />
          <div className="h-32 rounded-xl border border-slate-200 bg-white" />
        </div>
      </div>
    </div>
  );
}
