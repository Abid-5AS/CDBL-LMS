"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModernTable } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Inbox, Loader2, ChevronLeft, ChevronRight, CheckCircle2, ArrowRight, RotateCcw, XCircle } from "lucide-react";
import { SUCCESS_MESSAGES } from "@/lib";
import { toast } from "sonner";
import { getToastMessage } from "@/lib";
import { DEFAULT_FILTER } from "@/types/filters";
import { useDebounce } from "@/lib";
import { useFilterFromUrl } from "@/lib";
import { useUser } from "@/lib";
import { formatDate, cn } from "@/lib/utils";
import { leaveTypeLabel } from "@/lib/ui";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LeaveType, LeaveStatus } from "@prisma/client";
import { Skeleton } from "@/components/ui/skeleton";
import { LeaveComparisonModal } from "@/components/shared/modals";
import { AppRole } from "@/lib";
import { canPerformAction } from "@/lib/workflow";

// Shared components
import { SearchWithClear } from "@/components/shared/filters";
import { CombinedFilterSection } from "@/components/shared/filters";
import {
  ApprovalDialog,
  RejectDialog,
  ReturnDialog,
  ForwardDialog,
  CancelDialog,
} from "@/components/shared/modals";

type DeptHeadPendingTableProps = {
  data?: {
    rows: any[];
    total: number;
    counts: {
      pending: number;
      forwarded: number;
      returned: number;
      cancelled: number;
    };
  };
  isLoading?: boolean;
  error?: any;
  onMutate?: () => Promise<any>;
};

