import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EmployeeDashboardUnified } from "@/components/dashboard/EmployeeDashboardUnified";
import { DashboardLoadingFallback } from "../shared/LoadingFallback";
import { DashboardLayout } from "../shared/DashboardLayout";

async function EmployeeDashboardContent() {
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
    <DashboardLayout>
      <EmployeeDashboardUnified username={username} />
    </DashboardLayout>
  );
}

export default function EmployeeDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoadingFallback />}>
      <EmployeeDashboardContent />
    </Suspense>
  );
}

