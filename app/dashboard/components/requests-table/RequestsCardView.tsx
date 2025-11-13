"use client";

import {
  Skeleton,
  Checkbox,
  Button,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui";
import { ClipboardCheck } from "lucide-react";
import { StatusBadge, EmptyState } from "@/components/shared";
import { leaveTypeLabel } from "@/lib/ui";
import { formatDate } from "@/lib/utils";
import clsx from "clsx";
import {
  CANCELABLE_STATUSES,
  type FilterStatus,
  type LeaveRow,
  type SelectionState,
} from "@/hooks/useLeaveRequests";
import type { MouseEvent } from "react";

type RequestsCardViewProps = {
  rows: LeaveRow[];
  filter: FilterStatus;
  isLoading: boolean;
  error: Error | undefined;
  enableSelection: boolean;
  selection: SelectionState;
  onRowClick: (row: LeaveRow, event: MouseEvent<HTMLElement>) => void;
  onOpenDetails: (row: LeaveRow) => void;
  cancelRequest: (id: number) => void | Promise<void>;
};

export function RequestsCardView({
  rows,
  filter,
  isLoading,
  error,
  enableSelection,
  selection,
  onRowClick,
  onOpenDetails,
  cancelRequest,
}: RequestsCardViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-sm text-data-error py-12" role="alert">
        Failed to load
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title={
          filter === "all" ? "No leave requests yet" : `No ${filter} requests`
        }
        description={
          filter === "all"
            ? "Start by applying for your first leave request."
            : `You don't have any ${filter} leave requests.`
        }
        action={
          filter === "all"
            ? {
                label: "Apply Leave",
                onClick: () => (window.location.href = "/leaves/apply"),
              }
            : undefined
        }
      />
    );
  }

  return (
    <>
      {rows.map((row) => {
        const dateRange = `${formatDate(row.startDate)} → ${formatDate(
          row.endDate
        )}`;
        const ariaLabel = `Leave request: ${
          leaveTypeLabel[row.type] ?? row.type
        }, ${row.workingDays} days, ${dateRange}, ${row.status.toLowerCase()}`;
        const isSelected = enableSelection && selection.isSelected(row.id);

        return (
          <div
            key={row.id}
            className={clsx(
              "rounded-lg border border-border bg-card p-4 space-y-3 cursor-pointer",
              "hover:border-card-action dark:hover:border-card-action transition-colors",
              isSelected &&
                "border-card-action bg-card-action dark:bg-card-action/20"
            )}
            onClick={(e) => onRowClick(row, e)}
            role="button"
            tabIndex={0}
            aria-label={ariaLabel}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpenDetails(row);
              }
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm truncate">
                    {leaveTypeLabel[row.type] ?? row.type}
                  </h3>
                  <StatusBadge status={row.status} />
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  {dateRange}
                </p>
                <p className="text-xs font-medium text-muted-foreground">
                  {row.workingDays} day{row.workingDays !== 1 ? "s" : ""}
                </p>
              </div>
              {enableSelection && (
                <Checkbox
                  checked={selection.isSelected(row.id)}
                  onCheckedChange={(checked) =>
                    selection.selectRow(row.id, checked === true)
                  }
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Select ${
                    leaveTypeLabel[row.type] ?? row.type
                  } request`}
                />
              )}
            </div>
            {CANCELABLE_STATUSES.has(row.status) && (
              <div onClick={(e) => e.stopPropagation()}>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      aria-label={`Cancel ${
                        leaveTypeLabel[row.type] ?? row.type
                      } request`}
                    >
                      Cancel Request
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel this request?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will mark the request as cancelled. Approvers will
                        no longer see it.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep</AlertDialogCancel>
                      <AlertDialogAction onClick={() => cancelRequest(row.id)}>
                        Cancel Request
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
