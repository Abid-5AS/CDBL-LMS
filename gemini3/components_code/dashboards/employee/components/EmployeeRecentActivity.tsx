"use client";

import * as React from "react";
import { motion } from "framer-motion";
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
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse flex items-center space-x-4">
            <div className="w-10 h-10 bg-bg-muted dark:bg-bg-tertiary rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-bg-muted dark:bg-bg-tertiary rounded w-3/4"></div>
              <div className="h-3 bg-bg-muted dark:bg-bg-tertiary rounded w-1/2"></div>
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
    <div className="space-y-4">
      {leaves.map((leave, index) => (
        <motion.div
          key={leave.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center space-x-4 p-3 rounded-xl bg-bg-secondary/50 dark:bg-bg-tertiary/30 hover:bg-bg-tertiary/50 dark:hover:bg-bg-tertiary/50 transition-colors cursor-pointer"
          onClick={() => router.push(`/leaves/${leave.id}`)}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-brand to-brand-strong rounded-full flex items-center justify-center text-white font-semibold text-sm">
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
            <ArrowRight className="size-4 text-text-muted" aria-hidden="true" />
          </div>
        </motion.div>
      ))}
      <Button
        variant="ghost"
        className="w-full mt-4 text-brand hover:text-brand-strong hover:bg-brand-soft dark:hover:bg-brand-soft/20"
        onClick={() => router.push("/leaves")}
      >
        View All Leave Requests
        <ArrowRight className="size-4 ml-2" aria-hidden="true" />
      </Button>
    </div>
  );
}
