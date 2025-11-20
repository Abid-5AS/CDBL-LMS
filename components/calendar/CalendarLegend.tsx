"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { LeaveType } from "@prisma/client";
import { leaveTypeLabel } from "@/lib/ui";

// Semantic colors for statuses
export const STATUS_COLORS = {
  APPROVED: "bg-emerald-500/15 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  PENDING: "bg-amber-500/15 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  REJECTED: "bg-rose-500/15 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
  CANCELLED: "bg-slate-500/15 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20",
  HOLIDAY: "bg-purple-500/15 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
};

// Minimal dot indicators for leave types (used in compact views)
export const LEAVE_TYPE_DOTS: Record<LeaveType, string> = {
  EARNED: "bg-blue-500",
  CASUAL: "bg-emerald-500",
  MEDICAL: "bg-rose-500",
  MATERNITY: "bg-pink-500",
  PATERNITY: "bg-violet-500",
  STUDY: "bg-yellow-500",
  EXTRAWITHPAY: "bg-orange-500",
  EXTRAWITHOUTPAY: "bg-slate-500",
  SPECIAL_DISABILITY: "bg-indigo-500",
  QUARANTINE: "bg-sky-500",
  SPECIAL: "bg-fuchsia-500",
};

export function CalendarLegend({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground border-t pt-3 mt-2", className)}>
      <div className="flex items-center gap-3">
        <span className="font-medium text-foreground/80">Status:</span>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Approved
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Pending
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500" /> Rejected
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-purple-500" /> Holiday
          </span>
        </div>
      </div>

      <div className="h-4 w-px bg-border hidden sm:block" />

      <div className="flex items-center gap-3">
        <span className="font-medium text-foreground/80">Types:</span>
        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(LEAVE_TYPE_DOTS).slice(0, 5).map(([type, colorClass]) => (
            <span key={type} className="flex items-center gap-1.5">
              <span className={cn("h-1.5 w-1.5 rounded-full", colorClass)} />
              {leaveTypeLabel[type as LeaveType]}
            </span>
          ))}
          <span className="text-[10px] opacity-70">+ others</span>
        </div>
      </div>
    </div>
  );
}
