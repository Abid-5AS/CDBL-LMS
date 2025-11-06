import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HeroStrip } from "@/components/dashboards/common/HeroStrip";
import { PendingLeaveRequestsTable } from "@/components/dashboards/hr-admin/Sections/PendingApprovals";
import { ReturnedRequestsPanel } from "@/components/dashboards/hr-head/Sections/ReturnedRequests";
import { CancellationRequestsPanel } from "@/components/dashboards/hr-admin/Sections/CancellationRequests";
import { DashboardLoadingFallback, DashboardCardSkeleton } from "../shared/LoadingFallback";
import { DashboardLayout } from "../shared/DashboardLayout";

async function HRHeadDashboardContent() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  // Only allow HR_HEAD role (CEO can also access)
  if (user.role !== "HR_HEAD" && user.role !== "CEO") {
    redirect("/dashboard");
  }

  const username = user.name ?? "HR Head";
  const role = user.role === "CEO" ? "CEO" : "HR_HEAD";

  return (
    <DashboardLayout
      role={role}
      title={`Welcome, ${username}`}
      description="Strategic oversight and final approvals for leave management"
    >
      <div className="space-y-6">
        <HeroStrip name={username} />

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">High-Priority Leave Requests</h2>
          <PendingLeaveRequestsTable />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Returned for Modification</h3>
            <Suspense fallback={<DashboardCardSkeleton />}>
              <ReturnedRequestsPanel />
            </Suspense>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Cancellation Requests</h3>
            <Suspense fallback={<DashboardCardSkeleton />}>
              <CancellationRequestsPanel />
            </Suspense>
          </div>
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
    </DashboardLayout>
  );
}

export default function HRHeadDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoadingFallback />}>
      <HRHeadDashboardContent />
    </Suspense>
  );
}

