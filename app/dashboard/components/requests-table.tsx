"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ClipboardCheck } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { leaveTypeLabel } from "@/lib/ui";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LeaveDetailsModal } from "@/components/shared/LeaveDetailsModal";
import { Checkbox } from "@/components/ui/checkbox";
import clsx from "clsx";
import Link from "next/link";
import {
  CANCELABLE_STATUSES,
  type FilterStatus,
  type LeaveRow,
  type SelectionState,
  useLeaveRequests,
} from "@/hooks/useLeaveRequests";

type RequestsTableProps = {
  limit?: number;
  showFilter?: boolean;
};

const filterOptions: Array<{ value: FilterStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "cancelled", label: "Cancelled" },
];

export function RequestsTable({ limit, showFilter = true }: RequestsTableProps = {}) {
  const {
    rows,
    allRows,
    filter,
    changeFilter,
    isLoading,
    error,
    enableSelection,
    selection,
    modal,
    cancelRequest,
  } = useLeaveRequests({ limit });

  const handleRowClick = (row: LeaveRow, e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('input[type="checkbox"]') ||
      target.closest("button") ||
      target.closest("a")
    ) {
      return;
    }
    modal.openDetails(row);
  };

  const headerTitle = limit && allRows.length > limit ? "Recent Requests" : "My Leave Requests";

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle>{headerTitle}</CardTitle>
              {limit && allRows.length > limit && (
                <Button asChild variant="ghost" size="sm" className="text-indigo-600">
                  <Link href="/leaves">View All</Link>
                </Button>
              )}
            </div>
            {showFilter && (
              <div className="flex items-center gap-2 flex-wrap">
                {filterOptions.map((option) => {
                  const isSelected = filter === option.value;
                  return (
                    <Button
                      key={option.value}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => changeFilter(option.value)}
                      className={clsx(
                        "h-8 rounded-full text-xs font-medium transition-all",
                        isSelected
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 shadow-sm"
                          : "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
                      )}
                      aria-current={isSelected ? "page" : undefined}
                    >
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <RequestsTableView
              rows={rows}
              filter={filter}
              isLoading={isLoading}
              error={error}
              enableSelection={enableSelection}
              selection={selection}
              onRowClick={handleRowClick}
              cancelRequest={cancelRequest}
            />
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3 p-4">
            <RequestsCardView
              rows={rows}
              filter={filter}
              isLoading={isLoading}
              error={error}
              enableSelection={enableSelection}
              selection={selection}
              onRowClick={handleRowClick}
              onOpenDetails={modal.openDetails}
              cancelRequest={cancelRequest}
            />
          </div>
        </CardContent>
      </Card>

      <LeaveDetailsModal
        open={modal.isOpen}
        onOpenChange={modal.handleOpenChange}
        leave={modal.selectedLeave}
      />
    </>
  );
}

type RequestsTableViewProps = {
  rows: LeaveRow[];
  filter: FilterStatus;
  isLoading: boolean;
  error: Error | undefined;
  enableSelection: boolean;
  selection: SelectionState;
  onRowClick: (row: LeaveRow, event: React.MouseEvent) => void;
  cancelRequest: (id: number) => void | Promise<void>;
};

function RequestsTableView({
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
                  className={selection.someSelected ? "data-[state=checked]:bg-indigo-600" : ""}
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
                className="text-center text-sm text-red-600 py-12"
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
                    isSelected && "bg-indigo-50 dark:bg-indigo-900/20",
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

type RequestsCardViewProps = {
  rows: LeaveRow[];
  filter: FilterStatus;
  isLoading: boolean;
  error: Error | undefined;
  enableSelection: boolean;
  selection: SelectionState;
  onRowClick: (row: LeaveRow, event: React.MouseEvent) => void;
  onOpenDetails: (row: LeaveRow) => void;
  cancelRequest: (id: number) => void | Promise<void>;
};

function RequestsCardView({
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
      <div className="text-center text-sm text-red-600 py-12" role="alert">
        Failed to load
      </div>
    );
  }

  if (rows.length === 0) {
    return (
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
    );
  }

  return (
    <>
      {rows.map((row) => {
        const dateRange = `${formatDate(row.startDate)} → ${formatDate(row.endDate)}`;
        const ariaLabel = `Leave request: ${
          leaveTypeLabel[row.type] ?? row.type
        }, ${row.workingDays} days, ${dateRange}, ${row.status.toLowerCase()}`;
        const isSelected = enableSelection && selection.isSelected(row.id);

        return (
          <div
            key={row.id}
            className={clsx(
              "rounded-lg border border-border bg-card p-4 space-y-3 cursor-pointer",
              "hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors",
              isSelected && "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20",
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
                  <h3 className="font-semibold text-sm truncate">{leaveTypeLabel[row.type] ?? row.type}</h3>
                  <StatusBadge status={row.status} />
                </div>
                <p className="text-xs text-muted-foreground mb-1">{dateRange}</p>
                <p className="text-xs font-medium text-muted-foreground">
                  {row.workingDays} day{row.workingDays !== 1 ? "s" : ""}
                </p>
              </div>
              {enableSelection && (
                <Checkbox
                  checked={selection.isSelected(row.id)}
                  onCheckedChange={(checked) => selection.selectRow(row.id, checked === true)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Select ${leaveTypeLabel[row.type] ?? row.type} request`}
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
                      aria-label={`Cancel ${leaveTypeLabel[row.type] ?? row.type} request`}
                    >
                      Cancel Request
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
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
