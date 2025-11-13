"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Settings,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui";
import { useApiQuery } from "@/lib/apiClient";
import { useLeaveRequests } from "@/hooks";
import { leaveTypeLabel } from "@/lib/ui";
import { RoleBasedDashboard, RoleKPICard } from "../shared/RoleBasedDashboard";
import {
  ResponsiveDashboardGrid,
  DashboardWithSidebar,
} from "../shared/ResponsiveDashboardGrid";
import { TabbedContent } from "../shared/ProgressiveDisclosure";
import useSWR from "swr";
import { apiFetcher } from "@/lib/apiClient";

// Extracted components
import { EmployeeActionCenter } from "./components/EmployeeActionCenter";
import { EmployeeRecentActivity } from "./components/EmployeeRecentActivity";
import { EmployeeLeaveBalance } from "./components/EmployeeLeaveBalance";
import { FloatingQuickActions } from "./components/FloatingQuickActions";

// Extracted hooks and utils
import { useEmployeeDashboardData } from "./hooks/useEmployeeDashboardData";

type EmployeeDashboardContentProps = {
  username: string;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export function ModernEmployeeDashboard({
  username,
}: EmployeeDashboardContentProps) {
  const router = useRouter();
  const [showCustomization, setShowCustomization] = React.useState(false);

  const { allRows: leaves, isLoading: isLoadingLeaves } = useLeaveRequests({
    enableSelection: false,
  });
  const { data: balanceData, isLoading: isLoadingBalance } =
    useApiQuery<Record<string, number>>("/api/balance/mine");

  // Fetch team data
  const { data: teamData, isLoading: isLoadingTeam } = useSWR(
    "/api/team/status",
    apiFetcher
  );

  // Fetch holidays data
  const { data: holidaysData, isLoading: isLoadingHolidays } = useSWR(
    "/api/holidays/upcoming",
    apiFetcher
  );

  // Process data using custom hook
  const dashboardData = useEmployeeDashboardData(leaves, balanceData);

  // Header actions
  const headerActions = (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setShowCustomization(true)}
      className="gap-2"
    >
      <Settings className="size-4" aria-hidden="true" />
      <span className="hidden sm:inline">Customize</span>
    </Button>
  );

  const quickActions = [
    {
      label: "Apply for Leave",
      description: "Start a new leave request",
      icon: Plus,
      accent: "bg-gradient-to-br from-indigo-500 to-purple-500 text-white",
      onClick: () => router.push("/leaves/apply"),
    },
  ];

  return (
    <>
      <FloatingQuickActions actions={quickActions} />
      <RoleBasedDashboard
        role="EMPLOYEE"
        title={`Welcome back, ${username}`}
        description="Manage your time off, track balances, and stay updated with your leave requests"
        actions={headerActions}
        animate={true}
        backgroundVariant="solid"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6 lg:space-y-8"
        >
          {/* Quick Stats Grid */}
          <ResponsiveDashboardGrid
            columns="2:2:4:4"
            gap="md"
            animate={true}
            staggerChildren={0.1}
            delayChildren={0.2}
          >
            <RoleKPICard
              title="Pending Requests"
              value={dashboardData.pendingCount}
              subtitle={
                dashboardData.pendingStageInfo
                  ? `With ${dashboardData.pendingStageInfo.role} • ${dashboardData.pendingAverageWait}d avg wait`
                  : "Awaiting approval"
              }
              icon={dashboardData.pendingStageInfo?.icon || Clock}
              role="EMPLOYEE"
              animate={true}
            />

            <RoleKPICard
              title="Total Balance"
              value={dashboardData.totalBalance}
              subtitle="Days available"
              icon={Calendar}
              role="EMPLOYEE"
              animate={true}
            />

            <RoleKPICard
              title="Days Used"
              value={dashboardData.usedThisYear}
              subtitle="This year"
              icon={BarChart3}
              role="EMPLOYEE"
              animate={true}
            />

            <RoleKPICard
              title={
                dashboardData.nextScheduledLeave
                  ? "Next Leave"
                  : "No Upcoming Leave"
              }
              value={
                dashboardData.daysUntilNextLeave !== null
                  ? dashboardData.daysUntilNextLeave === 0
                    ? "Today"
                    : dashboardData.daysUntilNextLeave === 1
                    ? "Tomorrow"
                    : `${dashboardData.daysUntilNextLeave} days`
                  : "—"
              }
              subtitle={
                dashboardData.nextScheduledLeave
                  ? `${
                      leaveTypeLabel[dashboardData.nextScheduledLeave.type] ||
                      dashboardData.nextScheduledLeave.type
                    } (${
                      dashboardData.nextScheduledLeave.workingDays || 0
                    } days)`
                  : "Plan your next vacation"
              }
              icon={TrendingUp}
              role="EMPLOYEE"
              animate={true}
            />
          </ResponsiveDashboardGrid>

          {/* Action Center */}
          <motion.div variants={itemVariants}>
            <EmployeeActionCenter actionItems={dashboardData.actionItems} />
          </motion.div>

          {/* Dashboard with Sidebar */}
          <DashboardWithSidebar defaultTab="overview">
            <motion.div variants={itemVariants} className="flex-1">
              <TabbedContent
                defaultTab="overview"
                tabs={[
                  {
                    id: "overview",
                    label: "Overview",
                    icon: Activity,
                    badge: dashboardData.pendingCount.toString(),
                    content: (
                      <div className="text-center py-8">
                        <p className="text-slate-600 dark:text-slate-400">
                          Quick overview section - Dashboard stats displayed above
                        </p>
                      </div>
                    ),
                  },
                  {
                    id: "balance",
                    label: "Leave Balance",
                    icon: PieChart,
                    badge: dashboardData.totalBalance.toString(),
                    content: (
                      <EmployeeLeaveBalance
                        balanceData={dashboardData.balanceData}
                        isLoading={isLoadingBalance}
                      />
                    ),
                  },
                  {
                    id: "activity",
                    label: "Recent Activity",
                    icon: Activity,
                    badge: dashboardData.recentLeaves.length.toString(),
                    content: (
                      <EmployeeRecentActivity
                        leaves={dashboardData.recentLeaves}
                        isLoading={isLoadingLeaves}
                      />
                    ),
                  },
                ]}
              />
            </motion.div>
          </DashboardWithSidebar>
        </motion.div>
      </RoleBasedDashboard>
    </>
  );
}
