import { Suspense } from "react";
import Link from "next/link";
import { Role } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { DashboardSection } from "@/app/dashboard/shared/DashboardLayout";
import { DashboardCardSkeleton } from "@/app/dashboard/shared/LoadingFallback";
import { RecentAuditLogs } from "@/components/shared/widgets/RecentAuditLogs";
import {
  SystemAdminHeader,
  SystemOverviewCards,
  SystemQuickStats,
  SystemQuickAccess,
} from "./SystemAdminDashboardClient";
import { prisma } from "@/lib/prisma";

type SystemAdminDashboardProps = {
  username: string;
};

type SystemStats = {
  totalUsers: number;
  activeAdmins: number;
  systemHealth: string;
};

async function getSystemStats(): Promise<SystemStats> {
  const [totalUsers, activeAdmins] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        role: {
          in: [Role.HR_ADMIN, Role.HR_HEAD, Role.CEO, Role.SYSTEM_ADMIN],
        },
      },
    }),
  ]);

  return {
    totalUsers,
    activeAdmins,
    systemHealth: "healthy",
  };
}

export async function SystemAdminDashboard({ username }: SystemAdminDashboardProps) {
  const systemStats = await getSystemStats();

  return (
    <div className="space-y-6">
      <SystemAdminHeader username={username} />

      <DashboardSection title="System Overview" description="Key system metrics and status">
        <Suspense fallback={<DashboardCardSkeleton />}>
          <SystemOverviewCards />
        </Suspense>
      </DashboardSection>

      <DashboardSection title="Quick Stats">
        <SystemQuickStats systemStats={systemStats} />
      </DashboardSection>

      <DashboardSection
        title="Recent Audit Logs"
        description="System activity and access logs"
        action={
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/audit">View All</Link>
          </Button>
        }
      >
        <Suspense fallback={<DashboardCardSkeleton />}>
          <RecentAuditLogs />
        </Suspense>
      </DashboardSection>

      <DashboardSection title="Quick Access" description="Common administrative tasks">
        <SystemQuickAccess />
      </DashboardSection>
    </div>
  );
}
