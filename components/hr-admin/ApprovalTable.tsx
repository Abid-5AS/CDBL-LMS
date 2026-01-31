"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useOptimistic,
  useTransition,
} from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import useSWR, { mutate as globalMutate } from "swr";
import { toast } from "sonner";
import clsx from "clsx";

// UI Components (barrel export)
import {
  Card,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui";
import { CheckCircle, FilterX, Loader2, XCircle, MoreHorizontal, Forward, RotateCcw, Clock, History, FileCheck, Ban } from "lucide-react";

// Shared Components (barrel export)
import {
  FilterBar,
  ApprovalActionButtons,
  EmptyState,
} from "@/components/shared";
import type { ApprovalAction } from "@/components/shared";

// Lib utilities (barrel export)
import {
  formatDate,
  leaveTypeLabel,
  SUCCESS_MESSAGES,
  getToastMessage,
  useUser,
} from "@/lib";
import { usePendingRequests } from "@/components/dashboards/dept-head/hooks/usePendingRequests";
import { isFinalApprover } from "@/lib/workflow";
import type { AppRole } from "@/lib/rbac";
import { LEAVE_TYPE_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

// Local imports
import { HRApprovalItem } from "./types";
import { useSelectionContext } from "@/components/providers";
import { apiFetcher, apiPost } from "@/lib/apiClient";
import EnhancedSmoothTab from "@/components/ui/enhanced-smooth-tab";

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
  if (normalized === "APPROVED") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  if (normalized === "REJECTED") return "bg-red-500/15 text-red-700 dark:text-red-400";
  return "hover:bg-muted/50";
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

// Defining tabs configuration
const TABS = [
  {
    id: "queue",
    title: "Pending",
    icon: Clock,
    color: "bg-blue-500",
  },
  {
    id: "approved",
    title: "Approved",
    icon: FileCheck,
    color: "bg-emerald-500",
  },
  {
    id: "rejected",
    title: "Rejected",
    icon: Ban,
    color: "bg-red-500",
  },
  {
    id: "history",
    title: "All History",
    icon: History,
    color: "bg-zinc-500",
  },
];

export function ApprovalTable({ onSelect, onDataChange }: ApprovalTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const initialViewMode =
    searchParams.get("view") === "history" ? "history" : "queue";
  const initialHistoryDecision = (
    searchParams.get("decision") || "ALL"
  ).toUpperCase();
  const validHistoryValues = [
    "ALL",
    ...HISTORY_STATUS_OPTIONS.map((opt) => opt.value),
  ];
  const [viewMode, setViewMode] = useState<"queue" | "history">(
    initialViewMode
  );
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

  // Derive active tab based on viewMode and historyDecision
  const activeTabId = useMemo(() => {
    if (viewMode === "queue") return "queue";
    if (historyDecision === "APPROVED") return "approved";
    if (historyDecision === "REJECTED") return "rejected";
    return "history";
  }, [viewMode, historyDecision]);

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
    return () => {
      // No specific cleanup needed
    };
  }, [viewMode]);

  // Update selection count when selectedIds changes
  useEffect(() => {
    setSelection(selectedIds);
    return () => setSelection([]);
  }, [selectedIds, setSelection]);

  // Handle tab change
  const handleTabChange = useCallback((tabId: string) => {
    if (tabId === "queue") {
      setViewMode("queue");
      setHistoryDecision("ALL");
    } else if (tabId === "approved") {
      setViewMode("history");
      setHistoryDecision("APPROVED");
    } else if (tabId === "rejected") {
      setViewMode("history");
      setHistoryDecision("REJECTED");
    } else {
      setViewMode("history");
      setHistoryDecision("ALL");
    }
    // Clear selection when switching tabs
    setSelectedIds(new Set());
  }, []);

  // Use the shared hook for fetching requests
  const {
    requests: hookRequests,
    isLoading: isHookLoading,
    error: hookError,
    refresh: refreshHook
  } = usePendingRequests({
    autoFetch: true,
    initialFilters: {
      status: viewMode === 'queue' ? (queueStatusFilter === "all" ? "PENDING" : queueStatusFilter) : undefined
    }
  });

  const cacheKey = useMemo(() => {
    if (viewMode === "history") {
      return `/api/approvals/history?decision=${historyDecision}`;
    }
    return null;
  }, [viewMode, historyDecision]);

  const { data: historyData, error: historyError, isLoading: isHistoryLoading, mutate: mutateHistory } = useSWR<any>(
    cacheKey,
    apiFetcher
  );

  // Normalize data
  const data = useMemo(() => {
    if (viewMode === 'queue') {
      return {
        items: hookRequests.map(req => ({
          id: String(req.id),
          type: req.type as any,
          status: req.status,
          reason: req.reason,
          start: req.startDate,
          end: req.endDate,
          workingDays: req.workingDays,
          requestedDays: req.workingDays, // Add requestedDays
          requestedByName: req.requester.name,
          requestedByEmail: req.requester.email,
          requestedById: String(req.requester.id),
          requestedByRole: (req.requester as any).role as any, // Add requestedByRole
          requestedAt: '',
          approvals: [],
          currentStageIndex: 0,
          isCancellationRequest: (req as any).isCancellationRequest || false, // Ensure defaults
          isModified: (req as any).isModified || false, // Ensure defaults
        })) as HRApprovalItem[]
      };
    }

    if (!historyData) return { items: [] };
    if ('items' in historyData) return historyData;
    return { items: [] };
  }, [viewMode, hookRequests, historyData]);

  const isLoading = viewMode === 'queue' ? isHookLoading : isHistoryLoading;
  const error = viewMode === 'queue' ? hookError : historyError;
  const mutate = async () => {
    if (viewMode === 'queue') await refreshHook();
    else await mutateHistory();
  };

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
        (item: HRApprovalItem) =>
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
      filtered = filtered.filter((item: HRApprovalItem) => item.status === statusFilterValue);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((item: HRApprovalItem) => item.type === typeFilter);
    }

    return filtered;
  }, [displayedItems, searchQuery, statusFilterValue, typeFilter]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setQueueStatusFilter("all");
    setHistoryDecision("ALL");
    setTypeFilter("all");
    // Also reset back to queue tab if deeper in filtering history? No, user might just want to clear filters on current tab.
    // Keeping current tab logic.
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
    return () => {
      // No specific cleanup needed
    };
  }, [items, onDataChange, viewMode]);

  // Open confirmation dialog for destructive actions
  const openConfirmDialog = useCallback(
    (id: string, action: "reject" | "return", employeeName: string) => {
      setDialogState({ type: action, itemId: id, employeeName });
      if (action === "return") {
        setReturnComment(""); // Reset comment field
      }
    },
    []
  );

  // Close dialog and reset state
  const closeDialog = useCallback(() => {
    setDialogState({ type: null, itemId: null, employeeName: null });
    setReturnComment("");
  }, []);

  // Execute decision using Server Actions with useTransition
  const executeDecision = useCallback(
    async (
      id: string,
      action: "approve" | "reject" | "forward" | "return",
      comment?: string
    ) => {
      if (viewMode !== "queue") return;

      // Wrap all state updates in startTransition
      startTransition(() => {
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
      });

      // Handle Offline Action
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const { queueSyncAction } = await import("@/lib/offline/db");

        const actionType =
          action === "approve" ? "APPROVE_LEAVE" :
            action === "reject" ? "REJECT_LEAVE" :
              action === "forward" ? "FORWARD_LEAVE" :
                "RETURN_LEAVE";

        await queueSyncAction(actionType as any, { id: Number(id), comment });

        toast.success("You are offline. Action queued and will sync when online.");
        return;
      }

      // Execute Server Action
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
          } else if (result?.success) {
            // Force refresh ALL approval-related SWR caches across the app
            await globalMutate((key) =>
              typeof key === 'string' && (
                key.includes('/api/approvals') ||
                key.includes('/api/leaves') ||
                key.includes('/api/dashboard')
              ),
              undefined,
              { revalidate: true }
            );
          }

          // Refresh router cache for instant UI update
          router.refresh();
          // Also revalidate local SWR cache
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
    },
    [setOptimisticItems, closeDialog, startTransition, mutate, viewMode]
  );

  // Handle decision routing - open dialog for destructive actions
  const handleDecision = useCallback(
    async (
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
    },
    [openConfirmDialog, executeDecision]
  );

  const handleSelectRow = useCallback(
    (itemId: string, checked: boolean) => {
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
    },
    [viewMode]
  );

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (viewMode !== "queue") return;
      if (checked) {
        setSelectedIds(new Set(items.map((item: HRApprovalItem) => item.id)));
      } else {
        setSelectedIds(new Set());
      }
    },
    [items, viewMode]
  );

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
                (result.failed ?? 0) > 0
                  ? `${result.failed} request(s) could not be rejected`
                  : undefined,
            }
          );

          router.refresh();
          await mutate();
        } else {
          toast.error(result.error || "Failed to approve selected requests");
          await mutate();
        }
      } catch (error) {
        console.error("Bulk approve error:", error);
        toast.error("Failed to approve selected leave requests");
        await mutate();
      }
    });
  }, [selectedIds, setOptimisticItems, startTransition, mutate, viewMode]);

  const handleBulkReject = useCallback(async () => {
    if (viewMode !== "queue") return;
    if (
      selectedIds.size === 0 ||
      !bulkRejectReason.trim() ||
      bulkRejectReason.trim().length < 5
    ) {
      toast.error("Please provide a rejection reason (minimum 5 characters)");
      return;
    }

    selectedIds.forEach((id) => setOptimisticItems(id));
    const idsToReject = Array.from(selectedIds);
    setSelectedIds(new Set());
    setShowBulkRejectDialog(false);
    setBulkRejectReason("");

    startTransition(async () => {
      try {
        const ids = idsToReject.map(Number);
        const result = await bulkRejectLeaveRequests(
          ids,
          bulkRejectReason.trim()
        );

        if (result.success) {
          toast.success(
            `Successfully rejected ${result.rejected ?? 0} leave request${(result.rejected ?? 0) > 1 ? "s" : ""
            }` + ((result.failed ?? 0) > 0 ? `. ${result.failed ?? 0} failed.` : "")
          );
          await mutate();
        } else {
          toast.error(
            result.error || "Failed to reject selected leave requests"
          );
          await mutate();
        }
      } catch (error) {
        console.error("Bulk reject error:", error);
        toast.error("Failed to reject selected leave requests");
        await mutate();
      }
    });
  }, [
    selectedIds,
    bulkRejectReason,
    setOptimisticItems,
    startTransition,
    mutate,
    viewMode,
  ]);

  const allSelected =
    viewMode === "queue" &&
    items.length > 0 &&
    selectedIds.size === items.length;
  const someSelected =
    viewMode === "queue" &&
    selectedIds.size > 0 &&
    selectedIds.size < items.length;

  if (isLoading) {
    return (
      <Card className={cn("bg-card shadow-md border border-border", "rounded-2xl")}>
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
      <Card className={cn("bg-card shadow-md border border-border", "rounded-2xl")}>
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

  const getEmptyStateProps = () => {
    switch (activeTabId) {
      case "queue":
        return {
          title: "No pending requests",
          description: "You are all caught up! There are currently no leave requests awaiting approval."
        };
      case "approved":
        return {
          title: "No approved requests",
          description: "No approved leave requests found in the history."
        };
      case "rejected":
        return {
          title: "No rejected requests",
          description: "No rejected leave requests found in the history."
        };
      default:
        return {
          title: "No history found",
          description: "No past approval decisions found matching your filters."
        };
    }
  };

  const emptyStateProps = getEmptyStateProps();

  if (!items.length && displayedItems.length === 0) {
    return (
      <div className="space-y-4">
        {/* Tabs are always visible even when empty */}
        <EnhancedSmoothTab
          items={TABS}
          value={activeTabId}
          onChange={handleTabChange}
          showCardContent={false}
          className="bg-card w-full max-w-none border-b-0 rounded-b-none p-1"
        />
        <Card className={cn("bg-card shadow-md border border-border", "rounded-2xl rounded-t-none")}>
          <CardContent>
            <EmptyState
              icon={CheckCircle}
              title={emptyStateProps.title}
              description={emptyStateProps.description}
              className="py-8"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <EnhancedSmoothTab
          items={TABS}
          value={activeTabId}
          onChange={handleTabChange}
          showCardContent={false}
          className="bg-card w-full max-w-none border-b-0 rounded-b-none p-1"
        />

        {/* Only show description for history mode or if needed, but tabs are self-explanatory */}
      </div>

      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by employee, type, reason, or date..."
        statusFilter={{
          value: statusFilterValue,
          onChange: handleStatusFilterChange,
          options:
            viewMode === "history" ? HISTORY_STATUS_OPTIONS : STATUS_OPTIONS,
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
        <Card
          className={cn(
            "bg-card shadow-md border border-border",
            "rounded-2xl bg-primary/5 border-primary/20"
          )}
        >
          <CardContent className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={true}
                onCheckedChange={() => setSelectedIds(new Set())}
                className="data-[state=checked]:bg-primary"
              />
              <span className="text-sm font-medium">
                {selectedIds.size} leave request
                {selectedIds.size > 1 ? "s" : ""} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkApprove}
                disabled={isPending}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md",
                  "bg-emerald-600 text-white hover:bg-emerald-700"
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
        <Card className={cn("bg-card shadow-md border border-border", "rounded-2xl")}>
          <CardContent>
            <EmptyState
              icon={FilterX}
              title={
                viewMode === "history"
                  ? "No matching decisions"
                  : "No matching requests"
              }
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
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {viewMode === "queue" && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(checked) =>
                        handleSelectAll(checked === true)
                      }
                      aria-label="Select all rows"
                      className={
                        someSelected ? "data-[state=checked]:bg-card-action" : ""
                      }
                    />
                  </TableHead>
                )}
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Reason</TableHead>
                {viewMode === "queue" ? (
                  <>
                    <TableHead>Stage</TableHead>
                    <TableHead className="text-right">
                      Actions
                    </TableHead>
                  </>
                ) : (
                  <>
                    <TableHead>Decision</TableHead>
                    <TableHead>Processed On</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item: HRApprovalItem) => {
                const start = formatDate(item.start);
                const end = formatDate(item.end);
                const stage =
                  item.approvals?.[item.currentStageIndex]?.status ?? item.status;
                const decisionMeta = item.approvals?.[0];
                return (
                  <TableRow
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
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(item.id)}
                          onCheckedChange={(checked) =>
                            handleSelectRow(item.id, checked === true)
                          }
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Select row ${item.id}`}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="font-medium text-foreground dark:text-foreground/90">
                        {item.requestedByName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.requestedByEmail ?? "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground dark:text-muted-foreground/80">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span>{leaveTypeLabel[item.type] ?? item.type}</span>
                        {(item as any).isCancellationRequest && (
                          <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                            Cancellation
                          </span>
                        )}
                        {(item as any).isModified && !(item as any).isCancellationRequest && (
                          <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            Resubmitted
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground dark:text-muted-foreground/80">
                      <div>{start}</div>
                      {start !== end && (
                        <div className="text-xs text-muted-foreground">
                          to {end}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground dark:text-muted-foreground/80">
                      {item.requestedDays}
                    </TableCell>
                    <TableCell className="max-w-xs text-sm text-muted-foreground dark:text-muted-foreground/80">
                      <p className="whitespace-pre-wrap wrap-break-word">
                        {item.reason}
                      </p>
                    </TableCell>
                    {viewMode === "queue" ? (
                      <>
                        <TableCell className="text-sm font-medium capitalize text-muted-foreground dark:text-muted-foreground/80">
                          {stage.toLowerCase()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div
                            className="flex justify-end"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-1">
                              {/* Approve Button */}
                              {(userRole === "HR_ADMIN" || userRole === "DEPT_HEAD" || userRole === "CEO" || userRole === "HR_HEAD") && (
                                <TooltipProvider>
                                  <Tooltip delayDuration={300}>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDecision(item.id, "approve", item.requestedByName || undefined);
                                        }}
                                        disabled={isPending}
                                        className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                      >
                                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      {isFinalApprover(userRole as any, item.type as any, item.requestedByRole as any)
                                        ? "Final Approve"
                                        : "Approve & Forward"}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}



                              {/* Return Button */}
                              {(userRole === "HR_ADMIN" || userRole === "DEPT_HEAD") && (
                                <TooltipProvider>
                                  <Tooltip delayDuration={300}>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDecision(item.id, "return", item.requestedByName || undefined);
                                        }}
                                        disabled={isPending}
                                        className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                                      >
                                        <RotateCcw className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">Return for Edit</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}

                              {/* Reject Button */}
                              <TooltipProvider>
                                <Tooltip delayDuration={300}>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDecision(item.id, "reject", item.requestedByName || undefined);
                                      }}
                                      disabled={isPending}
                                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                    >
                                      <XCircle className="h-5 w-5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">Reject Request</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="text-sm font-semibold capitalize text-muted-foreground dark:text-muted-foreground/80">
                          {item.status.toLowerCase()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground dark:text-muted-foreground/80">
                          {decisionMeta?.decidedAt
                            ? formatDate(decisionMeta.decidedAt)
                            : "—"}
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
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
        <AlertDialogContent className={cn("bg-card shadow-md border border-border", "rounded-2xl")}>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Leave Request?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject the leave request from{" "}
              <strong>{dialogState.employeeName}</strong>? This action cannot be
              undone, and the employee will be notified of the rejection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={closeDialog}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (dialogState.itemId) {
                  executeDecision(dialogState.itemId, "reject");
                }
              }}
              className={cn(
                "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              )}
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
        <AlertDialogContent className={cn("bg-card shadow-md border border-border", "rounded-2xl")}>
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
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
            <AlertDialogCancel
              onClick={closeDialog}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
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
        <AlertDialogContent className={cn("bg-card shadow-md border border-border", "rounded-2xl")}>
          <AlertDialogHeader>
            <AlertDialogTitle>Bulk Reject Leave Requests?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to reject <strong>{selectedIds.size}</strong> leave
              request
              {selectedIds.size > 1 ? "s" : ""}. This action cannot be undone,
              and all affected employees will be notified.
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
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkReject}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={
                !bulkRejectReason.trim() || bulkRejectReason.trim().length < 5
              }
            >
              Reject All Selected
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
