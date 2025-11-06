import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DeptHeadDashboardWrapper } from "@/components/dashboard/DeptHeadDashboardWrapper";
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

  return (
    <DashboardLayout fullWidth>
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

