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
      <div className="h-32 rounded-3xl border border-border bg-card/90 backdrop-blur-sm p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)]" />
      <div className="h-64 rounded-3xl border border-border bg-card/90 backdrop-blur-sm shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)]" />
    </div>
  );
}
