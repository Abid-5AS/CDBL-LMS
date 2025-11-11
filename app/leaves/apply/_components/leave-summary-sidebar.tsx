"use client";

import Link from "next/link";
import { ClipboardList, BookOpenText, Info, Wallet } from "lucide-react";
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
  allBalances?: {
    EARNED: number;
    CASUAL: number;
    MEDICAL: number;
  };
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
  allBalances,
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
    <Card className="rounded-2xl border border-border bg-card shadow-lg shadow-black/5 dark:shadow-black/20 p-6 space-y-6 lg:sticky lg:top-24">
      <div>
        <h4 className="flex items-center gap-2 text-base font-semibold text-foreground mb-4 leading-6">
          <ClipboardList className="w-4 h-4 text-primary" />
          Leave Summary
        </h4>
        <div className="text-sm text-muted-foreground space-y-3 leading-6">
          <div className="flex justify-between">
            <span>Type:</span>
            <span className="font-semibold text-foreground">{typeLabel}</span>
          </div>
          <div className="flex justify-between">
            <span>Duration:</span>
            <span className="font-semibold text-foreground">{durationLabel}</span>
          </div>
          <div className="flex justify-between">
            <span>Projected Balance:</span>
            <span
              className={cn(
                "font-semibold",
                remainingBalance < 0
                  ? "text-destructive"
                  : remainingBalance < 2
                  ? "text-data-warning dark:text-data-warning"
                  : "text-data-success dark:text-data-success"
              )}
            >
              {projectedBalanceLabel}
            </span>
          </div>
        </div>

        {requestedDays > 0 && !balancesLoading && !balancesError && (
          <div className="mt-4 space-y-1.5">
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  remainingBalance < 0
                    ? "bg-destructive"
                    : remainingBalance < 2
                    ? "bg-data-warning"
                    : "bg-data-success"
                )}
                style={{ width: `${Math.max(0, Math.min(100, projectedBalancePercent))}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{Math.max(remainingBalance, 0)} days remaining</p>
          </div>
        )}
      </div>

      <Separator />

      {allBalances && !balancesError && (
        <>
          <div>
            <h4 className="flex items-center gap-2 text-base font-semibold text-foreground mb-4 leading-6">
              <Wallet className="w-4 h-4 text-primary" />
              Current Balances
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Earned Leave:</span>
                <span className={cn(
                  "font-semibold",
                  type === "EARNED" && "text-primary"
                )}>
                  {balancesLoading ? "..." : `${allBalances.EARNED} days`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Casual Leave:</span>
                <span className={cn(
                  "font-semibold",
                  type === "CASUAL" && "text-primary"
                )}>
                  {balancesLoading ? "..." : `${allBalances.CASUAL} days`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Medical Leave:</span>
                <span className={cn(
                  "font-semibold",
                  type === "MEDICAL" && "text-primary"
                )}>
                  {balancesLoading ? "..." : `${allBalances.MEDICAL} days`}
                </span>
              </div>
            </div>
            <Link
              href="/balance"
              className="text-primary text-xs font-semibold hover:text-primary/80 mt-3 inline-flex items-center gap-1 leading-6 transition-colors"
            >
              View Details →
            </Link>
          </div>

          <Separator />
        </>
      )}

      <div>
        <h4 className="flex items-center gap-2 text-base font-semibold text-foreground mb-3 leading-6">
          <BookOpenText className="w-4 h-4 text-primary" />
          Policy Highlights
        </h4>
        <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1 leading-6">
          {RULE_TIPS[type].slice(0, 3).map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
        <Link
          href="/policies"
          className="text-primary text-sm font-semibold hover:text-primary/80 mt-4 inline-flex items-center gap-1 leading-6 transition-colors"
        >
          View Full Policy →
        </Link>
      </div>

      {warnings.length > 0 && (
        <>
          <Separator />
          <div className="rounded-2xl border border-data-warning/60 bg-data-warning/10 dark:bg-data-warning/20 p-4">
            <h4 className="text-sm font-semibold text-data-warning mb-2 flex items-center gap-2 leading-6">
              <Info className="h-4 w-4 text-data-warning" />
              Important Note
            </h4>
            <ul className="text-sm text-data-warning space-y-1 leading-6">
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
