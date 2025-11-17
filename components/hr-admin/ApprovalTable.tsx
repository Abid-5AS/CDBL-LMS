"use client";

import { useCallback, useEffect, useMemo, useState, useOptimistic, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import useSWR, { mutate as globalMutate } from "swr";
import { toast } from "sonner";
import clsx from "clsx";

// UI Components (barrel export)
import {
  Card,
  CardContent,
  ModernTable,
  Checkbox,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Textarea,
} from "@/components/ui";
import { CheckCircle, FilterX, Loader2, XCircle } from "lucide-react";

// Shared Components (barrel export)
import { FilterBar, ApprovalActionButtons, EmptyState } from "@/components/shared";
import type { ApprovalAction } from "@/components/shared";

// Lib utilities (barrel export)
import {
  formatDate,
  leaveTypeLabel,
  SUCCESS_MESSAGES,
  getToastMessage,
  useUser,
} from "@/lib";
import type { AppRole } from "@/lib/rbac";
import { LEAVE_TYPE_OPTIONS } from "@/lib/constants";
import { glassCard, neoButton, neoInput } from "@/lib/neo-design";
import { cn } from "@/lib/utils";

// Local imports
import { HRApprovalItem } from "./types";
import { useSelectionContext } from "@/lib/selection-context";
import { apiFetcher, apiPost } from "@/lib/apiClient";

// Server Actions
import {
  forwardLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  returnLeaveForModification,
  bulkApproveLeaveRequests,
  bulkRejectLeaveRequests,
} from "@/app/actions/leave-actions";

type ApprovalsResponse = { items: HRApprovalItem[] };

type ApprovalTableProps = {
  onSelect?: (item: HRApprovalItem) => void;
  onDataChange?: (items: HRApprovalItem[]) => void;
};

function statusStyle(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === "APPROVED") return "bg-data-success";
  if (normalized === "REJECTED") return "bg-data-error";
  return "hover:bg-bg-secondary";
}

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "SUBMITTED", label: "Submitted" },
];

const HISTORY_STATUS_OPTIONS = [
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "FORWARDED", label: "Forwarded" },
];

type HistoryDecision = "ALL" | "APPROVED" | "REJECTED" | "FORWARDED";

// Use shared TYPE_OPTIONS from constants
const TYPE_OPTIONS = LEAVE_TYPE_OPTIONS;

