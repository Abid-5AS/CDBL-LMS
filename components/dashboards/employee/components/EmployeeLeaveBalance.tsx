"use client";

import * as React from "react";
import { Progress } from "@/components/ui";
import { ResponsiveDashboardGrid } from "../../shared/ResponsiveDashboardGrid";
import { cn } from "@/lib/utils";

const leaveColors: Record<
  string,
  { light: string; text: string; border: string }
> = {
  EARNED: {
    light: "bg-blue-50/50 dark:bg-blue-900/10",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
  },
  CASUAL: {
    light: "bg-green-50/50 dark:bg-green-900/10",
    text: "text-green-600 dark:text-green-400",
    border: "border-green-200 dark:border-green-800",
  },
  MEDICAL: {
    light: "bg-red-50/50 dark:bg-red-900/10",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
  },
  MATERNITY: {
    light: "bg-pink-50/50 dark:bg-pink-900/10",
    text: "text-pink-600 dark:text-pink-400",
    border: "border-pink-200 dark:border-pink-800",
  },
  PATERNITY: {
    light: "bg-cyan-50/50 dark:bg-cyan-900/10",
    text: "text-cyan-600 dark:text-cyan-400",
    border: "border-cyan-200 dark:border-cyan-800",
  },
  STUDY: {
    light: "bg-purple-50/50 dark:bg-purple-900/10",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-800",
  },
  SPECIAL_DISABILITY: {
    light: "bg-amber-50/50 dark:bg-amber-900/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
  },
  QUARANTINE: {
    light: "bg-orange-50/50 dark:bg-orange-900/10",
    text: "text-orange-600 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800",
  },
  EXTRAWITHPAY: {
    light: "bg-indigo-50/50 dark:bg-indigo-900/10",
    text: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-200 dark:border-indigo-800",
  },
  EXTRAWITHOUTPAY: {
    light: "bg-bg-secondary/50 dark:bg-bg-tertiary/30",
    text: "text-text-secondary dark:text-text-tertiary",
    border: "border-border-soft dark:border-border-strong",
  },
};

type EmployeeLeaveBalanceProps = {
  balanceData: Record<string, number>;
  isLoading: boolean;
};

export function EmployeeLeaveBalance({
  balanceData,
  isLoading,
}: EmployeeLeaveBalanceProps) {
  if (isLoading) {
    return (
      <ResponsiveDashboardGrid columns="1:2:3:3" gap="md">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="animate-pulse p-4 rounded-xl border border-border-soft dark:border-border-strong"
          >
            <div className="h-4 bg-bg-muted dark:bg-bg-tertiary rounded w-2/3 mb-3"></div>
            <div className="h-8 bg-bg-muted dark:bg-bg-tertiary rounded w-1/3 mb-2"></div>
            <div className="h-2 bg-bg-muted dark:bg-bg-tertiary rounded w-full mb-2"></div>
            <div className="h-3 bg-bg-muted dark:bg-bg-tertiary rounded w-1/2"></div>
          </div>
        ))}
      </ResponsiveDashboardGrid>
    );
  }

  if (Object.keys(balanceData).length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-text-secondary dark:text-text-tertiary">
          No balance information available
        </p>
      </div>
    );
  }

  const maxBalance = Math.max(...Object.values(balanceData), 1);

  return (
    <ResponsiveDashboardGrid columns="1:2:3:3" gap="md">
      {Object.entries(balanceData).map(([type, balance]) => {
        const color =
          leaveColors[type] || leaveColors.EXTRAWITHOUTPAY;
        const percentage = Math.min(
          (balance / maxBalance) * 100,
          100
        );

        return (
          <div
            key={type}
            className={cn(
              "p-4 rounded-xl border border-white/20 dark:border-border-soft/50",
              color.light
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-text-primary dark:text-text-inverted text-sm">
                {type.charAt(0) + type.slice(1).toLowerCase()} Leave
              </h4>
              <span className={cn("text-2xl font-bold", color.text)}>
                {balance}
              </span>
            </div>
            <Progress value={percentage} className="h-2 mb-2" />
            <p className="text-xs text-text-secondary dark:text-text-tertiary">
              {balance} days available
            </p>
          </div>
        );
      })}
    </ResponsiveDashboardGrid>
  );
}
