"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "./EmptyState";
import { Umbrella, Zap, HeartPulse, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type BalanceType = "EARNED" | "CASUAL" | "MEDICAL";

export type Balance = {
  type: BalanceType;
  used: number; // YTD used
  total: number; // annual entitlement
  projected?: number; // optional server projection
  carryForward?: number; // applicable for EARNED
};

export type LeaveBalancePanelProps = {
  balances: Balance[];
  variant?: "full" | "compact";
  showMeters?: boolean; // default true
  showPolicyHints?: boolean; // default false
  onClickType?: (t: BalanceType) => void; // optional nav
  loading?: boolean;
  emptyState?: React.ReactNode;
  className?: string;
};

const TYPE_CONFIG: Record<
  BalanceType,
  {
    label: string;
    icon: typeof Umbrella;
    gradient: string;
    bgGradient: string;
    borderColor: string;
    colorClass: string;
  }
> = {
  EARNED: {
    label: "Earned Leave",
    icon: Umbrella,
    gradient: "from-amber-500 to-orange-600",
    bgGradient: "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
    colorClass: "bg-amber-500",
  },
  CASUAL: {
    label: "Casual Leave",
    icon: Zap,
    gradient: "from-blue-500 to-cyan-600",
    bgGradient: "from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    colorClass: "bg-blue-500",
  },
  MEDICAL: {
    label: "Medical Leave",
    icon: HeartPulse,
    gradient: "from-green-500 to-emerald-600",
    bgGradient: "from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30",
    borderColor: "border-green-200 dark:border-green-800",
    colorClass: "bg-green-500",
  },
};

/**
 * ProgressBar subcomponent for displaying leave usage
 */
function ProgressBar({
  percent,
  label,
  colorClass,
  className,
}: {
  percent: number;
  label: string;
  colorClass: string;
  className?: string;
}) {
  const clampedPercent = Math.min(Math.max(percent, 0), 100);

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        <span>{label}</span>
        <span className="text-slate-700 dark:text-slate-300">{Math.round(clampedPercent)}%</span>
      </div>
      <Progress
        value={clampedPercent}
        className="h-2"
        indicatorClassName={colorClass}
        aria-valuenow={clampedPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${Math.round(clampedPercent)}% used`}
      />
    </div>
  );
}

/**
 * Unified Leave Balance Panel
 * Consolidates LeaveBalanceCards, LeaveBalancesCompact, BalanceMetersGroup
 * Supports full and compact variants with meters and policy hints
 */
export function LeaveBalancePanel({
  balances,
  variant = "full",
  showMeters = true,
  showPolicyHints = false,
  onClickType,
  loading = false,
  emptyState,
  className,
}: LeaveBalancePanelProps) {
  const sortedBalances = useMemo(() => {
    // Sort: EARNED, CASUAL, MEDICAL
    const order: BalanceType[] = ["EARNED", "CASUAL", "MEDICAL"];
    return [...balances].sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
  }, [balances]);

  if (loading) {
    if (variant === "compact") {
      return (
        <div className={cn("grid grid-cols-3 gap-2", className)}>
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
      );
    }
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (sortedBalances.length === 0) {
    if (emptyState) {
      return <>{emptyState}</>;
    }
    return (
      <EmptyState
        icon={Info}
        title="No balance information"
        description="Leave balance information is not available."
      />
    );
  }

  // Compact variant: single row chips
  if (variant === "compact") {
    const totalRemaining = sortedBalances.reduce((sum, b) => {
      const remaining = Math.max(b.total - b.used, 0);
      return sum + remaining;
    }, 0);

    return (
      <div className={cn("space-y-2", className)}>
        {/* Total Remaining */}
        <div className="flex items-center justify-center md:justify-end gap-2 px-2">
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {totalRemaining}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">Days Remaining</span>
        </div>

        {/* 3-column compact cards */}
        <div className="grid grid-cols-3 gap-2">
          {sortedBalances.map((balance) => {
            const config = TYPE_CONFIG[balance.type];
            const Icon = config.icon;
            const remaining = Math.max(balance.total - balance.used, 0);
            const percentUsed = balance.total > 0 ? (balance.used / balance.total) * 100 : 0;

            return (
              <Card
                key={balance.type}
                className={cn(
                  "solid-card p-2 flex flex-col items-center cursor-pointer transition-all hover:scale-[1.02]",
                  onClickType && "hover:shadow-md"
                )}
                onClick={() => onClickType?.(balance.type)}
                role={onClickType ? "button" : undefined}
                tabIndex={onClickType ? 0 : undefined}
                onKeyDown={(e) => {
                  if (onClickType && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onClickType(balance.type);
                  }
                }}
              >
                {showMeters && (
                  <div className="relative w-16 h-16 mb-1">
                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                      <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-slate-200 dark:text-slate-700"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray={`${percentUsed * 0.9}, 100`}
                        className={config.colorClass}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                        {remaining}
                      </span>
                    </div>
                  </div>
                )}
                <div className="text-center mt-1">
                  <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                    {config.label.split(" ")[0]}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    {remaining}/{balance.total}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Full variant: cards with meters
  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sortedBalances.map((balance) => {
          const config = TYPE_CONFIG[balance.type];
          const Icon = config.icon;
          const remaining = Math.max(balance.total - balance.used, 0);
          const percentUsed = balance.total > 0 ? (balance.used / balance.total) * 100 : 0;
          const percentRemaining = 100 - percentUsed;

          return (
            <Card
              key={balance.type}
              className={cn(
                "solid-card cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg",
                "bg-gradient-to-br",
                config.bgGradient,
                config.borderColor,
                "border-2",
                onClickType && "hover:shadow-xl"
              )}
              onClick={() => onClickType?.(balance.type)}
              role={onClickType ? "button" : undefined}
              tabIndex={onClickType ? 0 : undefined}
              onKeyDown={(e) => {
                if (onClickType && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onClickType(balance.type);
                }
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "p-2 rounded-lg bg-gradient-to-br",
                        config.gradient,
                        "text-white"
                      )}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {config.label}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {remaining}/{balance.total} days
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {remaining}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {Math.round(percentRemaining)}% remaining
                    </p>
                    {balance.projected !== undefined && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        Projected: {balance.projected} days
                      </Badge>
                    )}
                  </div>
                  {showMeters && (
                    <div className="w-20 h-20">
                      <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                        <circle
                          cx="18"
                          cy="18"
                          r="16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-slate-200 dark:text-slate-700"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray={`${percentRemaining * 0.9}, 100`}
                          className={cn(config.colorClass, "text-white")}
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {showMeters && (
                  <div className="mt-4">
                    <ProgressBar
                      percent={percentUsed}
                      label={`${balance.used}/${balance.total} used`}
                      colorClass={config.colorClass}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Policy hints footer */}
      {showPolicyHints && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-4">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="flex-1 text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium mb-1">Earned Leave Carry Forward</p>
              <p>
                Earned leave carries forward up to 60 days.{" "}
                <Link
                  href="/policies#earned-leave"
                  className="underline hover:text-amber-900 dark:hover:text-amber-100 font-medium"
                >
                  See Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

