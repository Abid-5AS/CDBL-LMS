import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HRAdminDashboard } from "@/components/dashboards";
import { DashboardLoadingFallback } from "../shared/LoadingFallback";
import { DashboardLayout } from "../shared/DashboardLayout";
import {
  getHRAdminKPIData,
  getHRAdminStatsData,
} from "@/lib/dashboard/hr-admin-data";

async function HRAdminDashboardContent() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  // Only allow HR_ADMIN role
  if (user.role !== "HR_ADMIN") {
    redirect("/dashboard");
  }

  const username = user.name ?? "HR Admin";
  const [initialKpis, initialStats] = await Promise.all([
    getHRAdminKPIData(user),
    getHRAdminStatsData({ user }),
  ]);

  return (
    <DashboardLayout
      role="HR_ADMIN"
      title={`Welcome, ${username}`}
      description="Operational leave management and forwarding"
    >
      <HRAdminDashboard
        username={username}
        initialKpis={initialKpis}
        initialStats={initialStats}
      />
    </DashboardLayout>
  );
}

export default function HRAdminDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoadingFallback />}>
      <HRAdminDashboardContent />
    </Suspense>
  );
}
