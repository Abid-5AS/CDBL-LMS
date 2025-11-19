"use client";

import { EmptyState } from "@/components/shared/EmptyState";
import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import clsx from "clsx";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { leaveTypeLabel } from "@/lib/ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  CANCELABLE_STATUSES,
  type FilterStatus,
  type LeaveRow,
  type SelectionState,
} from "@/hooks/useLeaveRequests";
import type { MouseEvent } from "react";

type RequestsTableViewProps = {
  rows: LeaveRow[];
  filter: FilterStatus;
  isLoading: boolean;
  error: Error | undefined;
  enableSelection: boolean;
  selection: SelectionState;
  onRowClick: (row: LeaveRow, event: MouseEvent<HTMLElement>) => void;
  cancelRequest: (id: number) => void | Promise<void>;
};

export function RequestsTableView({
  rows,
  filter,
  isLoading,
  error,
  enableSelection,
  selection,
  onRowClick,
  cancelRequest,
}: RequestsTableViewProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full" aria-label="Leave requests table">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {enableSelection && (
              <th className="w-12 px-4 py-3 text-left">
                <Checkbox
                  checked={selection.allSelected}
                  onCheckedChange={(checked) => selection.selectAll(checked === true)}
                  aria-label="Select all rows"
                  className={selection.someSelected ? "data-[state=checked]:bg-card-action" : ""}
                />
              </th>
            )}
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Dates
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Days
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td
                colSpan={enableSelection ? 7 : 6}
                className="text-center text-sm text-muted-foreground py-12"
                aria-live="polite"
              >
                Loading...
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td
                colSpan={enableSelection ? 7 : 6}
                className="text-center text-sm text-data-error py-12"
                role="alert"
              >
                Failed to load
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={enableSelection ? 7 : 6} className="p-0">
                <EmptyState
                  icon={ClipboardCheck}
                  title={filter === "all" ? "No leave requests yet" : `No ${filter} requests`}
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
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const dateRange = `${formatDate(row.startDate)} → ${formatDate(row.endDate)}`;
              const ariaLabel = `Leave request: ${
                leaveTypeLabel[row.type] ?? row.type
              }, ${row.workingDays} days, ${dateRange}, ${row.status.toLowerCase()}`;
              const isSelected = enableSelection && selection.isSelected(row.id);

              return (
                <tr
                  key={row.id}
                  className={clsx(
                    "border-b border-border hover:bg-muted/30 transition-colors cursor-pointer",
                    isSelected && "bg-card-action dark:bg-card-action/20",
                  )}
                  onClick={(e) => onRowClick(row, e)}
                  aria-label={ariaLabel}
                  role="row"
                >
                  {enableSelection && (
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={selection.isSelected(row.id)}
                        onCheckedChange={(checked) => selection.selectRow(row.id, checked === true)}
                        aria-label={`Select ${leaveTypeLabel[row.type] ?? row.type} request`}
                      />
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="font-semibold text-sm">{leaveTypeLabel[row.type] ?? row.type}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{dateRange}</td>
                  <td className="px-4 py-3 text-sm font-medium">{row.workingDays}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td
                    className="px-4 py-3 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {CANCELABLE_STATUSES.has(row.status) ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs"
                            aria-label={`Cancel ${leaveTypeLabel[row.type] ?? row.type} request from ${dateRange}`}
                          >
                            Cancel
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel this request?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will mark the request as cancelled. Approvers will no longer see it.
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
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
