"use client";

import * as React from "react";
import { useState } from "react";
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
  CalendarPlus,
  Info,
} from "lucide-react";

import {
  Button,
  Card,
  CardContent,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui";
import { useApiQuery } from "@/lib/apiClient";
import { useLeaveRequests } from "@/hooks";
import { leaveTypeLabel } from "@/lib/ui";
import { formatDate } from "@/lib/utils";
import { RoleBasedDashboard, RoleKPICard } from "../shared/RoleBasedDashboard";
import {
  ResponsiveDashboardGrid,
  DashboardWithSidebar,
  DashboardSection,
} from "../shared/ResponsiveDashboardGrid";
import { TabbedContent } from "../shared/ProgressiveDisclosure";
import useSWR from "swr";
import { apiFetcher } from "@/lib/apiClient";

// Extracted components
import { EmployeeActionCenter } from "./components/EmployeeActionCenter";
import { EmployeeRecentActivity } from "./components/EmployeeRecentActivity";
import { EmployeeLeaveBalance } from "./components/EmployeeLeaveBalance";
import { FloatingQuickActions } from "./components/FloatingQuickActions";
import { ConversionSummaryCard } from "@/components/leaves/ConversionHistory";

// Extracted hooks and utils
import { useEmployeeDashboardData } from "./hooks/useEmployeeDashboardData";
import { WhosOutToday } from "@/app/dashboard/shared/WhosOutToday";

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
    },
  },
};

/**
 * Enhanced skeleton loader for KPI cards with shimmer effect
 */
function KPICardSkeleton() {
  return (
    <div className="neo-card relative flex h-full min-h-[190px] flex-col px-5 py-5 sm:px-6 sm:py-6 overflow-hidden animate-fade-in">
      <div className="absolute inset-0 shimmer-effect" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-12 w-12 rounded-2xl" />
      </div>
    </div>
  );
}

/**
 * Grid of skeleton loaders for KPI section with staggered animation
 */
function KPIGridSkeleton() {
  return (
    <ResponsiveDashboardGrid columns="2:2:4:4" gap="md" animate={false}>
      {[...Array(4)].map((_, i) => (
        <div key={i} style={{ animationDelay: `${i * 100}ms` }}>
          <KPICardSkeleton />
        </div>
      ))}
    </ResponsiveDashboardGrid>
  );
}

