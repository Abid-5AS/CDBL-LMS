"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  differenceInDays,
  format,
  isFuture,
  parseISO,
} from "date-fns";
import type { EmployeeDashboardData, LeaveHistoryEntry } from "@/lib/employee";
import type { AppRole } from "@/lib/rbac";
import { canEditEmployee } from "@/lib/rbac";
import {
  Button,
  Badge,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  LeaveHistoryTable,
  LeaveBalancePanel,
  SharedTimeline,
  EmptyState,
} from "@/components/shared";
import type { Balance, BalanceType } from "@/components/shared/LeaveBalancePanel";
import {
  Pencil,
  Ban,
  Calendar,
  Clock,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Users,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  MessageCircle,
  ShieldCheck,
  Layers,
  BarChart3,
} from "lucide-react";
import {
  ChartContainer,
  TrendChart,
  TypePie,
} from "@/components/shared/LeaveCharts";
import { cn, formatDate } from "@/lib/utils";
import {
  SortedTimelineAdapter,
} from "@/components/shared/timeline-adapters";

type EmployeeManagementProfileProps = {
  employee: EmployeeDashboardData;
  viewerRole: AppRole;
};

const getRoleBadgeVariant = (role: AppRole) => {
  switch (role) {
    case "CEO":
      return "bg-card-summary/10 text-card-summary border-card-summary/20";
    case "HR_HEAD":
      return "bg-data-info/10 text-data-info border-data-info/20";
    case "HR_ADMIN":
      return "bg-data-info/10 text-data-info border-data-info/20";
    case "DEPT_HEAD":
      return "bg-data-success/10 text-data-success border-data-success/20";
    case "EMPLOYEE":
      return "bg-bg-secondary text-text-secondary border-border-strong";
  }
};

const roleLabel = (role: string) => {
  switch (role) {
    case "DEPT_HEAD":
      return "Manager";
    case "HR_ADMIN":
      return "HR Admin";
    case "HR_HEAD":
      return "HR Head";
    case "CEO":
      return "CEO";
    default:
      return "Employee";
  }
};

const BALANCE_TYPE_MAP: Record<LeaveHistoryEntry["type"], BalanceType> = {
  Casual: "CASUAL",
  Sick: "MEDICAL",
  Earned: "EARNED",
};

const HISTORY_FILTERS = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING", statuses: ["PENDING", "SUBMITTED"] },
  { label: "Approved", value: "APPROVED", statuses: ["APPROVED"] },
  { label: "Denied", value: "DENIED", statuses: ["REJECTED", "RETURNED"] },
] as const;

type HistoryFilter = (typeof HISTORY_FILTERS)[number]["value"];

