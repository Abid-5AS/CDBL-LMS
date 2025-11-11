"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Shield, Users, Activity, Settings } from "lucide-react";

// UI Components (barrel export)
import { Button } from "@/components/ui";

// Shared Components (barrel export)
import { KPICard } from "@/components/cards";
import { QuickActions } from "@/components/shared";
import { RecentAuditLogs } from "@/components/shared/widgets/RecentAuditLogs";

// Local imports
import {
  DashboardGrid,
  DashboardSection,
} from "@/app/dashboard/shared/DashboardLayout";
import { DashboardCardSkeleton } from "@/app/dashboard/shared/LoadingFallback";

type SystemAdminDashboardProps = {
  username: string;
};

import { apiFetcher } from "@/lib/apiClient";

/**
 * System Admin Dashboard - System-Level Configuration
 * Focus: User management, policy configuration, audit logs, system stats
 */
export function SystemAdminDashboard({ username }: SystemAdminDashboardProps) {
  const router = useRouter();

  // Fetch system stats
  const { data: systemData } = useSWR("/api/admin/system-stats", apiFetcher, {
    revalidateOnFocus: false,
  });

  const systemStats = systemData || {
    totalUsers: 0,
    activeAdmins: 0,
    systemHealth: "healthy",
  };

  const quickActions = [
    {
      label: "User Management",
      icon: Users,
      onClick: () => router.push("/admin"),
      variant: "default" as const,
      ariaLabel: "Manage users and roles",
    },
    {
      label: "Audit Logs",
      icon: Activity,
      onClick: () => router.push("/admin/audit"),
      variant: "outline" as const,
      ariaLabel: "View audit logs",
    },
    {
      label: "System Settings",
      icon: Settings,
      onClick: () => router.push("/admin"),
      variant: "outline" as const,
      ariaLabel: "Configure system settings",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardSection
        title="Admin Console"
        description={`Welcome back, ${username}. Manage system configuration and users.`}
        action={<QuickActions actions={quickActions} />}
      >
        <div />
      </DashboardSection>

      {/* System Overview Cards */}
      <DashboardSection
        title="System Overview"
        description="Key system metrics and status"
      >
        <Suspense fallback={<DashboardCardSkeleton />}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="System Status"
              value="Healthy"
              subtext="All systems operational"
              icon={Activity}
              iconColor="text-data-success"
              accentColor="bg-data-success"
            />
          </div>
        </Suspense>
      </DashboardSection>

      {/* Quick Stats */}
      <DashboardSection title="Quick Stats">
        <DashboardGrid>
          <KPICard
            title="Total Users"
            value={systemStats.totalUsers.toString()}
            subtext="All system users"
            icon={Users}
            iconColor="text-data-info"
            accentColor="bg-data-info"
          />
          <KPICard
            title="Active Admins"
            value={systemStats.activeAdmins.toString()}
            subtext="HR Admins + System Admins"
            icon={Shield}
            iconColor="text-card-summary"
            accentColor="bg-card-summary"
          />
          <KPICard
            title="System Health"
            value={
              systemStats.systemHealth === "healthy" ? "Healthy" : "Warning"
            }
            subtext="System status"
            icon={Activity}
            iconColor={
              systemStats.systemHealth === "healthy"
                ? "text-data-success"
                : "text-data-warning"
            }
            accentColor={
              systemStats.systemHealth === "healthy"
                ? "bg-data-success"
                : "bg-data-warning"
            }
            status={systemStats.systemHealth === "healthy" ? "healthy" : "low"}
          />
        </DashboardGrid>
      </DashboardSection>

      {/* Recent Audit Logs */}
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

      {/* Quick Access */}
      <DashboardSection
        title="Quick Access"
        description="Common administrative tasks"
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Button
            asChild
            variant="outline"
            className="h-auto flex-col items-start p-6"
          >
            <Link href="/admin">
              <Users className="mb-2 h-6 w-6" />
              <span className="font-semibold">User Management</span>
              <span className="text-xs text-muted-foreground mt-1">
                Manage users, roles, and permissions
              </span>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-auto flex-col items-start p-6"
          >
            <Link href="/admin">
              <Settings className="mb-2 h-6 w-6" />
              <span className="font-semibold">Policy Configuration</span>
              <span className="text-xs text-muted-foreground mt-1">
                Configure leave policies and rules
              </span>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-auto flex-col items-start p-6"
          >
            <Link href="/admin/audit">
              <Activity className="mb-2 h-6 w-6" />
              <span className="font-semibold">Audit Logs</span>
              <span className="text-xs text-muted-foreground mt-1">
                View system activity and changes
              </span>
            </Link>
          </Button>
        </div>
      </DashboardSection>
    </div>
  );
}
