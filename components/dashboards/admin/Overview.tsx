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
  SystemAdminDashboardContent,
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

export async function SystemAdminDashboard({
  username,
}: SystemAdminDashboardProps) {
  const systemStats = await getSystemStats();

  return (
    <SystemAdminDashboardContent
      username={username}
      systemStats={systemStats}
    />
  );
}
