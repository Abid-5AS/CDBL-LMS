"use client";

import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, Activity, CheckCircle2, AlertTriangle, XCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import clsx from "clsx";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const POLICY_LIMITS = {
  EARNED: 60,
  CASUAL: 10,
  MEDICAL: 14,
};

type BalanceData = {
  EARNED?: number;
  CASUAL?: number;
  MEDICAL?: number;
};

type LeaveType = {
  type: "EARNED" | "CASUAL" | "MEDICAL";
  label: string;
  value: number;
  total: number;
  icon: typeof Calendar;
  color: string;
  textColor: string;
};

function getStatusColor(remainingPercentage: number): {
  bar: string;
  text: string;
  icon: typeof CheckCircle2;
  status: string;
} {
  if (remainingPercentage === 0) {
    return {
      bar: "bg-red-500 dark:bg-red-600",
      text: "text-red-600 dark:text-red-400",
      icon: XCircle,
      status: "Exhausted",
    };
  } else if (remainingPercentage <= 10) {
    return {
      bar: "bg-red-500 dark:bg-red-600",
      text: "text-red-600 dark:text-red-400",
      icon: AlertTriangle,
      status: "Low",
    };
  } else if (remainingPercentage <= 30) {
    return {
      bar: "bg-amber-500 dark:bg-amber-600",
      text: "text-amber-600 dark:text-amber-400",
      icon: AlertTriangle,
      status: "Warning",
    };
  } else {
    return {
      bar: "bg-green-500 dark:bg-green-600",
      text: "text-green-600 dark:text-green-400",
      icon: CheckCircle2,
      status: "Available",
    };
  }
}

export function LeaveSummaryCard() {
  const { data, error, isLoading } = useSWR<BalanceData>("/api/balance/mine", fetcher, {
    revalidateOnFocus: false,
  });

  if (isLoading) {
    return (
      <Card className="glass-light">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return null;
  }

  const balances: LeaveType[] = [
    {
      type: "EARNED",
      label: "Earned Leave",
      value: data.EARNED ?? 0,
      total: POLICY_LIMITS.EARNED,
      icon: Calendar,
      color: "bg-blue-500",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      type: "CASUAL",
      label: "Casual Leave",
      value: data.CASUAL ?? 0,
      total: POLICY_LIMITS.CASUAL,
      icon: Clock,
      color: "bg-emerald-500",
      textColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      type: "MEDICAL",
      label: "Medical Leave",
      value: data.MEDICAL ?? 0,
      total: POLICY_LIMITS.MEDICAL,
      icon: Activity,
      color: "bg-amber-500",
      textColor: "text-amber-600 dark:text-amber-400",
    },
  ];

  // Calculate totals
  const totalRemaining = balances.reduce((sum, b) => {
    const remaining = b.total - b.value;
    return sum + Math.max(0, remaining);
  }, 0);

  const totalUsed = balances.reduce((sum, b) => sum + b.value, 0);
  const totalEntitlement = balances.reduce((sum, b) => sum + b.total, 0);

  return (
    <Card className="glass-light">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Leave Summary</CardTitle>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Link href="/policies">
              <span className="hidden sm:inline mr-1">View Policy</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <TooltipProvider>
          {balances.map((balance) => {
            const used = balance.value;
            const total = balance.total;
            const remaining = total - used;
            const remainingPercentage = (remaining / total) * 100;
            const usedPercentage = (used / total) * 100;
            
            const status = getStatusColor(remainingPercentage);
            const StatusIcon = status.icon;
            const isExhausted = remaining === 0;

            return (
              <Tooltip key={balance.type}>
                <TooltipTrigger asChild>
                  <div
                    className={clsx(
                      "space-y-2 p-3 rounded-lg border transition-colors",
                      isExhausted
                        ? "border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10"
                        : remainingPercentage <= 10
                        ? "border-red-200 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/5"
                        : remainingPercentage <= 30
                        ? "border-amber-200 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-900/5"
                        : "border-green-200 dark:border-green-900/30 bg-green-50/30 dark:bg-green-900/5"
                    )}
                    role="group"
                    aria-label={`${balance.label}: ${remaining} days remaining`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <balance.icon
                          className={clsx(
                            "h-4 w-4 shrink-0",
                            balance.textColor
                          )}
                          aria-hidden="true"
                        />
                        <span className="text-sm font-medium truncate">
                          {balance.label}
                        </span>
                        <StatusIcon
                          className={clsx(
                            "h-3.5 w-3.5 shrink-0",
                            status.text
                          )}
                          aria-label={status.status}
                        />
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-baseline gap-1.5">
                          <span
                            className={clsx(
                              "text-base font-bold",
                              isExhausted
                                ? "text-red-600 dark:text-red-400"
                                : remainingPercentage <= 10
                                ? "text-red-600 dark:text-red-400"
                                : remainingPercentage <= 30
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-green-600 dark:text-green-400"
                            )}
                          >
                            {remaining}
                          </span>
                          <span className="text-xs font-medium text-muted-foreground">
                            days left
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {used} / {total}
                        </div>
                      </div>
                    </div>
                    <Progress
                      value={usedPercentage}
                      className="h-2"
                      indicatorClassName={status.bar}
                      aria-label={`${usedPercentage.toFixed(0)}% used, ${remainingPercentage.toFixed(0)}% remaining`}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="font-medium mb-1">{balance.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {isExhausted ? (
                      <>
                        You&apos;ve reached the limit for {balance.label}.{" "}
                        <Link
                          href="/policies"
                          className="underline hover:no-underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View policy
                        </Link>{" "}
                        for carryover rules.
                      </>
                    ) : remainingPercentage <= 10 ? (
                      <>
                        Low balance alert: Only {remaining} days remaining. Plan
                        accordingly.
                      </>
                    ) : remainingPercentage <= 30 ? (
                      <>
                        {remaining} days remaining ({remainingPercentage.toFixed(0)}%
                        of entitlement). Consider scheduling upcoming leave.
                      </>
                    ) : (
                      <>
                        {remaining} days available ({remainingPercentage.toFixed(0)}%
                        of your {total}-day entitlement).
                      </>
                    )}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>

        {/* Total Summary Row */}
        <div
          className="pt-3 mt-3 border-t border-border"
          role="group"
          aria-label="Total leave summary"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Total Remaining
            </span>
            <div className="text-right">
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {totalRemaining}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  days
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {totalUsed} / {totalEntitlement} used
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
