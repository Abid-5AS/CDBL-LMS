import { Suspense } from "react";
import AppShell from "@/components/app-shell";
import { ApplyLeaveForm } from "./_components/apply-leave-form";

export default function ApplyLeavePage() {
  return (
    <AppShell title="Apply Leave" pathname="/leaves/apply">
      <Suspense fallback={<ApplyLeaveFallback />}>
        <ApplyLeaveForm />
      </Suspense>
    </AppShell>
  );
}

function ApplyLeaveFallback() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <div className="h-36 rounded-xl border border-slate-200 bg-white shadow-sm" />
        <div className="h-96 rounded-xl border border-slate-200 bg-white shadow-sm" />
      </div>
      <div className="space-y-4">
        <div className="h-64 rounded-xl border border-slate-200 bg-white shadow-sm" />
        <div className="h-48 rounded-xl border border-slate-200 bg-white shadow-sm" />
      </div>
    </div>
  );
}
