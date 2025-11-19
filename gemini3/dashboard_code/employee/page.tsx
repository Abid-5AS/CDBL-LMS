import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ModernEmployeeDashboard } from "@/components/dashboards";
import { DashboardLoadingFallback } from "../shared/LoadingFallback";
import { DashboardLayout } from "../shared/DashboardLayout";
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
      <ModernEmployeeDashboard username={username} />
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
