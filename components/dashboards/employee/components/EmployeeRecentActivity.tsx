"use client";

import * as React from "react";

import { useRouter } from "next/navigation";
import { Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";
import { StatusBadge } from "@/components/shared/StatusBadge";

type LeaveWithFormatting = {
  id: number;
  type: string;
  typeLabel: string;
  formattedDates: string;
  workingDays: number;
  status: string;
};

type EmployeeRecentActivityProps = {
  leaves: LeaveWithFormatting[];
  isLoading: boolean;
};

export function EmployeeRecentActivity({
  leaves,
  isLoading,
}: EmployeeRecentActivityProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse flex items-center space-x-4">
            <div className="w-10 h-10 bg-muted rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (leaves.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar
          className="size-12 text-muted-foreground mx-auto mb-4"
          aria-hidden="true"
        />
        <p className="text-muted-foreground">No recent activity</p>
        <p className="text-sm text-muted-foreground mt-1">
          Your leave requests will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {leaves.map((leave) => (
        <div
          key={leave.id}
          className="flex items-center space-x-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer"
          onClick={() => router.push(`/leaves/${leave.id}`)}
        >
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-sm">
            {leave.type.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">
              {leave.typeLabel}
            </p>
            <p className="text-sm text-muted-foreground">
              {leave.formattedDates} ({leave.workingDays} days)
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <StatusBadge status={leave.status as any} />
            <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
          </div>
        </div>
      ))}
    </div>
  );
}