export function ApprovalTable({ onSelect, onDataChange }: ApprovalTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const initialViewMode = searchParams.get("view") === "history" ? "history" : "queue";
  const initialHistoryDecision = (searchParams.get("decision") || "ALL").toUpperCase();
  const validHistoryValues = ["ALL", ...HISTORY_STATUS_OPTIONS.map((opt) => opt.value)];
  const [viewMode, setViewMode] = useState<"queue" | "history">(initialViewMode);
  const [historyDecision, setHistoryDecision] = useState<HistoryDecision>(
    validHistoryValues.includes(initialHistoryDecision)
      ? (initialHistoryDecision as HistoryDecision)
      : "ALL"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [queueStatusFilter, setQueueStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const statusFilterValue =
    viewMode === "history"
      ? historyDecision === "ALL"
        ? "all"
        : historyDecision
      : queueStatusFilter;

  // Dialog state management
  const [dialogState, setDialogState] = useState<{
    type: "reject" | "return" | null;
    itemId: string | null;
    employeeName: string | null;
  }>({ type: null, itemId: null, employeeName: null });
  const [returnComment, setReturnComment] = useState("");
  const [showBulkRejectDialog, setShowBulkRejectDialog] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState("");

  const { setSelection } = useSelectionContext();
  const user = useUser();
  const userRole = (user?.role as AppRole) || "EMPLOYEE";
  const isHRAdmin = userRole === "HR_ADMIN";

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (viewMode === "history") {
      params.set("view", "history");
      params.set("decision", historyDecision);
    } else {
      params.delete("view");
      params.delete("decision");
    }
    const next = params.toString();
    const current = searchParams.toString();
    if (next !== current) {
      const suffix = next ? `?${next}` : "";
      router.replace(`${pathname}${suffix}`, { scroll: false });
    }
  }, [historyDecision, viewMode, router, searchParams, pathname]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [viewMode]);

  // Update selection count when selectedIds changes
  useEffect(() => {
    setSelection(selectedIds);
    return () => setSelection([]);
  }, [selectedIds, setSelection]);

  const cacheKey =
    viewMode === "history"
      ? `/api/approvals/history?decision=${historyDecision}`
      : "/api/approvals";

  const { data, error, isLoading, mutate } = useSWR<ApprovalsResponse>(
    cacheKey,
    apiFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  // React 19 useOptimistic for instant UI updates
  const [optimisticItems, setOptimisticItems] = useOptimistic(
    data?.items ?? [],
    (state: HRApprovalItem[], removedId: string) => {
      return state.filter((item) => item.id !== removedId);
    }
  );

  // useTransition for Server Actions
  const [isPending, startTransition] = useTransition();

  const baseItems = data?.items ?? [];
  const displayedItems = useMemo(
    () => (viewMode === "history" ? baseItems : optimisticItems),
    [viewMode, baseItems, optimisticItems]
  );

  const items = useMemo(() => {
    let filtered = displayedItems;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.requestedByName?.toLowerCase().includes(query) ||
          item.requestedByEmail?.toLowerCase().includes(query) ||
          item.type.toLowerCase().includes(query) ||
          (leaveTypeLabel[item.type]?.toLowerCase().includes(query) ?? false) ||
          item.reason?.toLowerCase().includes(query) ||
          formatDate(item.start).toLowerCase().includes(query) ||
          formatDate(item.end).toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilterValue !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilterValue);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((item) => item.type === typeFilter);
    }

    return filtered;
  }, [displayedItems, searchQuery, statusFilterValue, typeFilter]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setQueueStatusFilter("all");
    setHistoryDecision("ALL");
    setTypeFilter("all");
  }, []);

  const handleStatusFilterChange = useCallback(
    (next: string) => {
      if (viewMode === "history") {
        setHistoryDecision(next === "all" ? "ALL" : (next as HistoryDecision));
      } else {
        setQueueStatusFilter(next);
      }
    },
    [viewMode]
  );

  useEffect(() => {
    if (onDataChange) {
      onDataChange(viewMode === "queue" ? items : []);
    }
  }, [items, onDataChange, viewMode]);

  // Open confirmation dialog for destructive actions
  const openConfirmDialog = useCallback((
    id: string,
    action: "reject" | "return",
    employeeName: string
  ) => {
    setDialogState({ type: action, itemId: id, employeeName });
    if (action === "return") {
      setReturnComment(""); // Reset comment field
    }
  }, []);

  // Close dialog and reset state
  const closeDialog = useCallback(() => {
    setDialogState({ type: null, itemId: null, employeeName: null });
    setReturnComment("");
  }, []);

  // Execute decision using Server Actions with useTransition
  const executeDecision = useCallback(async (
    id: string,
    action: "approve" | "reject" | "forward" | "return",
    comment?: string
  ) => {
    if (viewMode !== "queue") return;
    // Instant UI update with useOptimistic
    setOptimisticItems(id);

    // Remove from selection immediately
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    // Close dialog immediately
    closeDialog();

    // Execute Server Action with useTransition
    startTransition(async () => {
      let result;

      try {
        const numericId = Number(id);

        if (action === "forward") {
          result = await forwardLeaveRequest(numericId);
          if (result.success) {
            toast.success("Request forwarded successfully");
          }
        } else if (action === "return") {
          if (!comment || comment.length < 5) {
            toast.error("Comment must be at least 5 characters");
            // Revert optimistic update
            await mutate();
            return;
          }
          result = await returnLeaveForModification(numericId, comment);
          if (result.success) {
            toast.success("Request returned for modification");
          }
        } else if (action === "approve") {
          result = await approveLeaveRequest(numericId, comment);
          if (result.success) {
            toast.success(SUCCESS_MESSAGES.leave_approved);
          }
        } else if (action === "reject") {
          result = await rejectLeaveRequest(numericId, comment);
          if (result.success) {
            toast.success(SUCCESS_MESSAGES.leave_rejected);
          }
        }

        if (result && !result.success) {
          toast.error(result.error || "Failed to update request");
          // Revert optimistic update on error
          await mutate();
        }

        // Server Actions auto-revalidate via revalidatePath
        // But we still revalidate SWR cache for consistency
        await mutate();
      } catch (err) {
        const message =
          err instanceof Error
            ? getToastMessage(err.message, err.message)
            : getToastMessage("approval_failed", "Failed to update request");
        toast.error(message);

        // Revert optimistic update on error
        await mutate();
      }
    });
  }, [setOptimisticItems, closeDialog, startTransition, mutate, viewMode]);

  // Handle decision routing - open dialog for destructive actions
  const handleDecision = useCallback(async (
    id: string,
    action: "approve" | "reject" | "forward" | "return",
    employeeName: string = "this employee"
  ) => {
    // Destructive actions require confirmation
    if (action === "reject" || action === "return") {
      openConfirmDialog(id, action, employeeName);
      return;
    }

    // Non-destructive actions execute immediately
    await executeDecision(id, action);
  }, [openConfirmDialog, executeDecision]);

  const handleSelectRow = useCallback((itemId: string, checked: boolean) => {
    if (viewMode !== "queue") return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(itemId);
      } else {
        next.delete(itemId);
      }
      return next;
    });
  }, [viewMode]);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (viewMode !== "queue") return;
    if (checked) {
      setSelectedIds(new Set(items.map((item) => item.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [items, viewMode]);

  const handleBulkApprove = useCallback(async () => {
    if (viewMode !== "queue") return;
    if (selectedIds.size === 0) return;

    // Optimistically remove selected items from UI
    selectedIds.forEach((id) => setOptimisticItems(id));

    // Clear selection immediately
    setSelectedIds(new Set());

    // Execute Server Action with useTransition
    startTransition(async () => {
      try {
        const ids = Array.from(selectedIds).map(Number);
        const result = await bulkApproveLeaveRequests(ids);

        if (result.success) {
          toast.success(
            `Successfully approved ${result.approved} leave request(s)`,
            {
              description:
                result.failed > 0
                  ? `${result.failed} request(s) could not be approved`
                  : undefined,
            }
          );

          // Server Actions auto-revalidate, but refresh SWR cache too
          await mutate();
        } else {
          toast.error(result.error || "Failed to approve selected requests");
          // Revert optimistic update on error
          await mutate();
        }
      } catch (error) {
        console.error("Bulk approve error:", error);
        toast.error("Failed to approve selected leave requests");

        // Revert optimistic update on error
        await mutate();
      }
    });
  }, [selectedIds, setOptimisticItems, startTransition, mutate, viewMode]);

  const handleBulkReject = useCallback(async () => {
    if (viewMode !== "queue") return;
    if (selectedIds.size === 0 || !bulkRejectReason.trim() || bulkRejectReason.trim().length < 5) {
      toast.error("Please provide a rejection reason (minimum 5 characters)");
      return;
    }

    // Optimistically remove selected items from UI
    selectedIds.forEach((id) => setOptimisticItems(id));

    // Clear selection immediately
    const idsToReject = Array.from(selectedIds);
    setSelectedIds(new Set());
    setShowBulkRejectDialog(false);
    setBulkRejectReason("");

    // Execute Server Action with useTransition
    startTransition(async () => {
      try {
        const ids = idsToReject.map(Number);
        const result = await bulkRejectLeaveRequests(ids, bulkRejectReason.trim());

        if (result.success) {
          toast.success(
            `Successfully rejected ${result.rejected} leave request${result.rejected > 1 ? "s" : ""}` +
            (result.failed > 0 ? `. ${result.failed} failed.` : "")
          );

          // Revalidate data
          await mutate();
        } else {
          toast.error(result.error || "Failed to reject selected leave requests");

          // Revert optimistic update on error
          await mutate();
        }
      } catch (error) {
        console.error("Bulk reject error:", error);
        toast.error("Failed to reject selected leave requests");

        // Revert optimistic update on error
        await mutate();
      }
    });
  }, [selectedIds, bulkRejectReason, setOptimisticItems, startTransition, mutate, viewMode]);

  const allSelected =
    viewMode === "queue" && items.length > 0 && selectedIds.size === items.length;
  const someSelected =
    viewMode === "queue" && selectedIds.size > 0 && selectedIds.size < items.length;

  if (isLoading) {
    return (
      <Card className={cn(glassCard.elevated, "rounded-2xl")}>
        <CardContent>
          <EmptyState
            icon={Loader2}
            title="Loading approval queue..."
            description="Fetching pending leave requests"
            className="py-8"
          />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn(glassCard.elevated, "rounded-2xl")}>
        <CardContent>
          <EmptyState
            title="Unable to load approvals"
            description="There was an error loading the approval queue. Please refresh the page or try again later."
            action={{
              label: "Refresh Page",
              onClick: () => window.location.reload(),
            }}
            className="py-8"
          />
        </CardContent>
      </Card>
    );
  }

  if (!items.length && displayedItems.length === 0) {
    return (
      <Card className={cn(glassCard.elevated, "rounded-2xl")}>
        <CardContent>
          <EmptyState
            icon={CheckCircle}
            title={viewMode === "history" ? "No past approvals" : "No pending requests"}
            description={
              viewMode === "history"
                ? "You have not processed any approvals with the current filters."
                : "You are all caught up! There are currently no leave requests awaiting approval."
            }
            action={
              viewMode === "history"
                ? undefined
                : {
                    label: "View Past Approvals",
                    href: "/approvals?view=history",
                  }
            }
            className="py-8"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-border bg-card/80 p-1">
          {[
            { value: "queue", label: "My Queue" },
            { value: "history", label: "Past Decisions" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setViewMode(option.value as "queue" | "history")}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-full transition focus-ring",
                viewMode === option.value
                  ? "bg-card-action text-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-pressed={viewMode === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          {viewMode === "history"
            ? "Decisions reflect your last 100 actions."
            : "Only requests awaiting your action appear here."}
        </p>
      </div>
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by employee, type, reason, or date..."
        statusFilter={{
          value: statusFilterValue,
          onChange: handleStatusFilterChange,
          options: viewMode === "history" ? HISTORY_STATUS_OPTIONS : STATUS_OPTIONS,
        }}
        typeFilter={{
          value: typeFilter,
          onChange: setTypeFilter,
          options: TYPE_OPTIONS,
        }}
        onClear={clearFilters}
      />

      {/* Bulk Actions Bar */}
      {viewMode === "queue" && selectedIds.size > 0 && (
        <Card className={cn(glassCard.elevated, "rounded-2xl bg-primary/5 border-primary/20")}>
          <CardContent className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={true}
                onCheckedChange={() => setSelectedIds(new Set())}
                className="data-[state=checked]:bg-primary"
              />
              <span className="text-sm font-medium">
                {selectedIds.size} leave request{selectedIds.size > 1 ? "s" : ""} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkApprove}
                disabled={isPending}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md",
                  neoButton.success
                )}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Approve Selected
                  </>
                )}
              </button>
              <button
                onClick={() => setShowBulkRejectDialog(true)}
                disabled={isPending}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md",
                  "bg-red-600 text-white hover:bg-red-700 transition-colors"
                )}
              >
                <XCircle className="h-4 w-4" />
                Reject Selected
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Clear selection
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {items.length === 0 && displayedItems.length > 0 ? (
        <Card className={cn(glassCard.elevated, "rounded-2xl")}>
          <CardContent>
            <EmptyState
              icon={FilterX}
              title={viewMode === "history" ? "No matching decisions" : "No matching requests"}
              description={
                viewMode === "history"
                  ? "No past approvals match your current filters. Adjust the status or search term."
                  : "No leave requests match your current filter criteria. Try adjusting your search or clearing filters."
              }
              action={{
                label: "Clear All Filters",
                onClick: clearFilters,
              }}
              className="py-8"
            />
          </CardContent>
        </Card>
      ) : (
            <ModernTable>
              <ModernTable.Header>
                <ModernTable.Row>
                  {viewMode === "queue" && (
                    <ModernTable.Head className="w-12">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={(checked) =>
                          handleSelectAll(checked === true)
                        }
                        aria-label="Select all rows"
                        className={
                          someSelected
                            ? "data-[state=checked]:bg-card-action"
                            : ""
                        }
                      />
                    </ModernTable.Head>
                  )}
                  <ModernTable.Head>Employee</ModernTable.Head>
                  <ModernTable.Head>Type</ModernTable.Head>
                  <ModernTable.Head>Dates</ModernTable.Head>
                  <ModernTable.Head>Days</ModernTable.Head>
                  <ModernTable.Head>Reason</ModernTable.Head>
                  {viewMode === "queue" ? (
                    <>
                      <ModernTable.Head>Stage</ModernTable.Head>
                      <ModernTable.Head className="text-right">
                        Actions
                      </ModernTable.Head>
                    </>
                  ) : (
                    <>
                      <ModernTable.Head>Decision</ModernTable.Head>
                      <ModernTable.Head>Processed On</ModernTable.Head>
                    </>
                  )}
                </ModernTable.Row>
              </ModernTable.Header>
              <ModernTable.Body>
                {items.map((item) => {
                  const start = formatDate(item.start);
                  const end = formatDate(item.end);
                  const stage =
                    item.approvals?.[item.currentStageIndex]?.status ??
                    item.status;
                  const decisionMeta = item.approvals?.[0];
                  return (
                    <ModernTable.Row
                      key={item.id}
                      className={clsx(
                        "cursor-pointer transition",
                        statusStyle(item.status),
                        selectedIds.has(item.id) &&
                          "bg-card-action dark:bg-card-action/20"
                      )}
                      onClick={(e) => {
                        // Don't trigger onSelect if clicking on checkbox
                        if (
                          !(e.target as HTMLElement).closest(
                            'input[type="checkbox"]'
                          )
                        ) {
                          onSelect?.(item);
                        }
                      }}
                    >
                      {viewMode === "queue" && (
                        <ModernTable.Cell>
                          <Checkbox
                            checked={selectedIds.has(item.id)}
                            onCheckedChange={(checked) =>
                              handleSelectRow(item.id, checked === true)
                            }
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Select row ${item.id}`}
                          />
                        </ModernTable.Cell>
                      )}
                      <ModernTable.Cell>
                        <div className="font-medium text-text-primary">
                          {item.requestedByName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.requestedByEmail ?? "—"}
                        </div>
                      </ModernTable.Cell>
                      <ModernTable.Cell className="text-sm text-text-secondary">
                        {leaveTypeLabel[item.type] ?? item.type}
                      </ModernTable.Cell>
                      <ModernTable.Cell className="text-sm text-text-secondary">
                        <div>{start}</div>
                        {start !== end && (
                          <div className="text-xs text-muted-foreground">
                            to {end}
                          </div>
                        )}
                      </ModernTable.Cell>
                      <ModernTable.Cell className="text-sm text-text-secondary">
                        {item.requestedDays}
                      </ModernTable.Cell>
                      <ModernTable.Cell className="max-w-xs text-sm text-text-secondary">
                        <p className="whitespace-pre-wrap wrap-break-word">
                          {item.reason}
                        </p>
                      </ModernTable.Cell>
                      {viewMode === "queue" ? (
                        <>
                          <ModernTable.Cell className="text-sm font-medium capitalize text-text-secondary">
                            {stage.toLowerCase()}
                          </ModernTable.Cell>
                          <ModernTable.Cell className="text-right">
                            <div
                              className="flex justify-end"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ApprovalActionButtons
                                ceoMode={userRole === "CEO" || userRole === "HR_HEAD"}
                                onForward={
                                  userRole === "HR_ADMIN" || userRole === "DEPT_HEAD"
                                    ? () => handleDecision(item.id, "forward", item.requestedByName || undefined)
                                    : undefined
                                }
                                onReturn={
                                  userRole === "HR_ADMIN" || userRole === "DEPT_HEAD"
                                    ? () => handleDecision(item.id, "return", item.requestedByName || undefined)
                                    : undefined
                                }
                                onCancel={() => handleDecision(item.id, "reject", item.requestedByName || undefined)}
                                onApprove={
                                  userRole === "CEO" || userRole === "HR_HEAD"
                                    ? () => handleDecision(item.id, "approve", item.requestedByName || undefined)
                                    : undefined
                                }
                                disabled={isPending}
                                loading={isPending}
                                loadingAction={null}
                              />
                            </div>
                          </ModernTable.Cell>
                        </>
                      ) : (
                        <>
                          <ModernTable.Cell className="text-sm font-semibold capitalize text-text-secondary">
                            {item.status.toLowerCase()}
                          </ModernTable.Cell>
                          <ModernTable.Cell className="text-sm text-text-secondary">
                            {decisionMeta?.decidedAt
                              ? formatDate(decisionMeta.decidedAt)
                              : "—"}
                          </ModernTable.Cell>
                        </>
                      )}
                    </ModernTable.Row>
                  );
                })}
              </ModernTable.Body>
            </ModernTable>
      )}
      {items.length !== displayedItems.length && displayedItems.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {items.length} of {displayedItems.length}{" "}
          {viewMode === "history" ? "decisions" : "requests"}
        </p>
      )}

      {/* Reject Confirmation Dialog */}
      <AlertDialog
        open={dialogState.type === "reject"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <AlertDialogContent className={cn(glassCard.elevated, "rounded-2xl")}>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Leave Request?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject the leave request from{" "}
              <strong>{dialogState.employeeName}</strong>? This action cannot be undone,
              and the employee will be notified of the rejection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDialog} className={neoButton.glass}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (dialogState.itemId) {
                  executeDecision(dialogState.itemId, "reject");
                }
              }}
              className={cn(neoButton.danger, "bg-destructive text-destructive-foreground hover:bg-destructive/90")}
            >
              Reject Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Return for Modification Dialog */}
      <AlertDialog
        open={dialogState.type === "return"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <AlertDialogContent className={cn(glassCard.elevated, "rounded-2xl")}>
          <AlertDialogHeader>
            <AlertDialogTitle>Return for Modification</AlertDialogTitle>
            <AlertDialogDescription>
              Return the leave request from{" "}
              <strong>{dialogState.employeeName}</strong> for revision. The
              employee will be able to resubmit after making changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label
              htmlFor="return-comment"
              className="text-sm font-medium text-foreground mb-2 block"
            >
              Reason for Return <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="return-comment"
              value={returnComment}
              onChange={(e) => setReturnComment(e.target.value)}
              placeholder="Please provide a clear reason for returning this request (minimum 5 characters)..."
              className={cn("min-h-[100px]", neoInput.base)}
              aria-required="true"
              aria-describedby="return-comment-error"
            />
            {returnComment.length > 0 && returnComment.length < 5 && (
              <p
                id="return-comment-error"
                className="text-xs text-destructive mt-1"
                role="alert"
              >
                Comment must be at least 5 characters
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDialog} className={neoButton.glass}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (dialogState.itemId && returnComment.length >= 5) {
                  executeDecision(dialogState.itemId, "return", returnComment);
                }
              }}
              disabled={returnComment.length < 5}
              className="bg-warning text-warning-foreground hover:bg-warning/90"
            >
              Return Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Reject Dialog */}
      <AlertDialog
        open={showBulkRejectDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowBulkRejectDialog(false);
            setBulkRejectReason("");
          }
        }}
      >
        <AlertDialogContent className={cn(glassCard.elevated, "rounded-2xl")}>
          <AlertDialogHeader>
            <AlertDialogTitle>Bulk Reject Leave Requests?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to reject <strong>{selectedIds.size}</strong> leave request
              {selectedIds.size > 1 ? "s" : ""}. This action cannot be undone, and all
              affected employees will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label
              htmlFor="bulk-reject-reason"
              className="text-sm font-medium text-foreground block mb-2"
            >
              Rejection Reason <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="bulk-reject-reason"
              value={bulkRejectReason}
              onChange={(e) => setBulkRejectReason(e.target.value)}
              placeholder="Provide a detailed reason for rejecting these leave requests..."
              className={cn(neoInput.glass, "min-h-[100px]")}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum 5 characters required. {bulkRejectReason.length}/500
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowBulkRejectDialog(false);
                setBulkRejectReason("");
              }}
              className={neoButton.glass}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkReject}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!bulkRejectReason.trim() || bulkRejectReason.trim().length < 5}
            >
              Reject All Selected
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
