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
      <div className="h-32 rounded-xl border border-border-strong bg-bg-primary p-6 shadow-sm" />
      <div className="h-64 rounded-xl border border-border-strong bg-bg-primary shadow-sm" />
    </div>
  );
}
