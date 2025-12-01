import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CorporateHRAdminDashboard } from "@/components/dashboards/hr-admin/CorporateHRAdminDashboard";
import { DashboardLoadingFallback } from "../shared/LoadingFallback";
import { EncashmentService } from "@/lib/services/encashment.service";


async function HRAdminDashboardContent() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Only allow HR_ADMIN role
  if (user.role !== "HR_ADMIN") {
    redirect("/dashboard");
  }

  const pendingEncashmentRequests = await EncashmentService.getPendingRequests();

  return (
    <CorporateHRAdminDashboard
      initialEncashmentRequests={pendingEncashmentRequests}
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
