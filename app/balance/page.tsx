"use client";

import { Calendar, Clock, TrendingUp, AlertCircle, BookOpen, CalendarPlus, FileDown, History } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import useSWR from "swr";
import { apiFetcher } from "@/lib/apiClient";
import { ConversionHistory } from "@/components/leaves/ConversionHistory";
import { EmployeePageHero } from "@/components/employee/PageHero";
import { TrendChart } from "@/components/shared/LeaveCharts/TrendChart";
import { cn } from "@/lib";

type BalanceDetail = {
  type: "EARNED" | "CASUAL" | "MEDICAL";
  opening: number;
  accrued: number;
  used: number;
  closing: number;
};

type BalanceResponse = {
  year: number;
  balances: BalanceDetail[];
};

const LEAVE_TYPE_CONFIG = {
  EARNED: {
    label: "Earned Leave",
    description: "Accrued leave that can be carried forward",
    icon: TrendingUp,
    color: "text-data-warning",
    maxCarryForward: 60,
    expiresYearEnd: false,
  },
  CASUAL: {
    label: "Casual Leave",
    description: "Short-term leave for personal matters",
    icon: Clock,
    color: "text-data-info",
    maxCarryForward: undefined,
    expiresYearEnd: true,
  },
  MEDICAL: {
    label: "Medical Leave",
    description: "Medical certificate required for > 3 days",
    icon: Calendar,
    color: "text-data-success",
    maxCarryForward: undefined,
    expiresYearEnd: true,
  },
};

