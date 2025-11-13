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
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
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
          className="size-12 text-slate-300 dark:text-slate-600 mx-auto mb-4"
          aria-hidden="true"
        />
        <p className="text-slate-600 dark:text-slate-400">No recent activity</p>
        <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
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
          className="flex items-center space-x-4 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-700/30 hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
          onClick={() => router.push(`/leaves/${leave.id}`)}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {leave.type.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900 dark:text-white truncate">
              {leave.typeLabel}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {leave.formattedDates} ({leave.workingDays} days)
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <StatusBadge status={leave.status} />
            <ArrowRight className="size-4 text-slate-400" aria-hidden="true" />
          </div>
        </motion.div>
      ))}
      <Button
        variant="ghost"
        className="w-full mt-4 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
        onClick={() => router.push("/leaves")}
      >
        View All Leave Requests
        <ArrowRight className="size-4 ml-2" aria-hidden="true" />
      </Button>
    </div>
  );
}
