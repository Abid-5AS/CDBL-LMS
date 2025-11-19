import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CorporateHRHeadDashboard } from "@/components/dashboards/hr-head/CorporateHRHeadDashboard";
import { DashboardLoadingFallback } from "../shared/LoadingFallback";

async function HRHeadDashboardContent() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Only allow HR_HEAD role (CEO can also access)
  if (user.role !== "HR_HEAD" && user.role !== "CEO") {
    redirect("/dashboard");
  }

  return <CorporateHRHeadDashboard />;
}

export default function HRHeadDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoadingFallback />}>
      <HRHeadDashboardContent />
    </Suspense>
  );
}
