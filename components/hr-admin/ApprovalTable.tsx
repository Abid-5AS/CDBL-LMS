"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { CheckCircle, FilterX, Loader2 } from "lucide-react";

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

// Use shared TYPE_OPTIONS from constants
const TYPE_OPTIONS = LEAVE_TYPE_OPTIONS;

export function ApprovalTable({ onSelect, onDataChange }: ApprovalTableProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkApproving, setIsBulkApproving] = useState(false);

  // Dialog state management
  const [dialogState, setDialogState] = useState<{
    type: "reject" | "return" | null;
    itemId: string | null;
    employeeName: string | null;
  }>({ type: null, itemId: null, employeeName: null });
  const [returnComment, setReturnComment] = useState("");

  const { setSelection } = useSelectionContext();
  const user = useUser();
  const userRole = (user?.role as AppRole) || "EMPLOYEE";
  const isHRAdmin = userRole === "HR_ADMIN";

  // Update selection count when selectedIds changes
  useEffect(() => {
    setSelection(selectedIds);
    return () => setSelection([]);
  }, [selectedIds, setSelection]);

  const { data, error, isLoading, mutate } = useSWR<ApprovalsResponse>(
    "/api/approvals",
    apiFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  const allItems = useMemo(
    () => (Array.isArray(data?.items) ? data!.items : []),
    [data]
  );

  const items = useMemo(() => {
    let filtered = allItems;

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
    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((item) => item.type === typeFilter);
    }

    return filtered;
  }, [allItems, searchQuery, statusFilter, typeFilter]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
  }, []);

  useEffect(() => {
    if (onDataChange) {
      onDataChange(items);
    }
  }, [items, onDataChange]);

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

  // Execute decision after confirmation
  const executeDecision = useCallback(async (
    id: string,
    action: "approve" | "reject" | "forward" | "return",
    comment?: string
  ) => {
    if (processingId) return; // Prevent multiple simultaneous actions

    try {
      setProcessingId(id + action);

      // Optimistically remove item from UI
      const optimisticUpdate = (currentData: ApprovalsResponse | undefined) => {
        if (!currentData) return currentData;
        return {
          ...currentData,
          items: currentData.items.filter((item) => item.id !== id),
        };
      };

      // Apply optimistic update
      mutate(optimisticUpdate, false);

      if (action === "forward") {
        await apiPost(`/api/leaves/${id}/forward`, {});
        toast.success("Request forwarded successfully");
      } else if (action === "return") {
        if (!comment || comment.length < 5) {
          toast.error("Comment must be at least 5 characters");
          setProcessingId(null);
          // Revert optimistic update
          await mutate();
          return;
        }
        await apiPost(`/api/leaves/${id}/return`, { comment });
        toast.success("Request returned for modification");
      } else {
        // approve or reject
        await apiPost<{ ok: boolean; status: string }>(
          `/api/approvals/${id}/decision`,
          { action, comment: undefined }
        );
        toast.success(
          action === "approve"
            ? SUCCESS_MESSAGES.leave_approved
            : SUCCESS_MESSAGES.leave_rejected
        );
      }

      // Remove from selection if selected
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      // Close dialog after success
      closeDialog();

      // Revalidate all relevant caches
      await Promise.all([
        mutate(), // Revalidate approvals
        globalMutate("/api/balance/mine"), // Revalidate user balance (critical for UI consistency)
        globalMutate("/api/leaves?mine=1"), // Revalidate user's leaves
      ]);
    } catch (err) {
      const message =
        err instanceof Error
          ? getToastMessage(err.message, err.message)
          : getToastMessage("approval_failed", "Failed to update request");
      toast.error(message);

      // Revert optimistic update on error
      await mutate();
    } finally {
      setProcessingId(null);
    }
  }, [mutate, closeDialog, processingId]);

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
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(itemId);
      } else {
        next.delete(itemId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(items.map((item) => item.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [items]);

  const handleBulkApprove = useCallback(async () => {
    if (selectedIds.size === 0 || isBulkApproving) return;

    setIsBulkApproving(true);

    // Optimistically remove selected items from UI
    const optimisticUpdate = (currentData: ApprovalsResponse | undefined) => {
      if (!currentData) return currentData;
      return {
        ...currentData,
        items: currentData.items.filter((item) => !selectedIds.has(item.id)),
      };
    };

    // Apply optimistic update
    mutate(optimisticUpdate, false);

    try {
      const ids = Array.from(selectedIds).map(Number);
      const response = await apiPost<{ success: boolean; approved: number; failed: number }>("/api/leaves/bulk/approve", { ids });

      if (response.success) {
        toast.success(
          `Successfully approved ${response.approved} leave request(s)`,
          {
            description:
              response.failed > 0
                ? `${response.failed} request(s) could not be approved`
                : undefined,
          }
        );
        setSelectedIds(new Set());

        // Revalidate all relevant caches
        await Promise.all([
          mutate(), // Revalidate approvals
          globalMutate("/api/balance/mine"), // Revalidate user balance
          globalMutate("/api/leaves?mine=1"), // Revalidate user's leaves
        ]);
      } else {
        throw new Error("Bulk approve failed");
      }
    } catch (error) {
      console.error("Bulk approve error:", error);
      toast.error("Failed to approve selected leave requests");

      // Revert optimistic update on error
      await mutate();
    } finally {
      setIsBulkApproving(false);
    }
  }, [selectedIds, mutate, isBulkApproving]);

  const allSelected = items.length > 0 && selectedIds.size === items.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < items.length;

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

  if (!items.length && allItems.length === 0) {
    return (
      <Card className={cn(glassCard.elevated, "rounded-2xl")}>
        <CardContent>
          <EmptyState
            icon={CheckCircle}
            title="No pending requests"
            description="You are all caught up! There are currently no leave requests awaiting approval."
            action={{
              label: "View Past Approvals",
              href: "/approvals?status=APPROVED",
            }}
            className="py-8"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by employee, type, reason, or date..."
        statusFilter={{
          value: statusFilter,
          onChange: setStatusFilter,
          options: STATUS_OPTIONS,
        }}
        typeFilter={{
          value: typeFilter,
          onChange: setTypeFilter,
          options: TYPE_OPTIONS,
        }}
        onClear={clearFilters}
      />

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
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
                disabled={isBulkApproving}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md",
                  neoButton.success
                )}
              >
                {isBulkApproving ? (
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
                onClick={() => setSelectedIds(new Set())}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Clear selection
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {items.length === 0 && allItems.length > 0 ? (
        <Card className={cn(glassCard.elevated, "rounded-2xl")}>
          <CardContent>
            <EmptyState
              icon={FilterX}
              title="No matching requests"
              description="No leave requests match your current filter criteria. Try adjusting your search or clearing filters."
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
                  <ModernTable.Head>Employee</ModernTable.Head>
                  <ModernTable.Head>Type</ModernTable.Head>
                  <ModernTable.Head>Dates</ModernTable.Head>
                  <ModernTable.Head>Days</ModernTable.Head>
                  <ModernTable.Head>Reason</ModernTable.Head>
                  <ModernTable.Head>Stage</ModernTable.Head>
                  <ModernTable.Head className="text-right">Actions</ModernTable.Head>
                </ModernTable.Row>
              </ModernTable.Header>
              <ModernTable.Body>
                {items.map((item) => {
                  const start = formatDate(item.start);
                  const end = formatDate(item.end);
                  const stage =
                    item.approvals?.[item.currentStageIndex]?.status ??
                    item.status;
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
                            disabled={processingId !== null}
                            loading={processingId !== null}
                            loadingAction={
                              processingId?.startsWith(item.id)
                                ? (processingId.replace(
                                    item.id,
                                    ""
                                  ) as ApprovalAction)
                                : null
                            }
                          />
                        </div>
                      </ModernTable.Cell>
                    </ModernTable.Row>
                  );
                })}
              </ModernTable.Body>
            </ModernTable>
      )}
      {items.length !== allItems.length && allItems.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {items.length} of {allItems.length} requests
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
    </div>
  );
}
