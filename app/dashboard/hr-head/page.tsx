import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HRHeadDashboardClient } from "@/components/dashboards/hr-head/HRHeadDashboardClient";
import { DashboardLoadingFallback } from "../shared/LoadingFallback";
import { RoleBasedDashboard } from "@/components/dashboards";

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
    <RoleBasedDashboard
      role={role}
      title={`Welcome, ${username}`}
      description="Review and approve critical leave requests across the organization"
      animate={true}
    >
      <HRHeadDashboardClient />
    </RoleBasedDashboard>
  );
}

export default function HRHeadDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoadingFallback />}>
      <HRHeadDashboardContent />
    </Suspense>
  );
}
