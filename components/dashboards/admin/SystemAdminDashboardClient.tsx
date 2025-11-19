"use client";

import { Suspense, ReactNode } from "react";
import Link from "next/link";
import { Activity, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KPICard } from "@/components/cards/KPICard";
import { QuickActions } from "@/components/shared/QuickActions";
import { DashboardSection } from "@/app/dashboard/shared/DashboardLayout";
import { DashboardCardSkeleton } from "@/components/shared/skeletons";
import { RoleBasedDashboard } from "@/components/dashboards/shared/RoleBasedDashboard";
import { ConfigurationChecklist } from "./ConfigurationChecklist";
import { SystemAlertsPanel } from "./SystemAlertsPanel";

type SystemStats = {
  totalUsers: number;
  activeAdmins: number;
  systemHealth: string;
};

type HeaderProps = {
  username: string;
};

type QuickStatsProps = {
  systemStats: SystemStats;
};

export function SystemAdminHeader({ username }: HeaderProps) {
  const actions = [
    {
      label: "User Management",
      icon: Users,
      href: "/admin",
      variant: "default" as const,
    },
    {
      label: "Audit Logs",
      icon: Activity,
      href: "/admin/audit",
      variant: "outline" as const,
    },
    {
      label: "System Settings",
      icon: Settings,
      href: "/admin",
      variant: "outline" as const,
    },
  ];

  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Admin Console
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Welcome back, {username}. Manage system configuration and users.
        </p>
      </div>
      <QuickActions actions={actions} />
    </div>
  );
}

export function SystemOverviewCards() {
  return (
    <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="System Status"
        value="Healthy"
        subtext="All systems operational"
        icon={Activity}
        iconColor="text-data-success"
        accentColor="bg-data-success"
      />
    </div>
  );
}

export function SystemQuickStats({ systemStats }: QuickStatsProps) {
  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
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
        icon={Settings}
        iconColor="text-card-summary"
        accentColor="bg-card-summary"
      />
      <KPICard
        title="System Health"
        value={systemStats.systemHealth === "healthy" ? "Healthy" : "Warning"}
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
    </div>
  );
}

export function SystemQuickAccess() {
  const cards = [
    {
      href: "/admin",
      icon: Users,
      title: "User Management",
      description: "Manage users, roles, and permissions",
    },
    {
      href: "/admin",
      icon: Settings,
      title: "Policy Configuration",
      description: "Configure leave policies and rules",
    },
    {
      href: "/admin/audit",
      icon: Activity,
      title: "Audit Logs",
      description: "View system activity and changes",
    },
  ];

  return (
    <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
      {cards.map(({ href, icon: Icon, title, description }) => (
        <Button
          key={title}
          asChild
          variant="outline"
          className="h-auto flex-col items-start p-6"
        >
          <Link href={href} className="flex flex-col items-start">
            <Icon className="mb-2 h-6 w-6" />
            <span className="font-semibold">{title}</span>
            <span className="text-xs text-muted-foreground mt-1">
              {description}
            </span>
          </Link>
        </Button>
      ))}
    </div>
  );
}

/**
 * SystemAdminDashboardContent - Client wrapper with RoleBasedDashboard
 *
 * Wraps the dashboard content with role-based styling, animations, and sections.
 * This is a client component to support RoleBasedDashboard wrapper and animations.
 */
type SystemAdminDashboardContentProps = {
  username: string;
  systemStats: SystemStats;
  auditLogsSlot?: ReactNode;
};

export function SystemAdminDashboardContent({
  username,
  systemStats,
  auditLogsSlot,
}: SystemAdminDashboardContentProps) {
  return (
    <RoleBasedDashboard
      role="SYSTEM_ADMIN"
      title="Admin Console"
      description="System-level configuration and management"
      animate
    >
      <div className="space-y-6">
        <SystemAdminHeader username={username} />

        <DashboardSection
          title="System Overview"
          description="Key system metrics and status"
        >
          <Suspense fallback={<DashboardCardSkeleton />}>
            <SystemOverviewCards />
          </Suspense>
        </DashboardSection>

        <DashboardSection title="Quick Stats">
          <SystemQuickStats systemStats={systemStats} />
        </DashboardSection>

        {/* Configuration & Alerts Row */}
        <DashboardSection
          title="System Configuration & Alerts"
          description="Configuration status and system health monitoring"
        >
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            <ConfigurationChecklist />
            <SystemAlertsPanel />
          </div>
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
          {auditLogsSlot || <DashboardCardSkeleton />}
        </DashboardSection>

        <DashboardSection
          title="Quick Access"
          description="Common administrative tasks"
        >
          <SystemQuickAccess />
        </DashboardSection>
      </div>
    </RoleBasedDashboard>
  );
}
