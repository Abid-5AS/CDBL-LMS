import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HeroStrip } from "@/components/dashboard/HeroStrip";
import { PendingLeaveRequestsTable } from "@/components/dashboard/PendingLeaveRequestsTable";

async function ManagerDashboardContent() {
  const user = await getCurrentUser();

  if (!user || !["DEPT_HEAD", "CEO"].includes(user.role as string)) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <HeroStrip name={user.name ?? "Department Head"} />

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Team Leave Requests Pending Your Approval</h2>
        <PendingLeaveRequestsTable />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-medium text-slate-900 mb-3">Team Overview</h3>
          <p className="text-sm text-gray-600">View your department's leave trends and balances.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-medium text-slate-900 mb-3">Quick Actions</h3>
          <p className="text-sm text-gray-600">Approve requests, view team calendars, and more.</p>
        </div>
      </div>
    </div>
  );
}

export default function ManagerDashboard() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <ManagerDashboardContent />
    </Suspense>
  );
}

function DashboardFallback() {
  return (
    <div className="space-y-6">
      <div className="h-36 rounded-xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse" />
      <div className="h-64 rounded-xl border border-slate-200 bg-white shadow-sm animate-pulse" />
    </div>
  );
}
