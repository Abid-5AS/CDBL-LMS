"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { getIcon, iconSizes } from "@/lib/icons";
import { SharedTimeline } from "@/components/shared/SharedTimeline";
import { ApprovalTimelineAdapter } from "@/components/shared/timeline-adapters";
import { cn } from "@/lib/utils";
import useSWR from "swr";
import { useLeaveData } from "@/components/providers/LeaveDataProvider";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type HeroStripProps = {
  name: string;
};

const CalendarIcon = getIcon("CalendarDays");
const AlertIcon = getIcon("AlertCircle");
const ApplyIcon = getIcon("CalendarPlus");
const ClockIcon = getIcon("Clock");

type LeaveItem = {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
};

export function HeroStrip({ name }: HeroStripProps) {
  const router = useRouter();
  
  const { data: leavesData } = useLeaveData();
  
  const { data: holidaysData } = useSWR("/api/holidays?upcoming=true", fetcher, {
    revalidateOnFocus: false,
  });

  const { message, pendingCount, approvedUpcoming, nextHoliday, firstPendingLeave } = useMemo(() => {
    if (!leavesData?.items) {
      return {
        message: `All clear, ${name}. No pending requests.`,
        pendingCount: 0,
        approvedUpcoming: null,
        nextHoliday: null,
        firstPendingLeave: null,
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pending = leavesData.items.filter(
      (item: LeaveItem) => item.status === "SUBMITTED" || item.status === "PENDING"
    );
    
    const firstPending = pending.length > 0 ? pending[0] : null;
    
    const approvedUpcoming = leavesData.items.find((item: LeaveItem) => {
      if (item.status !== "APPROVED") return false;
      const startDate = new Date(item.startDate);
      startDate.setHours(0, 0, 0, 0);
      return startDate >= today;
    });

    // Find next holiday
    const nextHoliday = holidaysData?.items?.[0] || null;

    let msg = "";
    if (approvedUpcoming) {
      const startDate = new Date(approvedUpcoming.startDate);
      msg = `Your ${approvedUpcoming.type.toLowerCase()} leave starts on ${formatDate(startDate)}.`;
    } else if (pending.length > 0) {
      msg = `You have ${pending.length} request(s) awaiting approval.`;
    } else {
      msg = `All clear, ${name}. No pending requests.`;
    }

    return {
      message: msg,
      pendingCount: pending.length,
      approvedUpcoming: approvedUpcoming ? {
        type: approvedUpcoming.type,
        dates: `${formatDate(approvedUpcoming.startDate)} → ${formatDate(approvedUpcoming.endDate)}`,
      } : null,
      nextHoliday: nextHoliday ? {
        name: nextHoliday.name,
        date: nextHoliday.date,
      } : null,
      firstPendingLeave: firstPending,
    };
  }, [leavesData, holidaysData, name]);

  const hasPending = pendingCount > 0;
  const hasApprovedUpcoming = approvedUpcoming !== null;

  const handleClick = () => {
    if (firstPendingLeave) {
      router.push(`/leaves?status=pending&highlight=${firstPendingLeave.id}`);
    } else if (hasPending) {
      router.push("/leaves?status=pending");
    }
  };

  return (
    <div
      className={cn(
        "group relative w-full rounded-2xl border-2 border-border",
        "bg-card hover:bg-accent/30 text-foreground",
        "p-4 shadow-sm hover:shadow-md hover:scale-[1.01]",
        "transition-all duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 focus-visible:ring-offset-2",
        hasPending && "cursor-pointer"
      )}
      onClick={hasPending ? handleClick : undefined}
      role={hasPending ? "button" : undefined}
      tabIndex={hasPending ? 0 : undefined}
      aria-label={hasPending ? "View pending leave request details" : undefined}
      onKeyDown={
        hasPending
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClick();
              }
            }
          : undefined
      }
    >
      <div className="flex flex-col gap-3">
        {/* Main message with icon */}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full border flex-shrink-0",
              hasPending
                ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
                : hasApprovedUpcoming
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                : "bg-accent/20 border-border/50"
            )}
          >
            {hasPending ? (
              <AlertIcon
                className={cn(
                  "w-5 h-5 flex-shrink-0",
                  "text-amber-600 dark:text-amber-400"
                )}
                strokeWidth={2}
              />
            ) : hasApprovedUpcoming ? (
              <ApplyIcon
                className={cn(
                  "w-5 h-5 flex-shrink-0",
                  "text-emerald-600 dark:text-emerald-400"
                )}
                strokeWidth={2}
              />
            ) : (
              <ClockIcon
                className="w-5 h-5 text-muted-foreground flex-shrink-0"
                strokeWidth={2}
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-base font-medium text-foreground line-clamp-2 mb-0.5">
              {message}
            </p>
            {firstPendingLeave && (
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold capitalize text-foreground">
                  {firstPendingLeave.type.toLowerCase()} Leave
                </span>
                {": "}
                {formatDate(firstPendingLeave.startDate)} → {formatDate(firstPendingLeave.endDate)}
              </div>
            )}
          </div>
        </div>

        {/* Approval Timeline for pending requests */}
        {firstPendingLeave && (
          <div className="mt-2 pt-3 border-t border-border/40">
            <LeaveTimeline requestId={firstPendingLeave.id} variant="compact" />
          </div>
        )}

        {/* Next holiday info */}
        {nextHoliday && (
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground pt-1">
            <CalendarIcon
              className="flex-shrink-0 text-primary mt-0.5"
              size={iconSizes.sm}
              strokeWidth={2.4}
            />
            <span className="leading-relaxed">
              Next holiday:{" "}
              <span className="font-medium text-primary">{nextHoliday.name}</span> on{" "}
              {formatDate(nextHoliday.date)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
