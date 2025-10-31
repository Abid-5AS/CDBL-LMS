import AppShell from "@/components/app-shell";
import { Suspense } from "react";
import { MyLeavesContent } from "./_components/my-leaves-content";

export default function MyLeavesPage() {
  return (
    <AppShell title="My Leave Requests" pathname="/leaves/my">
      <Suspense fallback={<MyLeavesFallback />}>
        <MyLeavesContent />
      </Suspense>
    </AppShell>
  );
}

function MyLeavesFallback() {
  return (
    <div className="space-y-6">
      <div className="h-12 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
    </div>
  );
}
