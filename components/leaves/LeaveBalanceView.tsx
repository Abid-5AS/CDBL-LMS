"use client";

import { useMemo } from "react";
import { Calendar, Clock, TrendingUp, AlertCircle, BookOpen, CalendarPlus, FileDown, History, ChevronRight, Info, Plane, Palmtree, Stethoscope } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import useSWR from "swr";
import { apiFetcher } from "@/lib/apiClient";
import { ConversionHistory } from "@/components/leaves/ConversionHistory";
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

type LeaveResponse = {
  items?: any[];
};

const LEAVE_TYPE_CONFIG = {
  EARNED: {
    label: "Earned Leave",
    description: "Leaves earned through service",
    icon: Plane,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    maxCarryForward: 60,
    expiresYearEnd: false,
  },
  CASUAL: {
    label: "Casual Leave",
    description: "Short-term personal leave",
    icon: Palmtree,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    maxCarryForward: undefined,
    expiresYearEnd: true,
  },
  MEDICAL: {
    label: "Medical Leave",
    description: "Health & wellness leave",
    icon: Stethoscope,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    maxCarryForward: undefined,
    expiresYearEnd: true,
  },
};

export function LeaveBalanceView() {
  const router = useRouter();

  // Fetch balances
  const { data: balanceData, error: balanceError, isLoading: isBalanceLoading } = useSWR<BalanceResponse>(
    "/api/balance/mine?detailed=true",
    apiFetcher,
    { revalidateOnFocus: false }
  );

  // Fetch user's leaves to calculate projections
  const { data: leavesData, isLoading: isLeavesLoading } = useSWR<LeaveResponse>(
    "/api/leaves?mine=1&limit=100",
    apiFetcher,
    { revalidateOnFocus: false }
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

  // Calculate pending days per type
  const pendingDaysMap = useMemo(() => {
    const map: Record<string, number> = { EARNED: 0, CASUAL: 0, MEDICAL: 0 };
    if (!leavesData?.items) return map;

    leavesData.items.forEach((item) => {
      const isPending = ["PENDING", "SUBMITTED"].includes(item.status);
      if (isPending && map[item.type] !== undefined) {
        map[item.type] += item.workingDays || 0;
      }
    });
    return map;
  }, [leavesData]);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const isYearEnd = currentMonth >= 10; // November or December

  const totalAvailable = balanceData?.balances.reduce((sum, b) => sum + (b.closing ?? 0), 0) ?? 0;
  const totalUsed = balanceData?.balances.reduce((sum, b) => sum + (b.used ?? 0), 0) ?? 0;
  const totalAccrued = balanceData?.balances.reduce((sum, b) => sum + (b.accrued ?? 0), 0) ?? 0;
  const totalPending = Object.values(pendingDaysMap).reduce((sum, val) => sum + val, 0);

  const utilizationBase = totalAvailable + totalUsed;
  const utilizationPct = utilizationBase > 0 ? Math.round((totalUsed / utilizationBase) * 100) : 0;

  const usageTrend = (analyticsData?.monthlyUsage || []).map((m) => ({
    month: m.monthName,
    leaves: m.total,
    approved: m.earned,
    pending: m.casual,
    returned: m.medical,
  }));

  const heroStats = [
    {
      label: "Total Available",
      value: isBalanceLoading ? "…" : `${totalAvailable} d`,
      state: totalAvailable <= 0 ? "danger" : totalAvailable <= 5 ? "warning" : "success",
    },
    {
      label: "Under Review",
      value: isLeavesLoading ? "…" : `${totalPending} d`,
      state: totalPending > 0 ? "warning" : undefined,
    },
    {
      label: "Accrued YTD",
      value: isBalanceLoading ? "…" : `+${totalAccrued} d`,
      state: undefined,
    },
  ] as const;

  return (
    <div className="mx-auto max-w-7xl space-y-6 py-6 px-4">
      {/* Refined Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Leave Balances</h1>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              {balanceData?.year ?? currentYear}
            </span>
          </div>
          <p className="text-muted-foreground text-sm max-w-md">
            Track your leave entitlements, upcoming accruals, and projected availability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full px-4"
            leftIcon={<BookOpen className="size-4" aria-hidden="true" />}
            onClick={() => router.push("/policies")}
          >
            Policies
          </Button>
          <Button
            size="sm"
            className="rounded-full px-4 shadow-sm"
            leftIcon={<CalendarPlus className="size-4" aria-hidden="true" />}
            onClick={() => router.push("/leaves/apply")}
          >
            Apply Leave
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Balances Grid */}
        <div className="lg:col-span-3 space-y-6">
          {balanceError && (
            <Alert variant="destructive" className="border-destructive/40 shadow-sm">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Failed to load balance information. Please try again.</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(["EARNED", "CASUAL", "MEDICAL"] as const).map((type) => {
              const config = LEAVE_TYPE_CONFIG[type];
              const balance = balanceData?.balances.find((b) => b.type === type);
              const Icon = config.icon;

              const total = balance ? balance.opening + balance.accrued : 0;
              const used = balance?.used ?? 0;
              const available = balance?.closing ?? 0;
              const pending = pendingDaysMap[type] || 0;
              const projected = Math.max(0, available - pending);

              const progressPercentage = total > 0 ? (used / total) * 100 : 0;
              const projectedProgressPct = total > 0 ? ((used + pending) / total) * 100 : 0;

              const getStatusColor = (val: number) => {
                if (isBalanceLoading) return "bg-muted";
                if (val > 50) return "bg-emerald-500";
                if (val > 20) return "bg-amber-500";
                return "bg-rose-500";
              };

              const showExpiryWarning = config.expiresYearEnd && isYearEnd && available > 0;
              const showCarryForwardWarning = type === "EARNED" && config.maxCarryForward && available > config.maxCarryForward;

              return (
                <Card key={type} className="group relative overflow-hidden border-border/60 bg-card shadow-sm transition-all hover:shadow-md hover:border-border/100">
                  <div className={cn("absolute top-0 left-0 w-full h-1", config.bgColor.replace("/10", ""))} />

                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className={cn("p-2 rounded-xl", config.bgColor)}>
                        <Icon className={cn("h-5 w-5", config.color)} />
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70">Available</p>
                        <p className="text-2xl font-black tracking-tight text-foreground -mt-1">
                          {isBalanceLoading ? "…" : available}
                        </p>
                      </div>
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">{config.label}</CardTitle>
                      <CardDescription className="text-[11px] leading-tight mt-0.5">{config.description}</CardDescription>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-5">
                    {/* Progress with clear labels */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-end text-[10px] font-bold uppercase tracking-wide text-muted-foreground/60">
                        <span>Projected Balance</span>
                        <div className="flex items-center gap-1">
                          <span className={cn(pending > 0 ? "text-amber-600 font-black" : "")}>
                            {isBalanceLoading ? "…" : projected} d
                          </span>
                          <TooltipProvider>
                            <Tooltip delayDuration={300}>
                              <TooltipTrigger asChild>
                                <Info className="h-3 w-3 cursor-help opacity-40 hover:opacity-100" />
                              </TooltipTrigger>
                              <TooltipContent className="text-xs p-2 max-w-[200px]">
                                <p className="font-bold mb-1">Projection Logic</p>
                                <p>Available ({available}) - Pending ({pending}) = {projected} days remaining if all current requests are approved.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                      <div className="relative h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                        {/* Current Usage */}
                        <div
                          className={cn("absolute left-0 top-0 h-full transition-all duration-500 z-10", getStatusColor(available))}
                          style={{ width: `${progressPercentage}%` }}
                        />
                        {/* Pending Projection */}
                        {pending > 0 && (
                          <div
                            className="absolute top-0 h-full bg-amber-500/30 dark:bg-amber-500/20 transition-all duration-500 z-0 animate-pulse"
                            style={{ left: `${progressPercentage}%`, width: `${projectedProgressPct - progressPercentage}%` }}
                          />
                        )}
                      </div>
                    </div>

                    {/* Streamlined Stats Grid */}
                    <div className="grid grid-cols-2 gap-y-3 pb-2 border-b border-border/40">
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-tight">Opening</p>
                        <p className="text-sm font-bold text-foreground">{balance?.opening ?? 0} d</p>
                      </div>
                      <div className="space-y-0.5 text-right">
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-tight">Accrued</p>
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">+{balance?.accrued ?? 0} d</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-tight">Used (Approved)</p>
                        <p className="text-sm font-bold text-rose-600 dark:text-rose-400">-{balance?.used ?? 0} d</p>
                      </div>
                      <div className="space-y-0.5 text-right">
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-tight">Pending Approval</p>
                        <p className={cn("text-sm font-bold", pending > 0 ? "text-amber-500" : "text-muted-foreground")}>
                          {pending} d
                        </p>
                      </div>
                    </div>

                    {/* Contextual Actions/Warnings */}
                    <div className="min-h-[48px] flex items-center">
                      {showExpiryWarning ? (
                        <div className="flex items-center gap-2 text-[11px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-2 rounded-lg w-full">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>{available} days expire on Dec 31</span>
                        </div>
                      ) : showCarryForwardWarning ? (
                        <div className="flex items-center gap-2 text-[11px] font-medium text-blue-600 bg-blue-50 dark:bg-blue-950/20 p-2 rounded-lg w-full">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>Max {config.maxCarryForward}d carry-forward</span>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground font-medium italic">
                          Carry-forward eligible
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Stats Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {heroStats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col gap-1 p-4 rounded-2xl border border-border/50 bg-muted/30"
              >
                <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground opacity-70">{stat.label}</span>
                <span className={cn(
                  "text-xl font-black tracking-tight",
                  stat.state === "danger" ? "text-rose-600" :
                    stat.state === "warning" ? "text-amber-600" :
                      stat.state === "success" ? "text-emerald-600" :
                        "text-foreground"
                )}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Actions & Progress Summary */}
        <div className="space-y-6">
          <Card className="border-border/60 bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-tight">Annual Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-semibold text-muted-foreground">Budget Utilized</span>
                  <span className="text-lg font-black text-foreground">{utilizationPct}%</span>
                </div>
                <Progress value={utilizationPct} className="h-2" />
              </div>

              <div className="space-y-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => router.push("/reports")}
                >
                  <span className="flex items-center gap-2">
                    <FileDown className="size-4 text-primary" />
                    Entitlement Statement
                  </span>
                  <ChevronRight className="size-4 opacity-50" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => router.push("/leaves")}
                >
                  <span className="flex items-center gap-2">
                    <History className="size-4 text-primary" />
                    Usage History
                  </span>
                  <ChevronRight className="size-4 opacity-50" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Accrual Info */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10">
            <div className="flex gap-3">
              <div className="mt-1">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-foreground">Next Accrual</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Monthly accruals are processed on the 1st of each month. Next update expected Feb 1st.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="pt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {usageTrend.length > 0 && (
          <Card className="border-border/60 bg-card shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">Monthly Usage Trend</CardTitle>
                  <CardDescription className="text-xs">Rolling 12 months average</CardDescription>
                </div>
                <TrendingUp className="h-5 w-5 text-primary opacity-20" />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <TrendChart data={usageTrend} dataKey="leaves" height={200} />
            </CardContent>
          </Card>
        )}

        {/* Conversion History */}
        <div className="rounded-xl border border-border/60 bg-card p-0 shadow-sm overflow-hidden">
          <ConversionHistory year={balanceData?.year ?? currentYear} showHeader />
        </div>
      </div>
    </div>
  );
}
