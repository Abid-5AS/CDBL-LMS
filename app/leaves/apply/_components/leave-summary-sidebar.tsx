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
    <Card className="rounded-[24px] border-none shadow-xl bg-white/80 dark:bg-card/80 backdrop-blur-xl p-6 space-y-6 lg:sticky lg:top-28">
      <div>
        <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4 uppercase tracking-wider text-muted-foreground">
          <ClipboardList className="w-4 h-4 text-indigo-500" />
          Request Summary
        </h4>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-muted/50 rounded-xl">
            <span className="text-sm font-medium text-muted-foreground">Leave Type</span>
            <Badge variant="secondary" className="font-semibold bg-white dark:bg-slate-800 shadow-sm text-foreground">{typeLabel}</Badge>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-muted/50 rounded-xl space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-medium text-muted-foreground">Duration</span>
              <span className="font-bold text-lg text-foreground">{requestedDays > 0 ? requestedDays : "0"} <span className="text-xs font-normal text-muted-foreground">days</span></span>
            </div>
            {requestedDays > 0 && dateRange.start && dateRange.end && (
              <div className="text-xs text-muted-foreground text-right bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                {fmtDDMMYYYY(dateRange.start)} <span className="mx-1 text-slate-300">→</span> {fmtDDMMYYYY(dateRange.end)}
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 dark:bg-muted/50 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Balance After</span>
              <span
                className={cn(
                  "font-bold text-lg",
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

            {requestedDays > 0 && !balancesLoading && !balancesError && (
              <div className="space-y-1.5">
                <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-500 ease-out rounded-full",
                      remainingBalance < 0
                        ? "bg-gradient-to-r from-rose-500 to-red-600"
                        : remainingBalance < 2
                          ? "bg-gradient-to-r from-amber-400 to-orange-500"
                          : "bg-gradient-to-r from-emerald-400 to-green-500"
                    )}
                    style={{ width: `${Math.max(0, Math.min(100, projectedBalancePercent))}%` }}
                  />
                </div>
                <p className="text-[10px] text-right text-muted-foreground">{Math.max(remainingBalance, 0)} days remaining</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Separator className="bg-slate-100 dark:bg-slate-800" />

      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <BookOpenText className="w-4 h-4 text-violet-500" />
          <p className="text-sm font-semibold text-foreground">Policy Quick View</p>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-xl border border-blue-100 dark:border-blue-900/50">
          {policyHint ?? "Check notice periods and required documents."}
        </p>
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm" className="flex-1 text-xs h-9 rounded-xl hover:bg-slate-100">
            <Link href="/policies">View Policies</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="flex-1 text-xs h-9 rounded-xl hover:bg-slate-100">
            <Link href="/help">Need Help?</Link>
          </Button>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="pt-2">
          <div className="rounded-xl border border-amber-200/50 bg-amber-50/50 dark:bg-amber-950/20 p-4">
            <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Important Notes
            </h4>
            <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1.5">
              {warnings.map((warning, idx) => (
                <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                  <span className="mt-1 block h-1 w-1 rounded-full bg-amber-500 shrink-0" />
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Card>
  );
}
