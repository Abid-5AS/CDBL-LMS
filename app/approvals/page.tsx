import { Suspense } from "react";
import AppShell from "@/components/app-shell";
import ApprovalsGate from "./approvals-gate";

export default function ApprovalsPage() {
  return (
    <AppShell title="Approvals" pathname="/approvals">
      <Suspense fallback={<ApprovalsFallback />}>
        <ApprovalsGate />
      </Suspense>
    </AppShell>
  );
}

function ApprovalsFallback() {
  return (
    <div className="space-y-6">
      <div className="h-32 rounded-xl border border-slate-200 bg-white p-6 shadow-sm" />
      <div className="h-64 rounded-xl border border-slate-200 bg-white shadow-sm" />
    </div>
  );
}
