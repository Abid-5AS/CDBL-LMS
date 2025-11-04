"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileClock, RefreshCcw, AlertOctagon, Archive } from "lucide-react";
import { cn } from "@/lib/utils";

type LeaveStatus =
  | "SUBMITTED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "RETURNED"
  | "CANCELLATION_REQUESTED"
  | "RECALLED"
  | "OVERSTAY_PENDING";

type LeaveRow = {
  id: number;
  status: LeaveStatus;
};

/**
 * [NEW COMPONENT]
 * Displays critical action items based on new v2.0 statuses.
 */
export function ActionItems({
  leaves,
  isLoading,
}: {
  leaves: LeaveRow[];
  isLoading: boolean;
}) {
  const stats = useMemo(() => {
    const pendingCount = leaves.filter(
      (l) => l.status === "SUBMITTED" || l.status === "PENDING"
    ).length;

    const returnedCount = leaves.filter((l) => l.status === "RETURNED").length;

    const overstayCount = leaves.filter(
      (l) => l.status === "OVERSTAY_PENDING"
    ).length;

    const cancellationCount = leaves.filter(
      (l) => l.status === "CANCELLATION_REQUESTED"
    ).length;

    return { pendingCount, returnedCount, overstayCount, cancellationCount };
  }, [leaves]);

  const items = [
    {
      title: "Pending Approval",
      count: stats.pendingCount,
      icon: FileClock,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      title: "Returned to You",
      count: stats.returnedCount,
      icon: RefreshCcw,
      color: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-50 dark:bg-yellow-950/30",
    },
    {
      title: "Overstay Alerts",
      count: stats.overstayCount,
      icon: AlertOctagon,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-950/30",
    },
    {
      title: "Cancelling",
      count: stats.cancellationCount,
      icon: Archive,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-950/30",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  // If all counts are 0, don't show anything
  if (items.every((item) => item.count === 0)) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {items.map(
        (item, i) =>
          item.count > 0 && (
            <Card
              key={item.title}
              className={cn(
                "p-4 animate-fade-in-up",
                item.color,
                item.bg
              )}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{item.title}</span>
                <item.icon className={cn("size-5", item.color)} />
              </div>
              <div className="mt-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {item.count}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {" "}
                  request{item.count !== 1 ? "s" : ""}
                </span>
              </div>
            </Card>
          )
      )}
    </div>
  );
}

