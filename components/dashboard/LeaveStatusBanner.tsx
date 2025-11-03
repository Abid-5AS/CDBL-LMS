"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { LeaveTimeline } from "./LeaveTimeline";
import { useUIStore } from "@/lib/ui-state";

type LeaveRequest = {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function LeaveStatusBanner() {
  const { openDrawer } = useUIStore();
  const { data, error, isLoading } = useSWR<{ items: LeaveRequest[] }>("/api/leaves?mine=1", fetcher, {
    revalidateOnFocus: true,
  });

  const activeLeave = useMemo(() => {
    if (!data?.items) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find the most relevant active leave
    const activeLeaves = data.items.filter((leave) => {
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      const isPendingOrApproved = leave.status === "PENDING" || leave.status === "APPROVED" || leave.status === "SUBMITTED";
      
      return isPendingOrApproved && endDate >= today;
    }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    
    return activeLeaves[0] || null;
  }, [data]);

  if (isLoading || error || !activeLeave) {
    return null;
  }

  // Determine variant and icon based on status and timing
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(activeLeave.startDate);
  const endDate = new Date(activeLeave.endDate);
  const isCurrentlyOnLeave = startDate <= today && endDate >= today;
  const isUpcoming = startDate > today;

  let variant: "success" | "warning" | "info" = "info";
  let icon = Clock;
  let message = "";

  if (activeLeave.status === "APPROVED") {
    if (isCurrentlyOnLeave) {
      variant = "success";
      icon = CheckCircle;
      message = "You're currently on leave";
    } else if (isUpcoming) {
      variant = "success";
      icon = CheckCircle;
      message = "Approved leave starting soon";
    }
  } else if (activeLeave.status === "PENDING" || activeLeave.status === "SUBMITTED") {
    variant = "warning";
    icon = Clock;
    message = "Awaiting approval";
  }

  const variantStyles = {
    success: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100",
    warning: "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-100",
    info: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100",
  };

  const Icon = icon;

  return (
    <div 
      className={`rounded-2xl border-2 p-4 cursor-pointer hover:shadow-md transition-shadow ${variantStyles[variant]}`}
      onClick={() => openDrawer(activeLeave.id)}
      role="button"
      tabIndex={0}
      aria-label="View leave details"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openDrawer(activeLeave.id);
        }
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-card/50 dark:bg-card/30 border border-border/50">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium mb-0.5">{message}</div>
          <div className="text-sm">
            <span className="font-semibold capitalize">{activeLeave.type.toLowerCase()} Leave</span>
            {": "}
            {formatDate(activeLeave.startDate)} → {formatDate(activeLeave.endDate)}
          </div>
        </div>
      </div>
      {/* Approval Timeline */}
      <div className="mt-3 pt-3 border-t border-current/20">
        <LeaveTimeline requestId={activeLeave.id} variant="compact" />
      </div>
    </div>
  );
}

