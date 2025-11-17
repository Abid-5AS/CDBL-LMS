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
    <div className="mx-auto max-w-6xl space-y-6 py-8">
      <EmployeePageHero
        eyebrow="Balances"
        title="Your Leave Overview"
        description={`Track available days, usage, and policy reminders for ${data?.year ?? currentYear}.`}
        stats={heroStats}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<BookOpen className="size-4" aria-hidden="true" />}
              onClick={() => router.push("/policies")}
            >
              View Policies
            </Button>
            <Button
              size="sm"
              leftIcon={<CalendarPlus className="size-4" aria-hidden="true" />}
              onClick={() => router.push("/leaves/apply")}
            >
              Apply Leave
            </Button>
          </>
        }
      />

      {error && (
        <Alert variant="destructive" className="surface-card border border-destructive/40">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load balance information. Please try again.</AlertDescription>
        </Alert>
      )}

      <div className="surface-card p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Upcoming accrual checkpoint</p>
          <p className="text-base font-semibold text-foreground">
            {isYearEnd ? "Year-end balance reconciliation" : "Monthly accrual closes in 5 days"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-start md:justify-end">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<FileDown className="size-4" aria-hidden="true" />}
            onClick={() => router.push("/reports")}
          >
            Download PDF statement
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<History className="size-4" aria-hidden="true" />}
            onClick={() => router.push("/leaves")}
          >
            View usage history
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Exports include your accrual statement, while usage history opens the detailed My Leaves log.
        </p>
      </div>

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

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                  <CardTitle className="text-lg">{config.label}</CardTitle>
                </div>
                <CardDescription>{config.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-baseline justify-between">
                    <p className="text-3xl font-semibold text-foreground">
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
                    <Alert variant="default" className="py-2">
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
                    <Alert variant="default" className="py-2">
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

      {/* Conversion History Section */}
      <ConversionHistory year={data?.year ?? currentYear} showHeader />
    </div>
  );
}

export default function BalancePage() {
  return <BalanceContent />;
}
