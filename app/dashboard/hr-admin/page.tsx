import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CorporateHRAdminDashboard } from "@/components/dashboards/hr-admin/CorporateHRAdminDashboard";
import { DashboardLoadingFallback } from "../shared/LoadingFallback";
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

  const [initialKpis, initialStats] = await Promise.all([
    getHRAdminKPIData(user),
    getHRAdminStatsData({ user }),
  ]);

  return (
    <CorporateHRAdminDashboard
      initialKpis={initialKpis}
      initialStats={initialStats}
    />
  );
}

export default function HRAdminDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoadingFallback />}>
      <HRAdminDashboardContent />
    </Suspense>
  );
}
