"use client";

import { ReactNode, useMemo } from "react";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { EmptyState } from "./EmptyState";
import { Clock, CheckCircle2, XCircle, Circle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { LeaveStatus } from "@prisma/client";

export type TimelineItem = {
  id: string;
  at: string; // ISO date string
  actor?: string; // "Dept Head", "HR Admin", etc.
  status?: "PENDING" | "FORWARDED" | "APPROVED" | "REJECTED" | "RETURNED" | "CANCELLED";
  title: string; // e.g., "Forwarded to HR"
  subtitle?: string; // e.g., reason/comment
  meta?: Record<string, string | number>;
  icon?: ReactNode; // optional override
};

export type SharedTimelineProps = {
  items: TimelineItem[];
  variant?: "activity" | "approval" | "requests";
  dense?: boolean;
  limit?: number;
  loading?: boolean;
  emptyState?: ReactNode;
  onLoadMore?: () => void;
  className?: string;
  onItemClick?: (item: TimelineItem) => void;
};

/**
 * Shared Timeline Component
 * Consolidates ApprovalTimeline, ActiveRequestsTimeline, LiveActivityTimeline, SortedTimeline
 * Data-driven with adapter pattern for different data sources
 */
export function SharedTimeline({
  items,
  variant = "activity",
  dense = false,
  limit,
  loading = false,
  emptyState,
  onLoadMore,
  className,
  onItemClick,
}: SharedTimelineProps) {
  const displayedItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      // Sort by date descending (most recent first)
      return new Date(b.at).getTime() - new Date(a.at).getTime();
    });
    return limit ? sorted.slice(0, limit) : sorted;
  }, [items, limit]);

  const hasMore = limit && items.length > limit;

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className={cn("h-16 w-full", dense && "h-12")} />
        ))}
      </div>
    );
  }

  if (displayedItems.length === 0) {
    if (emptyState) {
      return <>{emptyState}</>;
    }
    return (
      <EmptyState
        icon={Clock}
        title="No timeline items"
        description="There are no items to display in this timeline."
      />
    );
  }

  // Render based on variant
  if (variant === "approval") {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="relative">
          <ol className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-4 space-y-6">
            {displayedItems.map((item, index) => {
              const isLast = index === displayedItems.length - 1;
              const status = item.status;
              const colors = getStatusColors(status);
              const Icon = getStatusIcon(status);

              return (
                <li
                  key={item.id}
                  className="ml-6 relative"
                  role="listitem"
                  tabIndex={onItemClick ? 0 : undefined}
                  onClick={() => onItemClick?.(item)}
                  onKeyDown={(e) => {
                    if (onItemClick && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      onItemClick(item);
                    }
                  }}
                >
                  {/* Timeline node */}
                  <span
                    className={cn(
                      "absolute -left-[29px] top-0 flex h-6 w-6 items-center justify-center rounded-full ring-8 ring-white dark:ring-slate-900 transition-colors",
                      colors.node,
                      status === "PENDING" && "animate-pulse"
                    )}
                    aria-label={`${item.actor || "Timeline"} - ${item.title}`}
                  >
                    {item.icon || <Icon className="h-3.5 w-3.5 text-white" />}
                  </span>

                  {/* Content */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className={cn("font-semibold text-sm", colors.text)}>
                          {item.actor || "Timeline"}
                          {item.status && (
                            <span className="ml-2 text-xs font-normal text-slate-600 dark:text-slate-400">
                              – {getStatusLabel(item.status)}
                            </span>
                          )}
                        </h3>
                        {item.meta?.approverName && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                            by {item.meta.approverName}
                          </p>
                        )}
                      </div>
                      <time className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap shrink-0">
                        {formatDate(item.at)}
                      </time>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {item.title}
                      </p>
                      {item.status && (
                        <StatusBadge
                          status={item.status as LeaveStatus}
                          className="shrink-0"
                        />
                      )}
                    </div>
                    {item.subtitle && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {item.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Connector line (except for last item) */}
                  {!isLast && (
                    <div
                      className={cn(
                        "absolute left-[-2px] top-6 w-0.5 h-6",
                        colors.border
                      )}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </div>
        {hasMore && onLoadMore && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button variant="outline" size="sm" onClick={onLoadMore}>
              Load More
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Activity/Requests variant (card-based)
  return (
    <div className={cn("space-y-3", dense && "space-y-2", className)}>
      {displayedItems.map((item) => {
        const status = item.status;
        const colors = getStatusColors(status);

        return (
          <div
            key={item.id}
            className={cn(
              "flex items-center justify-between gap-4 p-4 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all",
              dense && "p-3",
              onItemClick && "cursor-pointer"
            )}
            role={onItemClick ? "button" : undefined}
            tabIndex={onItemClick ? 0 : undefined}
            onClick={() => onItemClick?.(item)}
            onKeyDown={(e) => {
              if (onItemClick && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onItemClick(item);
              }
            }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                {status && (
                  <StatusBadge status={status as LeaveStatus} />
                )}
                <span className="text-base font-bold text-slate-900 dark:text-slate-100 capitalize">
                  {item.title}
                </span>
              </div>
              {item.subtitle && (
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {item.subtitle}
                </div>
              )}
              {item.meta?.daysUntil !== undefined && (
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2.5 py-1 rounded-full mt-1">
                  <Clock className="h-3 w-3 flex-shrink-0" strokeWidth={2} />
                  <span>
                    {item.meta.daysUntil === 0
                      ? "Starting today"
                      : item.meta.daysUntil === 1
                      ? "Starts tomorrow"
                      : `Starts in ${item.meta.daysUntil} days`}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <time className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                {formatDate(item.at)}
              </time>
              {onItemClick && (
                <ArrowRight className="h-4 w-4 text-slate-400" />
              )}
            </div>
          </div>
        );
      })}
      {hasMore && onLoadMore && (
        <div className="pt-2">
          <Button variant="outline" size="sm" onClick={onLoadMore} className="w-full">
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}

// Helper functions
function getStatusIcon(
  status?: "PENDING" | "FORWARDED" | "APPROVED" | "REJECTED" | "RETURNED" | "CANCELLED"
) {
  switch (status) {
    case "APPROVED":
    case "FORWARDED":
      return CheckCircle2;
    case "REJECTED":
      return XCircle;
    case "PENDING":
      return Clock;
    default:
      return Circle;
  }
}

function getStatusColors(
  status?: "PENDING" | "FORWARDED" | "APPROVED" | "REJECTED" | "RETURNED" | "CANCELLED"
) {
  switch (status) {
    case "APPROVED":
      return {
        node: "bg-green-500 ring-green-200 dark:ring-green-900",
        text: "text-green-700 dark:text-green-400",
        border: "bg-green-300 dark:bg-green-700",
      };
    case "REJECTED":
      return {
        node: "bg-red-500 ring-red-200 dark:ring-red-900",
        text: "text-red-700 dark:text-red-400",
        border: "bg-red-300 dark:bg-red-700",
      };
    case "FORWARDED":
      return {
        node: "bg-blue-500 ring-blue-200 dark:ring-blue-900",
        text: "text-blue-700 dark:text-blue-400",
        border: "bg-blue-300 dark:bg-blue-700",
      };
    case "PENDING":
      return {
        node: "bg-amber-500 ring-amber-200 dark:ring-amber-900",
        text: "text-amber-700 dark:text-amber-400",
        border: "bg-amber-300 dark:bg-amber-700",
      };
    case "RETURNED":
      return {
        node: "bg-yellow-500 ring-yellow-200 dark:ring-yellow-900",
        text: "text-yellow-700 dark:text-yellow-400",
        border: "bg-yellow-300 dark:bg-yellow-700",
      };
    default:
      return {
        node: "bg-gray-400 ring-gray-200 dark:ring-gray-800",
        text: "text-gray-600 dark:text-gray-400",
        border: "bg-gray-300 dark:bg-gray-700",
      };
  }
}

function getStatusLabel(
  status?: "PENDING" | "FORWARDED" | "APPROVED" | "REJECTED" | "RETURNED" | "CANCELLED"
): string {
  switch (status) {
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Rejected";
    case "FORWARDED":
      return "Forwarded";
    case "PENDING":
      return "Pending";
    case "RETURNED":
      return "Returned";
    case "CANCELLED":
      return "Cancelled";
    default:
      return "Unknown";
  }
}

