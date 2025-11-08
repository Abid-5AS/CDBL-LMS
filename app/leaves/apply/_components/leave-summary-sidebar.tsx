"use client";

import Link from "next/link";
import { ClipboardList, BookOpenText, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { fmtDDMMYYYY } from "@/lib/date-utils";
import { LEAVE_OPTIONS, RULE_TIPS, type LeaveType } from "./leave-constants";
import type { DateRangeValue } from "./use-apply-leave-form";

type LeaveSummarySidebarProps = {
  type: LeaveType;
  dateRange: DateRangeValue;
  requestedDays: number;
  remainingBalance: number;
  balancesLoading: boolean;
  balancesError: boolean;
  warnings: string[];
  projectedBalancePercent: number;
};

export function LeaveSummarySidebar({
  type,
  dateRange,
  requestedDays,
  remainingBalance,
  balancesLoading,
  balancesError,
  warnings,
  projectedBalancePercent,
}: LeaveSummarySidebarProps) {
  const typeLabel = LEAVE_OPTIONS.find((o) => o.value === type)?.label ?? "—";
  const durationLabel =
    requestedDays > 0 && dateRange.start && dateRange.end
      ? `${requestedDays} day(s) (${fmtDDMMYYYY(dateRange.start)} → ${fmtDDMMYYYY(dateRange.end)})`
      : "—";

  const projectedBalanceLabel = balancesLoading
    ? "Loading..."
    : balancesError
    ? "Unavailable"
    : `${Math.max(remainingBalance, 0)} days`;

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-sky-950/30 border-none shadow-md rounded-xl p-6 space-y-6 lg:sticky lg:top-24">
      <div>
        <h4 className="flex items-center gap-2 text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4 leading-6">
          <ClipboardList className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          Leave Summary
        </h4>
        <div className="text-sm text-muted-foreground space-y-3 leading-6">
          <div className="flex justify-between">
            <span>Type:</span>
            <span className="font-medium text-neutral-900 dark:text-neutral-100">{typeLabel}</span>
          </div>
          <div className="flex justify-between">
            <span>Duration:</span>
            <span className="font-medium text-neutral-900 dark:text-neutral-100">{durationLabel}</span>
          </div>
          <div className="flex justify-between">
            <span>Projected Balance:</span>
            <span
              className={cn(
                "font-medium",
                remainingBalance < 0
                  ? "text-destructive"
                  : remainingBalance < 2
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400"
              )}
            >
              {projectedBalanceLabel}
            </span>
          </div>
        </div>

        {requestedDays > 0 && !balancesLoading && !balancesError && (
          <div className="mt-4 space-y-1.5">
            <div className="h-2 w-full rounded-full bg-neutral-200/70 dark:bg-neutral-800/70 overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  remainingBalance < 0
                    ? "bg-destructive"
                    : remainingBalance < 2
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                )}
                style={{ width: `${Math.max(0, Math.min(100, projectedBalancePercent))}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{Math.max(remainingBalance, 0)} days remaining</p>
          </div>
        )}
      </div>

      <Separator className="bg-neutral-200/70 dark:bg-neutral-800/70" />

      <div>
        <h4 className="flex items-center gap-2 text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-3 leading-6">
          <BookOpenText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          Policy Highlights
        </h4>
        <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1 leading-6">
          {RULE_TIPS[type].slice(0, 3).map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
        <Link
          href="/policies"
          className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:text-indigo-700 dark:hover:text-indigo-300 mt-4 inline-flex items-center gap-1 leading-6 transition-colors"
        >
          View Full Policy →
        </Link>
      </div>

      {warnings.length > 0 && (
        <>
          <Separator className="bg-neutral-200/70 dark:bg-neutral-800/70" />
          <div className="rounded-lg border border-amber-200/70 dark:border-amber-800/70 bg-amber-50/50 dark:bg-amber-950/20 p-4">
            <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2 leading-6">
              <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Important Note
            </h4>
            <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1 leading-6">
              {warnings.map((warning, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </Card>
  );
}
