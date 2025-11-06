import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HRAdminDashboard } from "@/components/dashboard/HRAdminDashboard";
import { DashboardLoadingFallback } from "../shared/LoadingFallback";
import { DashboardLayout } from "../shared/DashboardLayout";

async function HRAdminDashboardContent() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  // Only allow HR_ADMIN role
  if (user.role !== "HR_ADMIN") {
    redirect("/dashboard");
  }

  const username = user.name ?? "HR Admin";

  return (
    <DashboardLayout>
      <HRAdminDashboard username={username} />
    </DashboardLayout>
  );
}

export default function HRAdminDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoadingFallback />}>
      <HRAdminDashboardContent />
    </Suspense>
  );
}

