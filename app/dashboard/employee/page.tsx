import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { DashboardLoadingFallback } from "../shared/LoadingFallback";
import { RoleBasedDashboard } from "@/components/dashboards/shared/RoleBasedDashboard";
import { SelectionProvider } from "@/components/providers";
import { Role } from "@/lib/enums";

const ModernEmployeeDashboard = dynamic(
  () => import("@/components/dashboards").then((mod) => mod.ModernEmployeeDashboard),
  {
    loading: () => <DashboardLoadingFallback />,
  }
);

async function EmployeeDashboardPageContent() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Only allow EMPLOYEE role
  if (user.role !== Role.EMPLOYEE) {
    redirect("/dashboard");
  }

  const username = user.name ?? "User";

  return (
    <SelectionProvider>
      <RoleBasedDashboard
        role={Role.EMPLOYEE}
        title={undefined}
        description={undefined}
        compactHeader
        backgroundVariant="solid"
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
