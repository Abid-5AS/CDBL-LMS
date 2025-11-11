"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle2,
  Plus,
  ArrowRight,
  Sparkles,
  BarChart3,
  PieChart,
  Activity,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Avatar,
  AvatarFallback,
  Progress,
} from "@/components/ui";
import { useApiQuery } from "@/lib/apiClient";
import { useLeaveRequests } from "@/hooks";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { leaveTypeLabel } from "@/lib/ui";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { RoleBasedDashboard, RoleKPICard } from "../shared/RoleBasedDashboard";
import {
  ResponsiveDashboardGrid,
  DashboardWithSidebar,
} from "../shared/ResponsiveDashboardGrid";
import { TabbedContent, ExpandableCard } from "../shared/ProgressiveDisclosure";
import useSWR from "swr";
import { apiFetcher } from "@/lib/apiClient";


const LEAVE_BALANCE_KEYS = [
  "EARNED",
  "CASUAL",
  "MEDICAL",
  "EXTRAWITHPAY",
  "EXTRAWITHOUTPAY",
  "MATERNITY",
  "PATERNITY",
  "STUDY",
  "SPECIAL_DISABILITY",
  "QUARANTINE",
] as const;

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

type FloatingAction = {
  label: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  onClick: () => void;
};

function FloatingQuickActions({ actions }: { actions: FloatingAction[] }) {
  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 hidden lg:flex flex-col gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className="group relative h-14 w-14 rounded-2xl border border-border bg-card shadow-lg shadow-black/10 hover:border-primary/40 transition-all"
              aria-label={action.label}
            >
              <span
                className={cn(
                  "flex h-full w-full items-center justify-center rounded-2xl text-base font-semibold",
                  action.accent
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="pointer-events-none absolute right-full mr-3 hidden min-w-[180px] rounded-2xl border border-border bg-card/95 px-3 py-2 text-left text-xs text-muted-foreground shadow-lg group-hover:block">
                <p className="font-semibold text-foreground">{action.label}</p>
                <p>{action.description}</p>
              </div>
            </button>
          );
        })}
      </div>
      <div className="fixed bottom-4 inset-x-0 z-40 flex justify-center lg:hidden px-4">
        <div className="flex items-center gap-2 rounded-full border border-border bg-card/95 backdrop-blur-md px-3 py-2 shadow-lg">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full",
                    action.accent
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

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

  // Process data for modern cards
  const dashboardData = React.useMemo(() => {
    const pendingLeaves =
      leaves?.filter(
        (l) => l.status === "PENDING" || l.status === "SUBMITTED"
      ) || [];
    const returnedLeaves = leaves?.filter((l) => l.status === "RETURNED") || [];
    const approvedLeaves = leaves?.filter((l) => l.status === "APPROVED") || [];

    const normalizedBalanceData = balanceData
      ? Object.entries(balanceData).reduce<Record<string, number>>(
          (acc, [key, value]) => {
            if (
              LEAVE_BALANCE_KEYS.includes(
                key as (typeof LEAVE_BALANCE_KEYS)[number]
              ) &&
              typeof value === "number"
            ) {
              acc[key] = value;
            }
            return acc;
          },
          {}
        )
      : {};

    const totalBalance = Object.values(normalizedBalanceData).reduce(
      (sum, val) => sum + val,
      0
    );
    const usedThisYear =
      leaves
        ?.filter((l) => l.status === "APPROVED")
        .reduce((sum, l) => sum + (l.workingDays || 0), 0) || 0;

    // Process recent leaves with proper formatting
    const recentLeaves =
      leaves?.slice(0, 3).map((leave) => ({
        ...leave,
        typeLabel: leaveTypeLabel[leave.type] || leave.type,
        formattedDates: `${formatDate(leave.startDate)} - ${formatDate(
          leave.endDate
        )}`,
      })) || [];

    // Find next scheduled leave (approved leave with start date in future)
    const now = new Date();
    const upcomingApprovedLeaves = approvedLeaves
      .filter((l) => new Date(l.startDate) > now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    const nextScheduledLeave = upcomingApprovedLeaves[0] || null;
    const daysUntilNextLeave = nextScheduledLeave
      ? Math.ceil((new Date(nextScheduledLeave.startDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Calculate action items for Action Center
    const actionItems: Array<{
      type: "returned" | "certificate" | "cancelable" | "expiring";
      title: string;
      description: string;
      action: string;
      actionLink: string;
      variant: "destructive" | "warning" | "info";
      data?: any;
    }> = [];

    // 1. Returned requests
    returnedLeaves.forEach((leave) => {
      actionItems.push({
        type: "returned",
        title: `${leaveTypeLabel[leave.type] || leave.type} Leave - Returned`,
        description: `${formatDate(leave.startDate)} - ${formatDate(leave.endDate)} (${leave.workingDays} days)`,
        action: "Edit & Resubmit",
        actionLink: `/leaves/${leave.id}/edit`,
        variant: "destructive",
        data: leave,
      });
    });

    // 2. Medical leave requiring certificate (approved medical leave > 3 days without certificate uploaded)
    const medicalLeavesNeedingCert = approvedLeaves.filter(
      (l) => l.type === "MEDICAL" && l.workingDays > 3 && new Date(l.endDate) < now
    );
    medicalLeavesNeedingCert.forEach((leave) => {
      actionItems.push({
        type: "certificate",
        title: "Medical Certificate Required",
        description: `${formatDate(leave.startDate)} - ${formatDate(leave.endDate)} (${leave.workingDays} days)`,
        action: "Upload Certificate",
        actionLink: `/leaves/${leave.id}`,
        variant: "warning",
        data: leave,
      });
    });

    // 3. Upcoming leaves that can be cancelled (within cancellation window)
    const cancelableLeaves = upcomingApprovedLeaves.filter((l) => {
      const daysUntil = Math.ceil((new Date(l.startDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil <= 14 && daysUntil > 0; // Show if within 2 weeks
    }).slice(0, 2); // Limit to 2

    cancelableLeaves.forEach((leave) => {
      const daysUntil = Math.ceil((new Date(leave.startDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      actionItems.push({
        type: "cancelable",
        title: `Upcoming ${leaveTypeLabel[leave.type] || leave.type} Leave`,
        description: `Starts ${daysUntil === 1 ? "tomorrow" : `in ${daysUntil} days`} - ${formatDate(leave.startDate)} (${leave.workingDays} days)`,
        action: "Cancel if needed",
        actionLink: `/leaves?filter=approved`,
        variant: "info",
        data: leave,
      });
    });

    // 4. Casual leave expiring soon (year-end)
    const currentMonth = now.getMonth();
    const isYearEnd = currentMonth >= 10; // November or December
    const casualBalance = normalizedBalanceData.CASUAL || 0;
    if (isYearEnd && casualBalance > 0) {
      actionItems.push({
        type: "expiring",
        title: "Casual Leave Expiring",
        description: `${casualBalance} days will expire on Dec 31`,
        action: "Apply Now",
        actionLink: "/leaves/apply",
        variant: "warning",
      });
    }

    return {
      pendingCount: pendingLeaves.length,
      returnedCount: returnedLeaves.length,
      approvedCount: approvedLeaves.length,
      totalBalance,
      usedThisYear,
      balanceData: normalizedBalanceData,
      recentLeaves,
      pendingLeaves,
      returnedLeaves,
      nextScheduledLeave,
      daysUntilNextLeave,
      actionItems,
    };
  }, [leaves, balanceData]);

  // Header actions
  const headerActions = (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setShowCustomization(true)}
      className="gap-2"
    >
      <Settings className="w-4 h-4" />
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
              subtitle="Awaiting approval"
              icon={Clock}
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
              title={dashboardData.nextScheduledLeave ? "Next Leave" : "No Upcoming Leave"}
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
                  ? `${leaveTypeLabel[dashboardData.nextScheduledLeave.type] || dashboardData.nextScheduledLeave.type} (${dashboardData.nextScheduledLeave.workingDays || 0} days)`
                  : "Plan your next vacation"
              }
              icon={TrendingUp}
              role="EMPLOYEE"
              animate={true}
            />
          </ResponsiveDashboardGrid>

          {/* Action Center - Always show with dynamic content */}
          <motion.div variants={itemVariants}>
            <Card className={cn(
              "bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-white/20 dark:border-slate-700/50 shadow-xl border-l-4",
              dashboardData.actionItems.length > 0
                ? "border-l-primary"
                : "border-l-slate-300 dark:border-l-slate-600"
            )}>
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    <span>Action Center</span>
                  </CardTitle>
                  {dashboardData.actionItems.length > 0 && (
                    <Badge
                      variant="default"
                      className="bg-primary/10 text-primary dark:bg-primary/20 text-xs"
                    >
                      {dashboardData.actionItems.length} {dashboardData.actionItems.length === 1 ? "item" : "items"}
                    </Badge>
                  )}
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                  {dashboardData.actionItems.length > 0
                    ? "Recommended actions and reminders"
                    : "You're all caught up! No pending actions."}
                </p>
              </CardHeader>
              <CardContent>
                {dashboardData.actionItems.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-3" />
                    <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                      All Clear!
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      No action items at this time. Enjoy your day!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dashboardData.actionItems.slice(0, 5).map((item, index) => {
                      const bgColor =
                        item.variant === "destructive"
                          ? "bg-red-50/50 dark:bg-red-900/10 border-red-200/50 dark:border-red-800/30"
                          : item.variant === "warning"
                          ? "bg-amber-50/50 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-800/30"
                          : "bg-blue-50/50 dark:bg-blue-900/10 border-blue-200/50 dark:border-blue-800/30";

                      const buttonColor =
                        item.variant === "destructive"
                          ? "bg-red-600 hover:bg-red-700"
                          : item.variant === "warning"
                          ? "bg-amber-600 hover:bg-amber-700"
                          : "bg-blue-600 hover:bg-blue-700";

                      return (
                        <motion.div
                          key={`${item.type}-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={cn(
                            "flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border gap-3 sm:gap-2",
                            bgColor
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 dark:text-white text-sm">
                              {item.title}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {item.description}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            className={cn("text-white text-xs sm:text-sm h-8 sm:h-9", buttonColor)}
                            onClick={() => router.push(item.actionLink)}
                          >
                            {item.action}
                          </Button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content with Sidebar */}
          <DashboardWithSidebar
            sidebarPosition="right"
            sidebar={
              <motion.div variants={itemVariants} className="space-y-6">
                {/* Team Status */}
                <ExpandableCard
                  title="Team Status"
                  subtitle="Current team availability"
                  icon={Users}
                  expandedContent={
                    <Button
                      variant="ghost"
                      className="w-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                      onClick={() => router.push("/team")}
                    >
                      View All Team Members
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  }
                  className="rounded-2xl border border-border bg-card shadow-sm"
                >
                  <div className="space-y-3">
                    {isLoadingTeam ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="animate-pulse flex items-center space-x-3"
                          >
                            <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : teamData?.members?.length > 0 ? (
                      teamData.members
                        .slice(0, 3)
                        .map((member: any, index: number) => (
                          <motion.div
                            key={member.name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center space-x-3"
                          >
                            <Avatar className="w-8 h-8">
                              <AvatarFallback
                                className={cn(
                                  "text-white text-xs font-semibold",
                                  member.isOnLeave
                                    ? "bg-red-500"
                                    : "bg-green-500"
                                )}
                              >
                                {member.name
                                  ?.split(" ")
                                  .map((n: string) => n[0])
                                  .join("")
                                  .slice(0, 2) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900 dark:text-white text-sm truncate">
                                {member.name}
                              </p>
                              <p
                                className={cn(
                                  "text-xs",
                                  !member.isOnLeave
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                                )}
                              >
                                {member.isOnLeave ? "On Leave" : "Available"}
                              </p>
                            </div>
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full",
                                !member.isOnLeave
                                  ? "bg-green-500"
                                  : "bg-red-500"
                              )}
                            />
                          </motion.div>
                        ))
                    ) : (
                      <div className="text-center py-4">
                        <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          No team data available
                        </p>
                      </div>
                    )}
                  </div>
                </ExpandableCard>

                {/* Upcoming Holidays */}
                <ExpandableCard
                  title="Upcoming Holidays"
                  subtitle="Company holidays and events"
                  icon={Sparkles}
                  className="rounded-2xl border border-border bg-card shadow-sm"
                >
                  <div className="space-y-3">
                    {isLoadingHolidays ? (
                      <div className="space-y-3">
                        {[1, 2].map((i) => (
                          <div
                            key={i}
                            className="animate-pulse p-3 rounded-xl bg-slate-100 dark:bg-slate-700"
                          >
                            <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded mb-2"></div>
                            <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-2/3"></div>
                          </div>
                        ))}
                      </div>
                    ) : holidaysData?.holidays?.length > 0 ? (
                      holidaysData.holidays
                        .slice(0, 2)
                        .map((holiday: any, index: number) => (
                          <motion.div
                            key={holiday.name}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center justify-between rounded-xl border border-border bg-muted/40 dark:bg-slate-900/30 p-3"
                          >
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white text-sm">
                                {holiday.name}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                {formatDate(holiday.date)}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className="text-xs border-indigo-200 text-indigo-700 dark:border-indigo-800 dark:text-indigo-300"
                            >
                              {holiday.daysAway
                                ? `${holiday.daysAway} days away`
                                : "Today"}
                            </Badge>
                          </motion.div>
                        ))
                    ) : (
                      <div className="text-center py-4">
                        <Sparkles className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          No upcoming holidays
                        </p>
                      </div>
                    )}
                  </div>
                </ExpandableCard>
              </motion.div>
            }
          >
            <motion.div variants={itemVariants} className="space-y-6">
              <TabbedContent
                title="Leave Management"
                subtitle="Balance overview and recent activity"
                headerActions={
                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg"
                    onClick={() => router.push("/leaves/apply")}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Apply Leave
                  </Button>
                }
                tabs={[
                  {
                    id: "balance",
                    label: "Balance",
                    icon: PieChart,
                    content: isLoadingBalance ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded"></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <ResponsiveDashboardGrid columns="1:2:2:3" gap="md">
                        {Object.entries(dashboardData.balanceData).map(
                          ([type, balance]) => {
                            const colors = {
                              CASUAL: {
                                bg: "bg-blue-500",
                                text: "text-blue-600",
                                light: "bg-blue-50 dark:bg-blue-900/20",
                              },
                              EARNED: {
                                bg: "bg-emerald-500",
                                text: "text-emerald-600",
                                light: "bg-emerald-50 dark:bg-emerald-900/20",
                              },
                              MEDICAL: {
                                bg: "bg-red-500",
                                text: "text-red-600",
                                light: "bg-red-50 dark:bg-red-900/20",
                              },
                              MATERNITY: {
                                bg: "bg-pink-500",
                                text: "text-pink-600",
                                light: "bg-pink-50 dark:bg-pink-900/20",
                              },
                              PATERNITY: {
                                bg: "bg-purple-500",
                                text: "text-purple-600",
                                light: "bg-purple-50 dark:bg-purple-900/20",
                              },
                            };
                            const color =
                              colors[type as keyof typeof colors] ||
                              colors.CASUAL;
                            const maxBalance = 30;
                            const percentage = Math.min(
                              (balance / maxBalance) * 100,
                              100
                            );

                            return (
                              <div
                                key={type}
                                className={cn(
                                  "p-4 rounded-xl border border-white/20 dark:border-slate-700/50",
                                  color.light
                                )}
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                                    {type.charAt(0) +
                                      type.slice(1).toLowerCase()}{" "}
                                    Leave
                                  </h4>
                                  <span
                                    className={cn(
                                      "text-2xl font-bold",
                                      color.text
                                    )}
                                  >
                                    {balance}
                                  </span>
                                </div>
                                <Progress
                                  value={percentage}
                                  className="h-2 mb-2"
                                />
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                  {balance} days available
                                </p>
                              </div>
                            );
                          }
                        )}
                      </ResponsiveDashboardGrid>
                    ),
                  },
                  {
                    id: "activity",
                    label: "Recent Activity",
                    icon: Activity,
                    badge: dashboardData.recentLeaves.length.toString(),
                    content: isLoadingLeaves ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="animate-pulse flex items-center space-x-4"
                          >
                            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : dashboardData.recentLeaves.length > 0 ? (
                      <div className="space-y-4">
                        {dashboardData.recentLeaves.map((leave, index) => (
                          <motion.div
                            key={leave.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center space-x-4 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-700/30 hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                            onClick={() => router.push(`/leaves/${leave.id}`)}
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {leave.type.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900 dark:text-white truncate">
                                {leave.typeLabel}
                              </p>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {leave.formattedDates} ({leave.workingDays}{" "}
                                days)
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <StatusBadge status={leave.status} />
                              <ArrowRight className="w-4 h-4 text-slate-400" />
                            </div>
                          </motion.div>
                        ))}
                        <Button
                          variant="ghost"
                          className="w-full mt-4 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                          onClick={() => router.push("/leaves")}
                        >
                          View All Leave Requests
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-600 dark:text-slate-400">
                          No recent activity
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                          Your leave requests will appear here
                        </p>
                      </div>
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