export function ModernEmployeeDashboard({
  username,
}: EmployeeDashboardContentProps) {
  const router = useRouter();
  const [activeLeaveTab, setActiveLeaveTab] = useState<string>("overview");

  // Scroll to specific section and optionally switch tabs
  const scrollToSection = (sectionId: string, tabId?: string) => {
    if (tabId) {
      setActiveLeaveTab(tabId);
    }
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        const offset = 100; // Account for fixed header
        const elementPosition = element.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: elementPosition - offset,
          behavior: "smooth",
        });
      }
    }, 100);
  };
  const { allRows: leaves, isLoading: isLoadingLeaves } = useLeaveRequests({
    enableSelection: false,
  });
  const { data: balanceData, isLoading: isLoadingBalance } =
    useApiQuery<Record<string, number>>("/api/balance/mine");

  // Fetch team data - remove unused API call
  // const { data: teamData, isLoading: isLoadingTeam } = useSWR(
  //   "/api/team/status",
  //   apiFetcher
  // );

  // Fetch holidays data
  const { data: holidaysData, isLoading: isLoadingHolidays } = useSWR(
    "/api/holidays?upcoming=true",
    apiFetcher
  );

  // Process data using custom hook
  const dashboardData = useEmployeeDashboardData(leaves, balanceData);

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
    <TooltipProvider>
      <FloatingQuickActions actions={quickActions} />
      <RoleBasedDashboard
        role="EMPLOYEE"
        animate={true}
        backgroundVariant="transparent"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6 lg:space-y-8"
        >
          <motion.section variants={itemVariants}>
            <div className="surface-card p-4 sm:p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
                    {username}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
                  onClick={() => router.push("/leaves/apply")}
                >
                  Apply Leave
                </Button>
              </div>
              {dashboardData.nextScheduledLeave && (
                <div className="rounded-xl border border-border/60 px-4 py-3 bg-muted/30">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                    Next Approved Leave
                  </p>
                  <p className="text-base font-semibold text-foreground">
                    {formatDate(dashboardData.nextScheduledLeave.startDate)} →{" "}
                    {formatDate(dashboardData.nextScheduledLeave.endDate)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {leaveTypeLabel[dashboardData.nextScheduledLeave.type] ||
                      dashboardData.nextScheduledLeave.type} ·{" "}
                    {dashboardData.nextScheduledLeave.workingDays} days
                  </p>
                </div>
              )}
            </div>
          </motion.section>

          {/* Quick Stats Grid */}
          <DashboardSection
            title="Leave Metrics"
            description="Your balance, pending requests, and upcoming time off"
            isLoading={false}
            loadingFallback={<KPIGridSkeleton />}
            animate={true}
          >
            <ResponsiveDashboardGrid
              columns="2:2:4:4"
              gap="md"
              animate={true}
              staggerChildren={0.1}
              delayChildren={0.2}
            >
              <RoleKPICard
                title={
                  <div className="flex items-center gap-2">
                    <span>Pending Requests</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          aria-label="Information about pending requests"
                          className="hover:opacity-70 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p className="text-sm font-semibold mb-1">What this shows:</p>
                        <p className="text-sm mb-2">
                          Your leave requests currently going through the approval process.
                        </p>
                        <p className="text-sm font-semibold mb-1">Current stage:</p>
                        <p className="text-sm mb-2">
                          The subtitle shows which approver (Department Head, HR Admin, HR Head, or CEO) is currently reviewing your request and the average wait time.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          You can cancel pending requests anytime from the Action Center below.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                }
                value={dashboardData.pendingCount}
                subtitle={
                  dashboardData.pendingStageInfo
                    ? `With ${dashboardData.pendingStageInfo.role} • ${dashboardData.pendingAverageWait}d avg wait`
                    : "Awaiting approval"
                }
                icon={dashboardData.pendingStageInfo?.icon || Clock}
                role="EMPLOYEE"
                animate={true}
                onClick={() => router.push("/leaves?status=pending")}
                clickLabel="View your pending leave requests"
              />

              <RoleKPICard
                title={
                  <div className="flex items-center gap-2">
                    <span>Total Balance</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          aria-label="Information about total leave balance"
                          className="hover:opacity-70 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p className="text-sm font-semibold mb-1">What this shows:</p>
                        <p className="text-sm mb-2">
                          Total leave days available to you across all leave types (Earned, Casual, Medical).
                        </p>
                        <p className="text-sm font-semibold mb-1">How it's calculated:</p>
                        <p className="text-sm mb-2">
                          Sum of remaining days in each leave category. This includes carried-over balance and annual allocation minus any used or pending days.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          View detailed breakdown in the "Leave Balance" tab below.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                }
                value={dashboardData.totalBalance}
                subtitle="Days available"
                icon={Calendar}
                role="EMPLOYEE"
                animate={true}
                onClick={() => router.push("/balance")}
                clickLabel="View detailed balance breakdown"
              />

              <RoleKPICard
                title={
                  <div className="flex items-center gap-2">
                    <span>Days Used</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          aria-label="Information about days used"
                          className="hover:opacity-70 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p className="text-sm font-semibold mb-1">What this shows:</p>
                        <p className="text-sm mb-2">
                          Total number of leave days you've taken this calendar year across all leave types.
                        </p>
                        <p className="text-sm font-semibold mb-1">Includes:</p>
                        <p className="text-sm mb-2">
                          Only approved leaves that have been taken. Pending requests and future approved leaves are not counted until they occur.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Check "Recent Activity" tab to see breakdown by leave type.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                }
                value={dashboardData.usedThisYear}
                subtitle="This year"
                icon={BarChart3}
                role="EMPLOYEE"
                animate={true}
                onClick={() => scrollToSection("leave-details", "activity")}
                clickLabel="View leave usage history in Leave Details"
              />

              <RoleKPICard
                title={
                  <div className="flex items-center gap-2">
                    <span>
                      {dashboardData.nextScheduledLeave
                        ? "Next Approved Leave"
                        : "No Approved Leave"}
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          aria-label="Information about next approved leave"
                          className="hover:opacity-70 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p className="text-sm font-semibold mb-1">What this shows:</p>
                        <p className="text-sm mb-2">
                          Your next scheduled leave that has been fully approved and is confirmed. Shows how many days until it starts.
                        </p>
                        <p className="text-sm font-semibold mb-1">Important distinction:</p>
                        <p className="text-sm mb-2">
                          This shows APPROVED leaves only - not pending requests. Pending requests appear in "Pending Requests" card above.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          You can request cancellation of approved leaves from the Action Center.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
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
                    : "Plan your time off"
                }
                icon={TrendingUp}
                role="EMPLOYEE"
                animate={true}
                onClick={() => router.push("/leaves")}
                clickLabel="View all your leave requests"
              />
            </ResponsiveDashboardGrid>
          </DashboardSection>

          {/* Action Center */}
          <DashboardSection
            title="Recent Actions"
            description="Items requiring your attention"
            isLoading={isLoadingLeaves}
            animate={true}
          >
            <div id="action-center">
              <motion.div variants={itemVariants}>
                <EmployeeActionCenter actionItems={dashboardData.actionItems} />
              </motion.div>
            </div>
          </DashboardSection>

          {/* Conversion Summary Card */}
          <motion.div variants={itemVariants}>
            <ConversionSummaryCard year={new Date().getFullYear()} />
          </motion.div>

          {/* Who's Out Today Widget */}
          <motion.div variants={itemVariants}>
            <WhosOutToday scope="team" />
          </motion.div>

          {/* Dashboard with Sidebar */}
          <DashboardSection
            title="Leave Details"
            description="Balance breakdown, recent activity, and trends"
            isLoading={isLoadingLeaves || isLoadingBalance}
            animate={true}
          >
            <div id="leave-details">
              <DashboardWithSidebar>
              <motion.div variants={itemVariants} className="flex-1">
                <TabbedContent
                  title="Leave Details"
                  defaultTab="overview"
                  value={activeLeaveTab}
                  onValueChange={setActiveLeaveTab}
                  tabs={[
                    {
                      id: "overview",
                      label: "Overview",
                      icon: Activity,
                      badge: dashboardData.pendingCount.toString(),
                      content: (
                        <div className="flex flex-col items-center justify-center gap-2 py-6 sm:py-8">
                          <p className="text-base font-medium">
                            You&apos;re all caught up on leave details.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Use the Leave Balance and Recent Activity tabs to
                            explore your data.
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
            </div>
          </DashboardSection>
        </motion.div>
      </RoleBasedDashboard>
    </TooltipProvider>
  );
}
