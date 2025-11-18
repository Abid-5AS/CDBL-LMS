"use client";

import * as React from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  TrendingUp,
  PieChart,
  Activity,
  Plus,
  Info,
  AlertCircle,
  ClipboardList,
  BookOpen,
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
import { KPIGridSkeleton } from "@/components/shared/skeletons";
import { useMounted } from "@/hooks/use-mounted";
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

export function ModernEmployeeDashboard({
  username,
}: EmployeeDashboardContentProps) {
  const router = useRouter();
  const [activeLeaveTab, setActiveLeaveTab] = useState<string>("overview");
  const mounted = useMounted();

  const infoButtonClasses =
    "inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60";

  // Scroll to specific section and optionally switch tabs
  const scrollToSection = (sectionId: string, tabId?: string) => {
    if (tabId) {
      setActiveLeaveTab(tabId);
    }
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        const offset = 100; // Account for fixed header
        const elementPosition =
          element.getBoundingClientRect().top + window.scrollY;
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
      label: "Review My Leaves",
      description: "Jump to status & history",
      icon: ClipboardList,
      accent: "bg-blue-600 text-white",
      onClick: () => router.push("/leaves"),
    },
    {
      label: "Check Balance & Policies",
      description: "View balances and rules",
      icon: BookOpen,
      accent: "bg-emerald-600 text-white",
      onClick: () => router.push("/balance"),
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
          className="space-y-4 lg:space-y-5"
        >
          <motion.section variants={itemVariants}>
            <div className="surface-card p-4 sm:p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
                    {username}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {mounted
                      ? new Date().toLocaleDateString("en-GB", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "..."}
                  </p>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
                  onClick={() => router.push("/leaves/apply")}
                >
                  Apply for Leave
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
                      dashboardData.nextScheduledLeave.type}{" "}
                    · {dashboardData.nextScheduledLeave.workingDays} days
                  </p>
                </div>
              )}
            </div>
          </motion.section>

          <motion.section variants={itemVariants}>
            <div className="sticky top-4 z-20 hidden md:block">
              <div className="surface-card flex flex-wrap items-center justify-between gap-3 border border-border/70 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                  Quick Navigation
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full border border-border/70"
                    onClick={() => scrollToSection("action-center")}
                  >
                    Action Center
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full border border-border/70"
                    onClick={() => scrollToSection("leave-details", "balance")}
                  >
                    Leave Details
                  </Button>
                </div>
              </div>
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
              columns="2:2:3:3"
              gap="md"
              animate={true}
              staggerChildren={0.1}
              delayChildren={0.2}
            >
              <RoleKPICard
                title={
                  <div className="flex items-center gap-2">
                    <span>Needs Your Action</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label="Learn about requests that need your input"
                          className={infoButtonClasses}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <AlertCircle className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p className="text-sm font-semibold mb-1">
                          What this shows:
                        </p>
                        <p className="text-sm mb-2">
                          Requests returned to you that must be edited or
                          confirmed before they can re-enter the approval
                          chain.
                        </p>
                        <p className="text-sm font-semibold mb-1">
                          Current stage:
                        </p>
                        <p className="text-sm mb-2">
                          Tap to jump directly to the Action Center where you
                          can edit, resubmit, or cancel these requests.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Once all items are handled this number resets to 0.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                }
                value={dashboardData.needsAttentionCount}
                subtitle={
                  dashboardData.needsAttentionCount > 0
                    ? "Returned or cancelled items"
                    : "No actions required"
                }
                icon={AlertCircle}
                role="EMPLOYEE"
                animate={true}
                onClick={() => scrollToSection("action-center")}
                clickLabel="Jump to Action Center"
              />

              <RoleKPICard
                title={
                  <div className="flex items-center gap-2">
                    <span>Under Review</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label="Information about under review requests"
                          className={infoButtonClasses}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Info className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p className="text-sm font-semibold mb-1">
                          What this shows:
                        </p>
                        <p className="text-sm mb-2">
                          Requests currently moving through approvers. Nothing
                          is required from you unless someone returns it.
                        </p>
                        <p className="text-sm font-semibold mb-1">
                          How it's calculated:
                        </p>
                        <p className="text-sm mb-2">
                          Includes submitted, pending, recalled, and
                          cancellation requests forwarded to managers/HR. The
                          subtitle highlights who currently has the request
                          plus the average wait.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Explore approvals in My Leaves for a full audit
                          trail.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                }
                value={dashboardData.underReviewCount}
                subtitle={
                  dashboardData.pendingStageInfo
                    ? `With ${dashboardData.pendingStageInfo.role} • ${dashboardData.pendingAverageWait}d avg wait`
                    : "Awaiting approval"
                }
                icon={Clock}
                role="EMPLOYEE"
                animate={true}
                onClick={() => router.push("/leaves?status=pending")}
                clickLabel="View requests awaiting approval"
              />

              <RoleKPICard
                title={
                  <div className="flex items-center gap-2">
                    <span>Total Balance</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label="Information about total leave balance"
                          className={infoButtonClasses}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Info className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p className="text-sm font-semibold mb-1">
                          What this shows:
                        </p>
                        <p className="text-sm mb-2">
                          Total leave days available to you across Earned,
                          Casual, and Medical leave.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Tap to open the Leave Balance tab for breakdown and
                          expiry notes.
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
                onClick={() => scrollToSection("leave-details", "balance")}
                clickLabel="View detailed balance breakdown"
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
                          type="button"
                          aria-label="Information about next approved leave"
                          className={infoButtonClasses}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p className="text-sm font-semibold mb-1">
                          What this shows:
                        </p>
                        <p className="text-sm mb-2">
                          Your next scheduled leave that has been fully approved
                          and is confirmed. Shows how many days until it starts.
                        </p>
                        <p className="text-sm font-semibold mb-1">
                          Important distinction:
                        </p>
                        <p className="text-sm mb-2">
                          This shows APPROVED leaves only - not pending
                          requests. Pending requests appear in "Pending
                          Requests" card above.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          You can request cancellation of approved leaves from
                          the Action Center.
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
            title="Action Center"
            description="Handle returned requests, certificate tasks, and expiring balances"
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
                        badge: dashboardData.needsAttentionCount.toString(),
                        content: (
                          <div className="flex flex-col items-center justify-center gap-2 py-6 sm:py-8">
                            {dashboardData.needsAttentionCount === 0 ? (
                              <>
                                <p className="text-base font-medium">
                                  You&apos;re all caught up on leave actions.
                                </p>
                                <p className="text-sm text-muted-foreground text-center">
                                  Explore your balance or recent history using the tabs.
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-base font-medium text-center">
                                  {dashboardData.needsAttentionCount} request
                                  {dashboardData.needsAttentionCount === 1 ? " needs" : "s need"} your input.
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => scrollToSection("action-center")}
                                >
                                  Review in Action Center
                                </Button>
                              </>
                            )}
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
