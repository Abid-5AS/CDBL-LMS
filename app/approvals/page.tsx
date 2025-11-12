import { Suspense } from "react";
import ApprovalsGate from "./approvals-gate";

export default function ApprovalsPage() {
  return (
    <Suspense fallback={<ApprovalsFallback />}>
      <ApprovalsGate />
    </Suspense>
  );
}

function ApprovalsFallback() {
  return (
    <div className="space-y-6">
      <div className="h-32 rounded-2xl border border-border bg-card/90 p-6 shadow-sm" />
      <div className="h-64 rounded-2xl border border-border bg-card/90 shadow-sm" />
    </div>
  );
}
