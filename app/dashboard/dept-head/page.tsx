import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CorporateManagerDashboard } from "@/components/dashboards/dept-head/CorporateManagerDashboard";
import { DashboardLoadingFallback } from "../shared/LoadingFallback";

async function DeptHeadDashboardContent() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Only allow DEPT_HEAD role (CEO can also access manager dashboard)
  if (user.role !== "DEPT_HEAD" && user.role !== "CEO") {
    redirect("/dashboard");
  }

  return <CorporateManagerDashboard />;
}

export default function DeptHeadDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoadingFallback />}>
      <DeptHeadDashboardContent />
    </Suspense>
  );
}