export function EmployeeManagementProfile({
  employee,
  viewerRole,
}: EmployeeManagementProfileProps) {
  const router = useRouter();
  const canEdit = canEditEmployee(viewerRole, employee.role as AppRole);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("ALL");
  const [historyView, setHistoryView] = useState<"timeline" | "table">("timeline");

  const normalizedHistory = useMemo(
    () =>
      employee.history.map((leave) => ({
        id: leave.id,
        type: leave.type,
        startDate: leave.start,
        endDate: leave.end,
        workingDays: leave.days,
        status: leave.status,
        updatedAt: leave.end,
      })),
    [employee.history]
  );

  const filteredHistory = useMemo(() => {
    if (historyFilter === "ALL") {
      return employee.history;
    }
    const filterConfig = HISTORY_FILTERS.find((f) => f.value === historyFilter);
    if (!filterConfig?.statuses) return employee.history;
    return employee.history.filter((entry) =>
      filterConfig.statuses?.includes(entry.status)
    );
  }, [employee.history, historyFilter]);

  const filteredTimelineItems = useMemo(() => {
    const subset =
      historyFilter === "ALL"
        ? normalizedHistory
        : normalizedHistory.filter((entry) => {
            const config = HISTORY_FILTERS.find((f) => f.value === historyFilter);
            if (!config?.statuses) return true;
            return config.statuses.includes(entry.status);
          });
    return SortedTimelineAdapter(subset);
  }, [historyFilter, normalizedHistory]);

  const upcomingLeaves = useMemo(() => {
    const now = new Date();
    return normalizedHistory
      .filter((leave) => isFuture(new Date(leave.startDate)))
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      )
      .slice(0, 3);
  }, [normalizedHistory]);

  const nextLeave = upcomingLeaves[0];

  const totalRemaining = useMemo(
    () =>
      employee.balances.reduce(
        (sum, balance) => sum + (balance.remaining ?? 0),
        0
      ),
    [employee.balances]
  );
  const totalUsed = useMemo(
    () => employee.balances.reduce((sum, balance) => sum + (balance.used ?? 0), 0),
    [employee.balances]
  );
  const balancePanelData = useMemo<Balance[]>(
    () =>
      employee.balances.map((balance) => {
        const type = BALANCE_TYPE_MAP[balance.type] ?? "CASUAL";
        const total =
          balance.total ?? (balance.used ?? 0) + (balance.remaining ?? 0);
        return {
          type,
          used: balance.used ?? 0,
          total,
          projected: balance.remaining ?? undefined,
        } satisfies Balance;
      }),
    [employee.balances]
  );

  const joinDate = employee.joiningDate ? parseISO(employee.joiningDate) : null;
  const daysSinceJoin = joinDate
    ? differenceInDays(new Date(), joinDate)
    : null;

  const quickMetrics = [
    {
      label: "Days since join",
      value: daysSinceJoin ? `${daysSinceJoin} days` : "—",
      helper: joinDate ? format(joinDate, "MMM d, yyyy") : "Joining date unavailable",
      icon: Calendar,
    },
    {
      label: "Leave balance",
      value: `${totalRemaining} days`,
      helper: `${totalUsed} days used`,
      icon: Clock,
    },
    {
      label: "Next leave",
      value: nextLeave
        ? `${format(parseISO(nextLeave.startDate), "MMM d")} → ${format(
            parseISO(nextLeave.endDate),
            "MMM d"
          )}`
        : "No leave scheduled",
      helper: nextLeave ? `${nextLeave.type} • ${nextLeave.workingDays} days` : "Stay ready",
      icon: Calendar,
    },
  ];

  const recentActions = useMemo(() => {
    return [...employee.history]
      .sort(
        (a, b) => new Date(b.start).getTime() - new Date(a.start).getTime()
      )
      .slice(0, 3);
  }, [employee.history]);

  const complianceAlerts = useMemo(() => {
    const alerts: Array<{ title: string; detail: string; tone: "warning" | "info" | "error" }> = [];
    if (employee.stats.pendingRequests > 0) {
      alerts.push({
        title: "Pending approvals",
        detail: `${employee.stats.pendingRequests} request(s) awaiting action`,
        tone: "warning",
      });
    }
    if (employee.stats.encashmentPending > 0) {
      alerts.push({
        title: "Encashment pending",
        detail: "Employee has open encashment tasks",
        tone: "info",
      });
    }
    if (alerts.length === 0) {
      alerts.push({
        title: "All clear",
        detail: "No compliance actions required",
        tone: "info",
      });
    }
    return alerts;
  }, [employee.stats]);

  const trendData = employee.monthlyTrend.map((point) => ({
    month: point.month,
    leaves: point.leavesTaken,
  }));

  const trendDelta = (() => {
    const last = trendData.at(-1)?.leaves ?? 0;
    const prev = trendData.at(-2)?.leaves ?? 0;
    if (prev === 0) return 0;
    return Number((((last - prev) / prev) * 100).toFixed(1));
  })();

  return (
    <div className="space-y-6">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/employees">Employee Directory</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{employee.name}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>

      {/* Overview */}
      <section className="surface-card p-6 space-y-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex flex-1 items-center gap-4">
            <Avatar className="h-16 w-16 bg-muted">
              <AvatarFallback className="text-lg font-semibold">
                {employee.name
                  .split(" ")
                  .map((part) => part.charAt(0))
                  .slice(0, 2)
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-semibold text-foreground">
                  {employee.name}
                </h1>
                <Badge className={getRoleBadgeVariant(employee.role as AppRole)}>
                  {roleLabel(employee.role)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{employee.email}</p>
              <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {employee.employmentStatus ?? "Active"}
                </span>
                {employee.department && (
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {employee.department}
                  </span>
                )}
              </div>
            </div>
          </div>
          {canEdit && (
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/employees/${employee.id}?edit=true`)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit profile
              </Button>
              <Button variant="outline" size="sm" disabled>
                <Ban className="mr-2 h-4 w-4" />
                Deactivate
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {quickMetrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl border border-border/60 bg-background/60 p-4"
            >
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <metric.icon className="h-4 w-4" />
                {metric.label}
              </div>
              <p className="mt-2 text-xl font-semibold text-foreground">
                {metric.value}
              </p>
              <p className="text-sm text-muted-foreground">{metric.helper}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Profile & Org cards */}
          <section className="grid gap-6 md:grid-cols-2">
            <div className="surface-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Profile & Contact</h2>
                  <p className="text-sm text-muted-foreground">
                    Essentials for the employee record
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm text-primary"
                  onClick={() => router.push(`/employees/${employee.id}?edit=true#profile`)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </div>
              <div className="space-y-3 text-sm">
                <InfoRow icon={Mail} label="Email" value={employee.email} accent />
                <InfoRow icon={Phone} label="Phone" value="Not provided" />
                <InfoRow icon={MapPin} label="Location" value="Not provided" />
                <InfoRow
                  icon={Calendar}
                  label="Joined"
                  value={
                    joinDate ? formatDate(employee.joiningDate!) : "Not specified"
                  }
                />
              </div>
            </div>
            <div className="surface-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Org Context</h2>
                  <p className="text-sm text-muted-foreground">
                    Reporting, status, and org placement
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm text-primary"
                  disabled={!employee.managerEmail}
                  title={
                    employee.managerEmail
                      ? `Email ${employee.manager ?? "manager"}`
                      : "Manager contact not available"
                  }
                  onClick={() => {
                    if (!employee.managerEmail) return;
                    const subject = encodeURIComponent(
                      `Quick check-in about ${employee.name}'s availability`
                    );
                    const body = encodeURIComponent(
                      "Hi,\n\nCan we align on coverage for the upcoming leave window?\n\nThanks,"
                    );
                    window.location.href = `mailto:${employee.managerEmail}?subject=${subject}&body=${body}`;
                  }}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Message manager
                </Button>
              </div>
              <div className="space-y-3 text-sm">
                <InfoRow
                  icon={Briefcase}
                  label="Department"
                  value={employee.department ?? "—"}
                />
                <InfoRow
                  icon={Users}
                  label="Manager"
                  value={employee.manager ?? "Unassigned"}
                />
                <InfoRow
                  icon={ShieldCheck}
                  label="Role"
                  value={roleLabel(employee.role)}
                />
                <InfoRow
                  icon={Layers}
                  label="Employment Status"
                  value={employee.employmentStatus ?? "Active"}
                />
              </div>
            </div>
          </section>

          {/* Leave Stats */}
          <section className="surface-card p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Leave Statistics</h2>
                <p className="text-sm text-muted-foreground">
                  Operational KPIs with month-over-month context
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <MetricTile
                label="Employees on leave"
                value={employee.stats.employeesOnLeave}
                trend={trendDelta}
                icon={Users}
                sparkline={trendData}
              />
              <MetricTile
                label="Pending requests"
                value={employee.stats.pendingRequests}
                trend={employee.stats.pendingRequests > 0 ? 12 : -8}
                icon={Clock}
                tone="warning"
              />
              <MetricTile
                label="Avg approval time"
                value={`${employee.stats.avgApprovalTime ?? 0} days`}
                trend={-4}
                icon={TrendingDown}
                tone="success"
              />
              <MetricTile
                label="Total leave days (YTD)"
                value={employee.stats.totalLeavesThisYear}
                trend={5}
                icon={BarChart3}
                sparkline={trendData}
              />
            </div>
          </section>

          {/* Balance + Breakdown */}
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="surface-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Leave Balance Snapshot</h2>
                  <p className="text-sm text-muted-foreground">
                    Allocation vs. usage per leave type
                  </p>
                </div>
              </div>
              <LeaveBalancePanel
                balances={balancePanelData}
                variant="compact"
                showMeters
              />
            </div>
            <div className="surface-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Leave Breakdown</h2>
                  <p className="text-sm text-muted-foreground">
                    Usage split by leave category
                  </p>
                </div>
              </div>
              <ChartContainer className="h-[240px]">
                <TypePie data={employee.distribution.map((slice) => ({
                  type: slice.type as any,
                  value: slice.value,
                }))} />
              </ChartContainer>
            </div>
          </section>

          {/* Leave History */}
          <section className="surface-card p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Leave History</h2>
                <p className="text-sm text-muted-foreground">
                  Timeline and detail of recent requests
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={historyView === "timeline" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHistoryView("timeline")}
                >
                  Timeline
                </Button>
                <Button
                  variant={historyView === "table" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHistoryView("table")}
                >
                  Table
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {HISTORY_FILTERS.map((filter) => (
                <Button
                  key={filter.value}
                  variant={
                    filter.value === historyFilter ? "default" : "secondary"
                  }
                  size="sm"
                  onClick={() => setHistoryFilter(filter.value)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>

            {historyView === "timeline" ? (
              <SharedTimeline
                items={filteredTimelineItems}
                variant="activity"
                emptyState={
                  <EmptyState
                    icon={Clock}
                    title="No history yet"
                    description="This employee hasn't logged any leave yet."
                    action={{
                      label: "Apply leave",
                      onClick: () => router.push("/leaves/apply"),
                    }}
                  />
                }
              />
            ) : filteredHistory.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="No history"
                description="Switch to the timeline view or apply a different filter."
                action={{
                  label: "Apply leave",
                  onClick: () => router.push("/leaves/apply"),
                }}
              />
            ) : (
              <LeaveHistoryTable history={filteredHistory} />
            )}
          </section>
        </div>

        {/* Sidebar cards */}
        <div className="space-y-6">
          <section className="surface-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Availability Forecast</h2>
                <p className="text-sm text-muted-foreground">
                  Upcoming leave windows & overlap
                </p>
              </div>
            </div>
            {upcomingLeaves.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="Fully available"
                description="No upcoming leave scheduled."
              />
            ) : (
              <div className="space-y-3">
                {upcomingLeaves.map((leave) => (
                  <div
                    key={leave.id}
                    className="rounded-lg border border-border/60 p-4"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{leave.type}</span>
                      <Badge variant="outline">{leave.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {format(parseISO(leave.startDate), "MMM d")} →{" "}
                      {format(parseISO(leave.endDate), "MMM d")} (
                      {leave.workingDays} days)
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="surface-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Recent Requests & Actions</h2>
                <p className="text-sm text-muted-foreground">
                  Latest moves with quick context
                </p>
              </div>
            </div>
            {recentActions.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="No recent activity"
                description="Actions will appear here once the employee applies for leave."
              />
            ) : (
              <div className="space-y-3">
                {recentActions.map((action) => (
                  <div
                    key={action.id}
                    className="rounded-lg border border-border/60 p-4 text-sm space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{action.type}</span>
                      <Badge variant="outline">{action.status}</Badge>
                    </div>
                    <p className="text-muted-foreground">
                      {format(parseISO(action.start), "MMM d")} →{" "}
                      {format(parseISO(action.end), "MMM d")}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => router.push(`/approvals/${action.id}`)}
                        aria-label={`Review leave ${action.id}`}
                      >
                        Review
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => router.push(`/leaves/${action.id}#comments`)}
                        aria-label={`Comment on leave ${action.id}`}
                      >
                        Comment
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="surface-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Team Impact</h2>
                <p className="text-sm text-muted-foreground">
                  How this leave affects coverage
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-border/60 p-4">
              <p className="text-3xl font-semibold">
                {employee.stats.employeesOnLeave}
              </p>
              <p className="text-sm text-muted-foreground">
                teammates currently on leave
              </p>
              <Badge
                className={cn(
                  "mt-3",
                  employee.stats.employeesOnLeave >= 3
                    ? "bg-amber-500/20 text-amber-600"
                    : "bg-emerald-500/20 text-emerald-600"
                )}
              >
                {employee.stats.employeesOnLeave >= 3
                  ? "High Impact"
                  : "Low Impact"}
              </Badge>
            </div>
          </section>

          <section className="surface-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Compliance & Alerts</h2>
                <p className="text-sm text-muted-foreground">
                  Guided next steps for HR
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {complianceAlerts.map((alert, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-border/60 p-3 flex items-start gap-3"
                >
                  <AlertTriangle
                    className={cn(
                      "h-4 w-4 mt-1",
                      alert.tone === "warning" && "text-amber-500",
                      alert.tone === "info" && "text-sky-500",
                      alert.tone === "error" && "text-red-500"
                    )}
                  />
                  <div>
                    <p className="text-sm font-semibold">{alert.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {alert.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="surface-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Wellness & Trends</h2>
                <p className="text-sm text-muted-foreground">
                  Utilization trend vs. team target
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-border/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-semibold">
                    {employee.stats.teamUtilization}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Team utilization
                  </p>
                </div>
                <Badge
                  className={cn(
                    trendDelta >= 0
                      ? "bg-emerald-500/15 text-emerald-600"
                      : "bg-amber-500/20 text-amber-600"
                  )}
                >
                  {trendDelta >= 0 ? "+" : ""}
                  {trendDelta}%
                </Badge>
              </div>
              <div className="mt-4 h-[120px]">
                <TrendChart data={trendData} height={120} dataKey="leaves" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  accent = false,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p
          className={cn(
            "text-sm text-foreground",
            accent && "font-semibold text-primary"
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function MetricTile({
  label,
  value,
  trend,
  icon: Icon,
  tone = "default",
  sparkline,
}: {
  label: string;
  value: string | number;
  trend: number;
  icon: typeof Users;
  tone?: "default" | "warning" | "success";
  sparkline?: { month: string; leaves: number }[];
}) {
  const trendPositive = trend >= 0;
  return (
    <div className="rounded-2xl border border-border/60 bg-background/80 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        {label}
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="text-2xl font-semibold text-foreground">{value}</div>
      <div
        className={cn(
          "inline-flex items-center gap-1 text-sm font-medium",
          trendPositive ? "text-emerald-600" : "text-amber-600"
        )}
      >
        {trendPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        {trendPositive ? "+" : ""}
        {trend}% vs prev.
      </div>
      {sparkline && (
        <div className="h-[60px]">
          <TrendChart data={sparkline} height={60} dataKey="leaves" />
        </div>
      )}
    </div>
  );
}
