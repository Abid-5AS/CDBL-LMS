import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SystemAdminDashboard } from "@/components/dashboards/admin/Overview";
import { DashboardLoadingFallback } from "../shared/LoadingFallback";
import { DashboardLayout } from "../shared/DashboardLayout";

async function AdminDashboardContent() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  // Only allow SYSTEM_ADMIN role
  if (user.role !== "SYSTEM_ADMIN") {
    redirect("/dashboard");
  }

  const username = user.name ?? "System Admin";

  return (
    <DashboardLayout
      title="Admin Console"
      description="System-level configuration and management"
    >
      <SystemAdminDashboard username={username} />
    </DashboardLayout>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoadingFallback />}>
      <AdminDashboardContent />
    </Suspense>
  );
}

