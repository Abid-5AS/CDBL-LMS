"use client";

import { ReactNode, useMemo } from "react";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui";
import { EmptyState } from "./EmptyState";
import { Clock, CheckCircle2, XCircle, Circle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { LeaveStatus } from "@/lib/enums";

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
          <ol className="relative border-l-2 border-border dark:border-border/50 ml-4 space-y-6">
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
                      "absolute -left-[29px] top-0 flex h-6 w-6 items-center justify-center rounded-full ring-8 ring-card dark:ring-card/90 transition-colors",
                      colors.node,
                      status === "PENDING" && "animate-pulse"
                    )}
                    aria-label={`${item.actor || "Timeline"} - ${item.title}`}
                  >
                    {item.icon || <Icon className="h-3.5 w-3.5 text-white dark:text-white" />}
                  </span>

                  {/* Content */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className={cn("font-semibold text-sm", colors.text)}>
                          {item.actor || "Timeline"}
                          {item.status && (
                            <span className="ml-2 text-xs font-normal text-foreground dark:text-foreground/90">
                              – {getStatusLabel(item.status)}
                            </span>
                          )}
                        </h3>
                        {item.meta?.approverName && (
                          <p className="text-xs text-foreground dark:text-foreground/90 mt-0.5">
                            by {item.meta.approverName}
                          </p>
                        )}
                      </div>
                      <time className="text-xs text-foreground dark:text-foreground/90 whitespace-nowrap shrink-0">
                        {formatDate(item.at)}
                      </time>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm text-foreground dark:text-foreground/90 leading-relaxed">
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
                      <p className="text-sm text-foreground dark:text-foreground/90 leading-relaxed">
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
          <div className="pt-4 border-t border-border dark:border-border/50">
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
              "flex items-center justify-between gap-4 p-4 rounded-lg bg-card dark:bg-card/90 border-2 border-border dark:border-border/50 hover:border-info dark:hover:border-info/80 hover:shadow-md transition-all duration-100",
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
                <span className="text-base font-bold text-foreground dark:text-foreground/90 capitalize">
                  {item.title}
                </span>
              </div>
              {item.subtitle && (
                <div className="text-sm font-semibold text-foreground dark:text-foreground/90 mb-1">
                  {item.subtitle}
                </div>
              )}
              {item.meta?.daysUntil !== undefined && (
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-info dark:text-info/90 bg-info/10 dark:bg-info/30 px-2.5 py-1 rounded-full mt-1">
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
              <time className="text-xs text-foreground dark:text-foreground/90 whitespace-nowrap">
                {formatDate(item.at)}
              </time>
              {onItemClick && (
                <ArrowRight className="h-4 w-4 text-foreground dark:text-foreground/90" />
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
        node: "bg-success dark:bg-success/80 ring-data-success dark:ring-data-success",
        text: "text-success dark:text-success/90 dark:text-success dark:text-success/90",
        border: "bg-success dark:bg-success/80 dark:bg-success dark:bg-success/80",
      };
    case "REJECTED":
      return {
        node: "bg-danger dark:bg-danger/80 ring-data-error dark:ring-data-error",
        text: "text-danger dark:text-danger/90 dark:text-danger dark:text-danger/90",
        border: "bg-danger dark:bg-danger/80 dark:bg-danger dark:bg-danger/80",
      };
    case "FORWARDED":
      return {
        node: "bg-info dark:bg-info/80 ring-data-info dark:ring-data-info",
        text: "text-info dark:text-info/90 dark:text-info dark:text-info/90",
        border: "bg-info dark:bg-info/80 dark:bg-info dark:bg-info/80",
      };
    case "PENDING":
      return {
        node: "bg-warning dark:bg-warning/80 ring-data-warning dark:ring-data-warning",
        text: "text-warning dark:text-warning/90 dark:text-warning dark:text-warning/90",
        border: "bg-warning dark:bg-warning/80 dark:bg-warning dark:bg-warning/80",
      };
    case "RETURNED":
      return {
        node: "bg-warning dark:bg-warning/80 ring-data-warning dark:ring-data-warning",
        text: "text-warning dark:text-warning/90 dark:text-warning dark:text-warning/90",
        border: "bg-warning dark:bg-warning/80 dark:bg-warning dark:bg-warning/80",
      };
    default:
      return {
        node: "bg-muted dark:bg-muted/80 ring-border dark:ring-border/50",
        text: "text-foreground dark:text-foreground/90",
        border: "bg-muted dark:bg-muted/80",
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