export function DeptHeadPendingTable({
  data,
  isLoading = false,
  error,
  onMutate,
}: DeptHeadPendingTableProps) {
  const user = useUser();
  const userRole = user?.role || "DEPT_HEAD";

  const { state, set } = useFilterFromUrl();
  const [searchInput, setSearchInput] = useState(state.q);
  const debouncedSearch = useDebounce(searchInput, 250);

  // Update URL when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== state.q) {
      set({ q: debouncedSearch });
    }
  }, [debouncedSearch, state.q, set]);

  // Sync search input with URL state (when URL changes externally)
  useEffect(() => {
    if (state.q !== searchInput) {
      setSearchInput(state.q);
    }
  }, [state.q, searchInput]);

  // Dialog state
  const [currentLeaveId, setCurrentLeaveId] = useState<number | null>(null);
  const [currentLeaveInfo, setCurrentLeaveInfo] = useState({ type: "", name: "" });
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
  const [selectedLeaveForComparison, setSelectedLeaveForComparison] = useState<any | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  const rows = data?.rows || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / state.pageSize);

  // Clear all filters
  const clearFilters = () => {
    set(DEFAULT_FILTER);
    setSearchInput("");
  };

  const hasActiveFilters = state.q || state.status !== "PENDING" || state.type !== "ALL";

  // Generic action handler
  const handleAction = async (
    leaveId: number,
    action: "approve" | "reject" | "forward" | "return" | "cancel",
    comment?: string
  ) => {
    setProcessingIds((prev) => new Set(prev).add(leaveId));

    try {
      const endpoint = `/api/leaves/${leaveId}/${action}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: comment || "",
          reason: comment || undefined,
        }),
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMessage = getToastMessage(
          payload?.error || `Failed to ${action} request`,
          payload?.message
        );
        toast.error(errorMessage);
        return;
      }

      // Success messages
      const successMessages = {
        approve: SUCCESS_MESSAGES.leave_approved,
        reject: SUCCESS_MESSAGES.leave_rejected,
        return: SUCCESS_MESSAGES.returned_for_modification,
        cancel: "Leave request cancelled successfully",
        forward: SUCCESS_MESSAGES.leave_forwarded,
      };
      toast.success(successMessages[action]);

      // Refresh data
      if (onMutate) {
        await onMutate();
      } else if (typeof window !== "undefined") {
        window.location.reload();
      }

      // Close dialogs
      setApproveDialogOpen(false);
      setRejectDialogOpen(false);
      setReturnDialogOpen(false);
      setForwardDialogOpen(false);
      setCancelDialogOpen(false);
      setCurrentLeaveId(null);
    } catch (err) {
      toast.error(getToastMessage("network_error", "Unable to update request"));
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(leaveId);
        return next;
      });
    }
  };

  // Helper to open specific dialog
  const openDialog = (
    leaveId: number,
    action: "approve" | "reject" | "forward" | "return" | "cancel",
    leaveType: string,
    employeeName: string
  ) => {
    setCurrentLeaveId(leaveId);
    setCurrentLeaveInfo({ type: leaveType, name: employeeName });

    switch (action) {
      case "approve":
        setApproveDialogOpen(true);
        break;
      case "reject":
        setRejectDialogOpen(true);
        break;
      case "forward":
        setForwardDialogOpen(true);
        break;
      case "return":
        setReturnDialogOpen(true);
        break;
      case "cancel":
        setCancelDialogOpen(true);
        break;
    }
  };

  // Helper to determine available actions based on user role and leave type
  const getAvailableActions = (leaveType: LeaveType): Array<"approve" | "forward" | "return" | "cancel"> => {
    const actions: Array<"approve" | "forward" | "return" | "cancel"> = [];
    const userRole = (user?.role || "DEPT_HEAD") as AppRole;

    // DEPT_HEAD never approves - they can only forward, return, or cancel
    if (canPerformAction(userRole, "FORWARD", leaveType)) {
      actions.push("forward");
    }

    // Return is always available for supervisors
    actions.push("return");

    // Cancel is available for supervisors
    actions.push("cancel");

    return actions;
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="rounded-2xl border-muted/60 shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-20" />
            <div className="flex gap-2 flex-wrap">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-6 w-20" />
            <div className="flex gap-2 flex-wrap">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
          <div className="border rounded-lg">
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="rounded-2xl border-muted/60 shadow-sm">
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
        </CardHeader>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <div className="text-sm font-semibold text-data-error">
              Failed to load requests
            </div>
            <p className="text-xs text-muted-foreground">
              {error?.message || "Please refresh the page or try again later."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (onMutate) onMutate();
                else window.location.reload();
              }}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state (no data at all)
  if (!isLoading && rows.length === 0 && !hasActiveFilters) {
    return (
      <Card className="rounded-2xl border-muted/60 shadow-sm">
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-12 text-center bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg border border-muted/60">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-data-success" />
            <h3 className="text-lg font-semibold mb-2">All clear!</h3>
            <p className="text-sm text-muted-foreground">
              No pending approvals at the moment.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <ModernTable.Card.Root>
        <ModernTable.Card.Header
          title="Pending Requests"
          description="Review and manage team leave requests"
        />
        <div className="p-6 space-y-4">
          {/* Search Bar with Clear Filters */}
          <SearchWithClear
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            onClearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
            placeholder="Search by employee, type, or reason..."
          />

          {/* Filter Section */}
          <CombinedFilterSection
            selectedStatus={state.status}
            selectedType={state.type}
            onStatusChange={(status) => set({ status: status as any })}
            onTypeChange={(type) => set({ type: type as any })}
            userRole={userRole}
            sticky={true}
          />

          {/* Table or Empty State */}
          {rows.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="font-semibold mb-2">No requests match your filters</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting filters or check approved requests.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <ModernTable.Card.Root>
                <div className="max-h-[70vh] overflow-y-auto">
                  <ModernTable size="md">
                    <ModernTable.Header bordered={true}>
                      <ModernTable.Head>Employee</ModernTable.Head>
                      <ModernTable.Head>Type</ModernTable.Head>
                      <ModernTable.Head className="hidden sm:table-cell">Dates</ModernTable.Head>
                      <ModernTable.Head className="hidden md:table-cell">Days</ModernTable.Head>
                      <ModernTable.Head className="hidden lg:table-cell">Reason</ModernTable.Head>
                      <ModernTable.Head>Status</ModernTable.Head>
                      <ModernTable.Head className="text-right">Actions</ModernTable.Head>
                    </ModernTable.Header>
                    <ModernTable.Body>
                      {rows.map((leave: any) => {
                        if (!leave.requester) return null;

                        const availableActions = getAvailableActions(leave.type as LeaveType);
                        const isPending = leave.status === "PENDING" || leave.status === "SUBMITTED";
                        const isProcessing = processingIds.has(leave.id);

                        return (
                          <ModernTable.Row key={leave.id}>
                            <ModernTable.Cell>
                              <Link
                                href={`/leaves/${leave.id}`}
                                className="text-data-info hover:underline font-medium cursor-pointer"
                              >
                                {leave.requester.name}
                              </Link>
                              <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {leave.requester.email}
                              </div>
                            </ModernTable.Cell>
                            <ModernTable.Cell className="font-medium">
                              {leaveTypeLabel[leave.type] ?? leave.type}
                            </ModernTable.Cell>
                            <ModernTable.Cell className="hidden sm:table-cell text-text-secondary">
                              {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                            </ModernTable.Cell>
                            <ModernTable.Cell className="hidden md:table-cell text-text-secondary">
                              {leave.workingDays}
                            </ModernTable.Cell>
                            <ModernTable.Cell className="hidden lg:table-cell max-w-xs">
                              {leave.reason && leave.reason.length > 50 ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="truncate text-text-secondary cursor-help">
                                        {leave.reason}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="left" className="max-w-xs">
                                      <p>{leave.reason}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                <div className="text-text-secondary">{leave.reason}</div>
                              )}
                            </ModernTable.Cell>
                            <ModernTable.Cell>
                              <div className="flex items-center gap-2">
                                <StatusBadge status={leave.status} />
                                {(leave as any).isModified && (
                                  <Badge variant="outline" className="text-xs text-data-info border-data-info">
                                    Modified
                                  </Badge>
                                )}
                              </div>
                            </ModernTable.Cell>
                            <ModernTable.Cell className="text-right">
                              <div className="flex items-center justify-end gap-2 flex-nowrap">
                                {isPending && (
                                  <>
                                    {availableActions.includes("approve") && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              size="icon"
                                              variant="default"
                                              className="h-8 w-8 text-data-success hover:bg-data-success hover:text-data-success"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openDialog(leave.id, "approve", leave.type, leave.requester.name);
                                              }}
                                              disabled={isProcessing}
                                              aria-label="Approve leave request"
                                            >
                                              {isProcessing ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                              ) : (
                                                <CheckCircle2 className="h-4 w-4" />
                                              )}
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Approve</TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                    {availableActions.includes("forward") && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              size="icon"
                                              variant="outline"
                                              className="h-8 w-8 text-data-info hover:bg-data-info hover:text-data-info"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openDialog(leave.id, "forward", leave.type, leave.requester.name);
                                              }}
                                              disabled={isProcessing}
                                              aria-label="Forward to HR Head"
                                            >
                                              {isProcessing ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                              ) : (
                                                <ArrowRight className="h-4 w-4" />
                                              )}
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Forward to HR Head</TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                    {availableActions.includes("return") && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              size="icon"
                                              variant="outline"
                                              className="h-8 w-8 text-data-error hover:bg-data-error hover:text-data-error"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openDialog(leave.id, "return", leave.type, leave.requester.name);
                                              }}
                                              disabled={isProcessing}
                                              aria-label="Return for modification"
                                            >
                                              {isProcessing ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                              ) : (
                                                <RotateCcw className="h-4 w-4" />
                                              )}
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Return for Modification</TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-text-secondary hover:text-data-error hover:bg-data-error"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openDialog(leave.id, "cancel", leave.type, leave.requester.name);
                                            }}
                                            disabled={isProcessing}
                                            aria-label="Cancel request"
                                          >
                                            {isProcessing ? (
                                              <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                              <XCircle className="h-4 w-4" />
                                            )}
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Cancel this request permanently</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </>
                                )}
                                {!isPending && (
                                  <>
                                    <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                                      <Link href={`/leaves/${leave.id}`}>Review</Link>
                                    </Button>
                                    {(leave as any).isModified && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs text-data-info"
                                        onClick={() => {
                                          setSelectedLeaveForComparison(leave);
                                          setComparisonModalOpen(true);
                                        }}
                                      >
                                        Compare
                                      </Button>
                                    )}
                                  </>
                                )}
                              </div>
                            </ModernTable.Cell>
                          </ModernTable.Row>
                        );
                      })}
                    </ModernTable.Body>
                  </ModernTable>
                </div>
              </ModernTable.Card.Root>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      set({ page: Math.max(1, state.page - 1) });
                      setTimeout(() => {
                        const tableElement = document.getElementById("pending-requests-table");
                        if (tableElement) {
                          tableElement.scrollIntoView({ behavior: "smooth", block: "start" });
                        }
                      }, 100);
                    }}
                    disabled={state.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (state.page <= 3) {
                        pageNum = i + 1;
                      } else if (state.page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = state.page - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={state.page === pageNum ? "default" : "outline"}
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            set({ page: pageNum });
                            setTimeout(() => {
                              const tableElement = document.getElementById("pending-requests-table");
                              if (tableElement) {
                                tableElement.scrollIntoView({ behavior: "smooth", block: "start" });
                              }
                            }, 100);
                          }}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      set({ page: Math.min(totalPages, state.page + 1) });
                      setTimeout(() => {
                        const tableElement = document.getElementById("pending-requests-table");
                        if (tableElement) {
                          tableElement.scrollIntoView({ behavior: "smooth", block: "start" });
                        }
                      }, 100);
                    }}
                    disabled={state.page === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </ModernTable.Card.Root>

      {/* Approval Dialogs - using shared components */}
      <ApprovalDialog
        open={approveDialogOpen}
        onOpenChange={setApproveDialogOpen}
        onConfirm={() => currentLeaveId && handleAction(currentLeaveId, "approve")}
        leaveType={currentLeaveInfo.type}
        employeeName={currentLeaveInfo.name}
        isLoading={currentLeaveId ? processingIds.has(currentLeaveId) : false}
      />

      <RejectDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onConfirm={() => currentLeaveId && handleAction(currentLeaveId, "reject")}
        leaveType={currentLeaveInfo.type}
        employeeName={currentLeaveInfo.name}
        isLoading={currentLeaveId ? processingIds.has(currentLeaveId) : false}
      />

      <ReturnDialog
        open={returnDialogOpen}
        onOpenChange={setReturnDialogOpen}
        onConfirm={(comment) => currentLeaveId && handleAction(currentLeaveId, "return", comment)}
        isLoading={currentLeaveId ? processingIds.has(currentLeaveId) : false}
      />

      <ForwardDialog
        open={forwardDialogOpen}
        onOpenChange={setForwardDialogOpen}
        onConfirm={(comment) => currentLeaveId && handleAction(currentLeaveId, "forward", comment)}
        nextApprover="HR Head"
        isLoading={currentLeaveId ? processingIds.has(currentLeaveId) : false}
      />

      <CancelDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={(reason) => currentLeaveId && handleAction(currentLeaveId, "cancel", reason)}
        isLoading={currentLeaveId ? processingIds.has(currentLeaveId) : false}
      />

      {/* Comparison Modal */}
      {selectedLeaveForComparison && (
        <LeaveComparisonModal
          open={comparisonModalOpen}
          onOpenChange={setComparisonModalOpen}
          leaveId={selectedLeaveForComparison.id}
          currentLeave={{
            type: selectedLeaveForComparison.type,
            startDate: selectedLeaveForComparison.startDate,
            endDate: selectedLeaveForComparison.endDate,
            workingDays: selectedLeaveForComparison.workingDays,
            reason: selectedLeaveForComparison.reason,
            needsCertificate: (selectedLeaveForComparison as any).needsCertificate,
            certificateUrl: (selectedLeaveForComparison as any).certificateUrl,
            fitnessCertificateUrl: (selectedLeaveForComparison as any).fitnessCertificateUrl,
          }}
        />
      )}
    </>
  );
}
