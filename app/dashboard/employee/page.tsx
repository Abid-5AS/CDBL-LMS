import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { DashboardLoadingFallback } from "../shared/LoadingFallback";
import { RoleBasedDashboard } from "@/components/dashboards/shared/RoleBasedDashboard";
import { SelectionProvider } from "@/components/providers";
import { Role } from "@/lib/enums";
import { WhosOutToday } from "@/app/dashboard/shared/WhosOutToday";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";

function WhosOutTodaySkeleton() {
  return (
    <Card className="rounded-[20px] border border-outline/60 dark:border-border bg-surface-1 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Who's Out Today
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse text-sm text-muted-foreground">Loading...</div>
        </div>
      </CardContent>
    </Card>
  );
}

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
        <ModernEmployeeDashboard
          username={username}
          whosOutTodaySlot={
            <Suspense fallback={<WhosOutTodaySkeleton />}>
              <WhosOutToday scope="team" />
            </Suspense>
          }
        />
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
