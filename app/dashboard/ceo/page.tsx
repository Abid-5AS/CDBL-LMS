import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SuperAdminDashboard } from "@/components/dashboards";
import { DashboardLoadingFallback } from "../shared/LoadingFallback";
import { DashboardLayout } from "../shared/DashboardLayout";

async function CEODashboardContent() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  // Only allow CEO role
  if (user.role !== "CEO") {
    redirect("/dashboard");
  }

  const username = user.name ?? "Executive";

  return (
    <DashboardLayout>
      <SuperAdminDashboard username={username} />
    </DashboardLayout>
  );
}

export default function CEODashboardPage() {
  return (
    <Suspense fallback={<DashboardLoadingFallback />}>
      <CEODashboardContent />
    </Suspense>
  );
}

