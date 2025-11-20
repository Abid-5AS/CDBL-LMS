"use client";

import Link from "next/link";
import { ClipboardList, BookOpenText, Info, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  policyHint?: string | null;
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
  policyHint,
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

  const needsInput = requestedDays <= 0 || !dateRange.start || !dateRange.end;

  return (
    <Card className="rounded-lg border shadow-sm p-4 space-y-4 lg:sticky lg:top-24">
      <div>
        <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
          <ClipboardList className="w-4 h-4 text-primary" />
          Leave Summary
        </h4>
        <div className="text-sm text-muted-foreground space-y-2">
          <div className="flex justify-between">
            <span>Type:</span>
            <span className="font-semibold text-foreground">{typeLabel}</span>
          </div>
          <div className="flex justify-between">
            <span>Duration:</span>
            <span className="font-semibold text-foreground">{durationLabel}</span>
          </div>
          <div className="flex justify-between">
            <span>After Request:</span>
            <span
              className={cn(
                "font-semibold",
                remainingBalance < 0
                  ? "text-rose-600 dark:text-rose-400"
                  : remainingBalance < 2
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-500"
              )}
            >
              {projectedBalanceLabel}
            </span>
          </div>
        </div>

        {needsInput && (
          <p className="mt-3 text-xs text-muted-foreground">
            Select leave type and dates to preview balance.
          </p>
        )}

        {requestedDays > 0 && !balancesLoading && !balancesError && (
          <div className="mt-3 space-y-1">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  remainingBalance < 0
                    ? "bg-rose-500"
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

      <Separator />

      <div className="space-y-2 rounded-lg border bg-muted/10 p-3">
        <div className="flex items-center gap-2">
          <BookOpenText className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">Policy Info</p>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {policyHint ?? "Check notice periods and required documents."}
        </p>
        <div className="flex gap-2 pt-1">
          <Button asChild variant="outline" size="sm" className="flex-1 text-xs h-8">
            <Link href="/policies">Policies</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="flex-1 text-xs h-8">
            <Link href="/help">Help</Link>
          </Button>
        </div>
      </div>

      {warnings.length > 0 && (
        <>
          <Separator />
          <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3">
            <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Important
            </h4>
            <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
              {warnings.map((warning, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span>•</span>
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
