import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ModernEmployeeDashboard } from "@/components/dashboards/employee/ModernOverview";
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

  return <ModernEmployeeDashboard username={username} />;
}

export default function EmployeeDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoadingFallback />}>
      <EmployeeDashboardPageContent />
    </Suspense>
  );
}
