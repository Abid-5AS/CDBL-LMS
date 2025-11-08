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
          <ol className="relative border-l-2 border-border-strong dark:border-border-strong ml-4 space-y-6">
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
                      "absolute -left-[29px] top-0 flex h-6 w-6 items-center justify-center rounded-full ring-8 ring-bg-primary dark:ring-border-strong transition-colors",
                      colors.node,
                      status === "PENDING" && "animate-pulse"
                    )}
                    aria-label={`${item.actor || "Timeline"} - ${item.title}`}
                  >
                    {item.icon || <Icon className="h-3.5 w-3.5 text-text-inverted" />}
                  </span>

                  {/* Content */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className={cn("font-semibold text-sm", colors.text)}>
                          {item.actor || "Timeline"}
                          {item.status && (
                            <span className="ml-2 text-xs font-normal text-text-secondary dark:text-text-secondary">
                              – {getStatusLabel(item.status)}
                            </span>
                          )}
                        </h3>
                        {item.meta?.approverName && (
                          <p className="text-xs text-text-secondary dark:text-text-secondary mt-0.5">
                            by {item.meta.approverName}
                          </p>
                        )}
                      </div>
                      <time className="text-xs text-text-secondary dark:text-text-secondary whitespace-nowrap shrink-0">
                        {formatDate(item.at)}
                      </time>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm text-text-secondary dark:text-text-secondary leading-relaxed">
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
                      <p className="text-sm text-text-secondary dark:text-text-secondary leading-relaxed">
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
          <div className="pt-4 border-t border-border-strong dark:border-border-strong">
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
              "flex items-center justify-between gap-4 p-4 rounded-lg bg-bg-primary dark:bg-bg-secondary border-2 border-border-strong dark:border-border-strong hover:border-data-info dark:hover:border-data-info hover:shadow-sm transition-all",
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
                <span className="text-base font-bold text-text-secondary dark:text-text-secondary capitalize">
                  {item.title}
                </span>
              </div>
              {item.subtitle && (
                <div className="text-sm font-semibold text-text-secondary dark:text-text-secondary mb-1">
                  {item.subtitle}
                </div>
              )}
              {item.meta?.daysUntil !== undefined && (
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-data-info dark:text-data-info bg-data-info dark:bg-data-info/30 px-2.5 py-1 rounded-full mt-1">
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
              <time className="text-xs text-text-secondary dark:text-text-secondary whitespace-nowrap">
                {formatDate(item.at)}
              </time>
              {onItemClick && (
                <ArrowRight className="h-4 w-4 text-text-secondary" />
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
        node: "bg-data-success ring-data-success dark:ring-data-success",
        text: "text-data-success dark:text-data-success",
        border: "bg-data-success dark:bg-data-success",
      };
    case "REJECTED":
      return {
        node: "bg-data-error ring-data-error dark:ring-data-error",
        text: "text-data-error dark:text-data-error",
        border: "bg-data-error dark:bg-data-error",
      };
    case "FORWARDED":
      return {
        node: "bg-data-info ring-data-info dark:ring-data-info",
        text: "text-data-info dark:text-data-info",
        border: "bg-data-info dark:bg-data-info",
      };
    case "PENDING":
      return {
        node: "bg-data-warning ring-data-warning dark:ring-data-warning",
        text: "text-data-warning dark:text-data-warning",
        border: "bg-data-warning dark:bg-data-warning",
      };
    case "RETURNED":
      return {
        node: "bg-data-warning ring-data-warning dark:ring-data-warning",
        text: "text-data-warning dark:text-data-warning",
        border: "bg-data-warning dark:bg-data-warning",
      };
    default:
      return {
        node: "bg-bg-secondary ring-border-strong dark:ring-border-strong",
        text: "text-text-secondary dark:text-text-secondary",
        border: "bg-bg-secondary dark:bg-bg-secondary",
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