function BalanceContent() {
  const { data, error, isLoading } = useSWR<BalanceResponse>(
    "/api/balance/mine?detailed=true",
    apiFetcher,
    {
      revalidateOnFocus: false,
    }
  );
  const { data: analyticsData } = useSWR<{
    monthlyUsage?: Array<{
      monthName: string;
      earned: number;
      casual: number;
      medical: number;
      total: number;
    }>;
  }>("/api/dashboard/analytics?window=rolling12", apiFetcher, {
    revalidateOnFocus: false,
  });
  const router = useRouter();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const isYearEnd = currentMonth >= 10; // November or December
  const totalAvailable = data?.balances.reduce((sum, balance) => sum + (balance.closing ?? 0), 0) ?? 0;
  const totalUsed = data?.balances.reduce((sum, balance) => sum + (balance.used ?? 0), 0) ?? 0;
  const totalAccrued = data?.balances.reduce((sum, balance) => sum + (balance.accrued ?? 0), 0) ?? 0;

  const utilizationBase = totalAvailable + totalUsed;
  const utilizationPct =
    utilizationBase > 0 ? Math.round((totalUsed / utilizationBase) * 100) : 0;

  const usageTrend = (analyticsData?.monthlyUsage || []).map((month) => ({
    month: month.monthName,
    leaves: month.total,
    approved: month.earned,
    pending: month.casual,
    returned: month.medical,
  }));

  const heroStats = [
    {
      label: "Total Available",
      value: isLoading ? "…" : `${totalAvailable} days`,
      state: totalAvailable <= 0 ? "danger" : totalAvailable <= 5 ? "warning" : "success",
      helper: `Year ${data?.year ?? currentYear}`,
    },
    {
      label: "Used This Year",
      value: isLoading ? "…" : `${totalUsed} days`,
      state: undefined,
      helper:
        utilizationBase > 0
          ? `${utilizationPct}% utilized · replaces dashboard summary`
          : "Synced with dashboard summary",
    },
    {
      label: "Accrued",
      value: isLoading ? "…" : `+${totalAccrued} days`,
      helper: "Automatic monthly accrual",
    },
  ] as const;

  return (
    <div className="mx-auto max-w-5xl space-y-4 py-4">
      {/* Compact Hero Section */}
      <div className="surface-card p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground mb-1">
              BALANCES
            </p>
            <h1 className="text-2xl font-semibold text-foreground mb-1">Your Leave Overview</h1>
            <p className="text-sm text-muted-foreground">
              Track available days, usage, and policy reminders for {data?.year ?? currentYear}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<BookOpen className="size-4" aria-hidden="true" />}
              onClick={() => router.push("/policies")}
            >
              Policies
            </Button>
            <Button
              size="sm"
              leftIcon={<CalendarPlus className="size-4" aria-hidden="true" />}
              onClick={() => router.push("/leaves/apply")}
            >
              Apply Leave
            </Button>
          </div>
        </div>
        
        {/* Inline Stats */}
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border/50">
          {heroStats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border/70 bg-muted/20"
            >
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p
                  className={cn(
                    "text-base font-semibold",
                    stat.state === "danger" ? "text-destructive" :
                    stat.state === "warning" ? "text-data-warning" :
                    stat.state === "success" ? "text-data-success" :
                    "text-foreground"
                  )}
                >
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="surface-card border border-destructive/40">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load balance information. Please try again.</AlertDescription>
        </Alert>
      )}

      {/* Leave Balance Cards - PRIORITY CONTENT */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(["EARNED", "CASUAL", "MEDICAL"] as const).map((type) => {
          const config = LEAVE_TYPE_CONFIG[type];
          const balance = data?.balances.find((b) => b.type === type);
          const Icon = config.icon;

          const total = balance ? balance.opening + balance.accrued : 0;
          const used = balance?.used ?? 0;
          const available = balance?.closing ?? 0;
          const progressPercentage = total > 0 ? (used / total) * 100 : 0;

          // Determine status color
          const getStatusColor = () => {
            if (isLoading) return "bg-bg-secondary";
            const remainingPercentage = total > 0 ? (available / total) * 100 : 0;
            if (remainingPercentage > 50) return "bg-data-success";
            if (remainingPercentage > 20) return "bg-data-warning";
            return "bg-data-error";
          };

          // Check for warnings
          const showExpiryWarning =
            config.expiresYearEnd && isYearEnd && available > 0;
          const showCarryForwardWarning =
            type === "EARNED" &&
            config.maxCarryForward &&
            available > config.maxCarryForward;

          return (
            <Card key={type} className="surface-card h-full flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${config.color}`} />
                  <CardTitle className="text-base">{config.label}</CardTitle>
                </div>
                <CardDescription>{config.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <div className="flex items-baseline justify-between">
                    <p className="text-2xl font-semibold text-foreground">
                      {isLoading ? "..." : available}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isLoading ? "" : `of ${total} days`}
                    </p>
                  </div>
                  <Progress
                    value={progressPercentage}
                    className="mt-2 h-2"
                    indicatorClassName={getStatusColor()}
                  />
                </div>

                {!isLoading && balance && (
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Opening Balance:</span>
                      <span className="font-medium">{balance.opening} days</span>
                    </div>
                    {balance.accrued > 0 && (
                      <div className="flex justify-between">
                        <span>Accrued:</span>
                        <span className="font-medium text-data-success">
                          +{balance.accrued} days
                        </span>
                      </div>
                    )}
                    {balance.used > 0 && (
                      <div className="flex justify-between">
                        <span>Used:</span>
                        <span className="font-medium text-data-error">
                          -{balance.used} days
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-border pt-1">
                      <span>Available:</span>
                      <span className="font-semibold">{balance.closing} days</span>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 min-h-[60px]">
                  {showExpiryWarning && (
                    <Alert variant="default" className="py-1">
                      <AlertCircle className="h-3 w-3" />
                      <AlertDescription className="text-xs flex items-center gap-2">
                        <span>{available} days will expire on Dec 31.</span>
                        <Link
                          href="/policies#casual"
                          className="underline text-foreground text-[11px]"
                        >
                          Policy
                        </Link>
                      </AlertDescription>
                    </Alert>
                  )}

                  {showCarryForwardWarning && (
                    <Alert variant="default" className="py-1">
                      <AlertCircle className="h-3 w-3" />
                      <AlertDescription className="text-xs flex items-center gap-2">
                        <span>Max {config.maxCarryForward} days can be carried forward.</span>
                        <Link
                          href="/policies#earned"
                          className="underline text-foreground text-[11px]"
                        >
                          See rules
                        </Link>
                      </AlertDescription>
                    </Alert>
                  )}

                  {!showExpiryWarning && !showCarryForwardWarning && (
                    <p className="text-xs text-muted-foreground">
                      No expiry or carry-forward action required this year.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Accrual Checkpoint Section */}
      <div className="surface-card overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Upcoming Checkpoint</p>
              <p className="text-sm font-semibold text-foreground">
                {isYearEnd ? "Year-end balance reconciliation" : "Monthly accrual closes in 5 days"}
              </p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-muted/20">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 justify-center"
              leftIcon={<FileDown className="size-4" aria-hidden="true" />}
              onClick={() => router.push("/reports")}
            >
              Download Statement
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 justify-center"
              leftIcon={<History className="size-4" aria-hidden="true" />}
              onClick={() => router.push("/leaves")}
            >
              View History
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Export includes accrual statement • History shows detailed leave log
          </p>
        </div>
      </div>

      {/* Monthly Usage Trend - Collapsible */}
      {usageTrend.length > 0 && (
        <Card className="surface-card">
          <CardHeader>
            <CardTitle>Monthly usage trend</CardTitle>
            <CardDescription>Rolling 12 months of approved leave days by type.</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart data={usageTrend} dataKey="leaves" height={220} />
          </CardContent>
        </Card>
      )}

      {/* Conversion History Section */}
      <ConversionHistory year={data?.year ?? currentYear} showHeader />
    </div>
  );
}

export default function BalancePage() {
  return <BalanceContent />;
}
