"use client";

import * as React from "react";
import { useState, Suspense } from "react";
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
  User,
} from "lucide-react";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
  Badge,
} from "@/components/ui";
import { useApiQuery } from "@/lib/apiClient";
import { useLeaveRequests } from "@/hooks";
import { leaveTypeLabel } from "@/lib";
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
import { Role } from "@/lib/enums";

// Extracted components
import { EmployeeActionCenter } from "./components/EmployeeActionCenter";
import { EmployeeRecentActivity } from "./components/EmployeeRecentActivity";
import { EmployeeLeaveBalance } from "./components/EmployeeLeaveBalance";
import { FloatingQuickActions } from "./components/FloatingQuickActions";
import { ConversionSummaryCard } from "@/components/leaves/ConversionHistory";
import { BalanceProjectionWidget } from "./components/BalanceProjectionWidget";

// Extracted hooks and utils
import { KPIGridSkeleton } from "@/components/shared/skeletons";
import { useMounted } from "@/hooks/useMounted";
import { useEmployeeDashboardData } from "./hooks/useEmployeeDashboardData";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ResourcesTile } from "./components/ResourcesTile";

type EmployeeDashboardContentProps = {
  username: string;
  whosOutTodaySlot: React.ReactNode;
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
  whosOutTodaySlot,
}: EmployeeDashboardContentProps) {
  const router = useRouter();
  const [activeLeaveTab, setActiveLeaveTab] = useState<string>("overview");
  const [scrollTimeoutId, setScrollTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const mounted = useMounted();

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (scrollTimeoutId) {
        clearTimeout(scrollTimeoutId);
      }
    };
  }, [scrollTimeoutId]);

  const infoButtonClasses =
    "inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60";

  // Scroll to specific section and optionally switch tabs
  const scrollToSection = (sectionId: string, tabId?: string) => {
    if (tabId) {
      setActiveLeaveTab(tabId);
    }
    // Clear any existing timeout to prevent conflicts
    if (scrollTimeoutId) {
      clearTimeout(scrollTimeoutId);
    }

    const timer = setTimeout(() => {
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
      // Clear the timeout ID after execution
      setScrollTimeoutId(null);
    }, 100);

    // Store the timeout ID so we can clear it if needed
    setScrollTimeoutId(timer);
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
      accent: "bg-gradient-to-br from-cyan-500 to-blue-500 text-white",
      onClick: () => router.push("/leaves"),
    },
    {
      label: "Check Balance & Policies",
      description: "View balances and rules",
      icon: BookOpen,
      accent: "bg-gradient-to-br from-emerald-500 to-teal-500 text-white",
      onClick: () => router.push("/balance"),
    },
  ];

  return (
    <TooltipProvider>
      <RoleBasedDashboard
        role={Role.EMPLOYEE}
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
            <div className="surface-card p-4 sm:p-5 rounded-2xl border bg-card/50 backdrop-blur-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Welcome & Date */}
                <div className="space-y-1">
                  <h1 className="text-xl font-semibold text-foreground tracking-tight">
                    Welcome back, {username.split(' ')[0]}
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>
                      {mounted
                        ? new Date().toLocaleDateString("en-GB", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })
                        : "..."}
                    </span>
                    {/* Next Leave Inline */}
                    {dashboardData.nextScheduledLeave && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-border" />
                        <div className="flex items-center gap-1.5 text-foreground/80 font-medium bg-muted/30 px-2 py-0.5 rounded-md">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs">
                            Next: {formatDate(dashboardData.nextScheduledLeave.startDate)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-start lg:self-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden sm:flex"
                    onClick={() => scrollToSection("action-center")}
                  >
                    Action Center
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
                    onClick={() => router.push("/leaves/apply")}
                  >
                    Apply Leave
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
              columns="1:2:4:4"
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
                role={Role.EMPLOYEE}
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
                role={Role.EMPLOYEE}
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
                role={Role.EMPLOYEE}
                animate={true}
                onClick={() => setIsBalanceModalOpen(true)}
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
                    ? `${leaveTypeLabel[dashboardData.nextScheduledLeave.type] ||
                    dashboardData.nextScheduledLeave.type
                    } (${dashboardData.nextScheduledLeave.workingDays || 0
                    } days)`
                    : "Plan your time off"
                }
                icon={TrendingUp}
                role={Role.EMPLOYEE}
                animate={true}
                onClick={() => router.push("/leaves")}
                clickLabel="View all your leave requests"
              />
            </ResponsiveDashboardGrid>
          </DashboardSection>

          {/* Main Grid Layout (70/30 Split) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

            {/* Left Column (Main Content) - Spans 8 cols */}
            <div className="lg:col-span-8 space-y-6 lg:space-y-8">

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

              {/* Recent Activity (Table) */}
              <DashboardSection
                title="Recent Activity"
                description="Your latest leave requests and their status"
                isLoading={isLoadingLeaves}
                animate={true}
              >
                <motion.div variants={itemVariants}>
                  <EmployeeRecentActivity
                    leaves={dashboardData.recentLeaves}
                    isLoading={isLoadingLeaves}
                  />
                </motion.div>
              </DashboardSection>

            </div>

            {/* Right Column (Sidebar) - Spans 4 cols */}
            <div className="lg:col-span-4 space-y-6 lg:space-y-8 sticky top-4 self-start">

              {/* Who's Out Today */}
              <motion.div variants={itemVariants}>
                {whosOutTodaySlot}
              </motion.div>

              {/* Quick Resources / Utility Tile */}
              <motion.div variants={itemVariants}>
                <ResourcesTile />
              </motion.div>

            </div>
          </div>

          {/* Balance Details Modal */}
          <Dialog open={isBalanceModalOpen} onOpenChange={setIsBalanceModalOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Leave Balance Details</DialogTitle>
                <DialogDescription>
                  Breakdown of your available leave credits and history
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <EmployeeLeaveBalance
                  balanceData={dashboardData.balanceData}
                  isLoading={isLoadingBalance}
                />
                <div className="mt-8">
                  <BalanceProjectionWidget />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>
      </RoleBasedDashboard>
    </TooltipProvider>
  );
}
