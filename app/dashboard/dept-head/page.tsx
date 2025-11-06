import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DeptHeadDashboardWrapper } from "@/components/dashboards/dept-head/Overview";
import { DashboardLoadingFallback } from "../shared/LoadingFallback";
import { DashboardLayout } from "../shared/DashboardLayout";

async function DeptHeadDashboardContent() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  // Only allow DEPT_HEAD role (CEO can also access manager dashboard)
  if (user.role !== "DEPT_HEAD" && user.role !== "CEO") {
    redirect("/dashboard");
  }

  const username = user.name ?? "Manager";

  return (
    <DashboardLayout
      role={user.role === "CEO" ? "CEO" : "DEPT_HEAD"}
      fullWidth
      title={`Welcome, ${username}`}
      description="Review and manage team leave requests"
    >
      <DeptHeadDashboardWrapper />
    </DashboardLayout>
  );
}

export default function DeptHeadDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoadingFallback />}>
      <DeptHeadDashboardContent />
    </Suspense>
  );
}

