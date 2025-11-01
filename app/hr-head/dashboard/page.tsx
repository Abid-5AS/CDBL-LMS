import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HeroStrip } from "@/components/dashboard/HeroStrip";
import { PendingLeaveRequestsTable } from "@/components/dashboard/PendingLeaveRequestsTable";

async function HRHeadDashboardContent() {
  const user = await getCurrentUser();

  if (!user || !["HR_HEAD", "CEO"].includes(user.role as string)) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <HeroStrip name={user.name ?? "HR Head"} />

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">High-Priority Leave Requests</h2>
        <PendingLeaveRequestsTable />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-medium text-slate-900 mb-3">HR Compliance</h3>
          <p className="text-sm text-gray-600">Review policy adherence and audit trails.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-medium text-slate-900 mb-3">Team Management</h3>
          <p className="text-sm text-gray-600">Oversee HR Admin activities and approvals.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-medium text-slate-900 mb-3">Reports</h3>
          <p className="text-sm text-gray-600">Generate organization-wide leave analytics.</p>
        </div>
      </div>
    </div>
  );
}

export default function HRHeadDashboard() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <HRHeadDashboardContent />
    </Suspense>
  );
}

function DashboardFallback() {
  return (
    <div className="space-y-6">
      <div className="h-36 rounded-xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse" />
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl border border-slate-200 bg-white shadow-sm animate-pulse" />
        ))}
      </div>
    </div>
  );
}
