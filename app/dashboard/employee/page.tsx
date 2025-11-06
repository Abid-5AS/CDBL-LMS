import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EmployeeDashboardContent } from "@/components/dashboards/employee/Overview";
import { DashboardLoadingFallback } from "../shared/LoadingFallback";
import { DashboardLayout } from "../shared/DashboardLayout";

async function EmployeeDashboardPageContent() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  // Only allow EMPLOYEE role
  if (user.role !== "EMPLOYEE") {
    redirect("/dashboard");
  }

  const username = user.name ?? "User";

  return (
    <DashboardLayout
      role="EMPLOYEE"
      title={`Welcome back, ${username}`}
      description="Manage your leave requests and track your balance"
    >
      <EmployeeDashboardContent username={username} />
    </DashboardLayout>
  );
}

export default function EmployeeDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoadingFallback />}>
      <EmployeeDashboardPageContent />
    </Suspense>
  );
}

