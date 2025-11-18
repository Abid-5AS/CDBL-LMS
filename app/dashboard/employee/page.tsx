import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ModernEmployeeDashboard } from "@/components/dashboards";
import { DashboardLoadingFallback } from "../shared/LoadingFallback";
import { RoleBasedDashboard } from "@/components/dashboards/shared/RoleBasedDashboard";
import { SelectionProvider } from "@/lib/selection-context";

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
    <SelectionProvider>
      <RoleBasedDashboard
        role="EMPLOYEE"
        title={`Welcome, ${username}`}
        description="Manage your leave requests and view balances"
        animate={true}
      >
        <ModernEmployeeDashboard username={username} />
      </RoleBasedDashboard>
    </SelectionProvider>
  );
}

export default function EmployeeDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoadingFallback />}>
      <EmployeeDashboardPageContent />
    </Suspense>
  );
}
