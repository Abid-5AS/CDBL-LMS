"use client";

import { useState, useEffect } from "react";
import { ModernTable } from "@/components/ui";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2, CheckCircle2, ArrowRight, RotateCcw, XCircle } from "lucide-react";
import { DEFAULT_FILTER } from "@/types/filters";
import { useDebounce, useFilterFromUrl, useUser } from "@/lib";
import { formatDate } from "@/lib/utils";
import { leaveTypeLabel } from "@/lib/ui";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LeaveType } from "@prisma/client";
import { LeaveComparisonModal } from "@/components/shared/modals";
import { AppRole } from "@/lib";
import { canPerformAction } from "@/lib/workflow";

// Shared components
import { SearchWithClear, CombinedFilterSection } from "@/components/shared/filters";
import {
  ApprovalDialog,
  RejectDialog,
  ReturnDialog,
  ForwardDialog,
  CancelDialog,
} from "@/components/shared/modals";
import { ScrollingPagination } from "@/components/shared/pagination";

// Extracted hooks and components
import { useLeaveActions } from "../hooks/useLeaveActions";
import { useLeaveDialogs } from "../hooks/useLeaveDialogs";
import {
  PendingTableLoading,
  PendingTableError,
  PendingTableEmpty,
  PendingTableNoResults,
} from "../components/PendingTableStates";

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

  // Custom hooks
  const { handleAction, processingIds } = useLeaveActions(onMutate);
  const { currentLeaveId, currentLeaveInfo, dialogs, openDialog, closeAllDialogs } = useLeaveDialogs();

  // Comparison modal state
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
  const [selectedLeaveForComparison, setSelectedLeaveForComparison] = useState<any | null>(null);

  // Batch selection state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Update URL when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== state.q) {
      set({ q: debouncedSearch });
    }
  }, [debouncedSearch, state.q, set]);

  // Sync search input with URL state
  useEffect(() => {
    if (state.q !== searchInput) {
      setSearchInput(state.q);
    }
  }, [state.q, searchInput]);

  const rows = data?.rows || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / state.pageSize);

  const clearFilters = () => {
    set(DEFAULT_FILTER);
    setSearchInput("");
  };

  const hasActiveFilters = Boolean(state.q) || state.status !== "PENDING" || state.type !== "ALL";

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

  // Action handlers
  const handleConfirmAction = async (action: "approve" | "reject" | "forward" | "return" | "cancel", comment?: string) => {
    if (currentLeaveId) {
      await handleAction(currentLeaveId, action, comment);
      closeAllDialogs();
    }
  };

  const handleRetry = () => {
    if (onMutate) onMutate();
    else window.location.reload();
  };

  // Loading state
  if (isLoading) {
    return <PendingTableLoading />;
  }

  // Error state
  if (error) {
    return <PendingTableError error={error} onRetry={handleRetry} />;
  }

  // Empty state (no data at all)
  if (!isLoading && rows.length === 0 && !hasActiveFilters) {
    return <PendingTableEmpty />;
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

          {/* Bulk Action Bar */}
          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-muted/30 border border-primary/20 rounded-lg mb-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-primary text-primary-foreground">
                  {selectedIds.length} Selected
                </Badge>
                <span className="text-sm text-muted-foreground">requests selected</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-data-error hover:bg-data-error hover:text-data-error"
                  onClick={() => {
                    // Bulk return logic would go here
                    // For now, just clear selection as placeholder
                    setSelectedIds([]);
                  }}
                >
                  <RotateCcw className="mr-2 h-3.5 w-3.5" />
                  Return Selected
                </Button>
                <Button
                  size="sm"
                  className="h-8 bg-data-success hover:bg-data-success/90 text-white"
                  onClick={async () => {
                    // Bulk approve logic
                    // Loop through selectedIds and call handleAction for each
                    // This is a simplified implementation
                    for (const id of selectedIds) {
                      await handleAction(id, "approve");
                    }
                    setSelectedIds([]);
                    if (onMutate) onMutate();
                  }}
                >
                  <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                  Approve Selected
                </Button>
              </div>
            </div>
          )}

          {/* Table or Empty State */}
          {rows.length === 0 ? (
            <PendingTableNoResults />
          ) : (
            <div className="space-y-4">
              <ModernTable.Card.Root>
                <div className="max-h-[70vh] overflow-y-auto">
                  <ModernTable size="md">
                    <ModernTable.Header bordered={true}>
                      <ModernTable.Head className="w-[40px]">
                        <Checkbox
                          checked={selectedIds.length === rows.length && rows.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedIds(rows.map((r: any) => r.id));
                            } else {
                              setSelectedIds([]);
                            }
                          }}
                        />
                      </ModernTable.Head>
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
                        const isSelected = selectedIds.includes(leave.id);

                        return (
                          <ModernTable.Row key={leave.id} className={isSelected ? "bg-muted/30" : ""}>
                            <ModernTable.Cell>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedIds((prev) => [...prev, leave.id]);
                                  } else {
                                    setSelectedIds((prev) => prev.filter((id) => id !== leave.id));
                                  }
                                }}
                              />
                            </ModernTable.Cell>
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
              <ScrollingPagination
                currentPage={state.page}
                totalPages={totalPages}
                onPageChange={(page) => set({ page })}
                scrollToElementId="pending-requests-table"
                className="mt-4"
              />
            </div>
          )}
        </div>
      </ModernTable.Card.Root>

      {/* Approval Dialogs */}
      <ApprovalDialog
        open={dialogs.approve.open}
        onOpenChange={dialogs.approve.setOpen}
        onConfirm={() => handleConfirmAction("approve")}
        leaveType={currentLeaveInfo.type}
        employeeName={currentLeaveInfo.name}
        isLoading={currentLeaveId ? processingIds.has(currentLeaveId) : false}
      />

      <RejectDialog
        open={dialogs.reject.open}
        onOpenChange={dialogs.reject.setOpen}
        onConfirm={() => handleConfirmAction("reject")}
        leaveType={currentLeaveInfo.type}
        employeeName={currentLeaveInfo.name}
        isLoading={currentLeaveId ? processingIds.has(currentLeaveId) : false}
      />

      <ReturnDialog
        open={dialogs.return.open}
        onOpenChange={dialogs.return.setOpen}
        onConfirm={(comment) => handleConfirmAction("return", comment)}
        isLoading={currentLeaveId ? processingIds.has(currentLeaveId) : false}
      />

      <ForwardDialog
        open={dialogs.forward.open}
        onOpenChange={dialogs.forward.setOpen}
        onConfirm={(comment) => handleConfirmAction("forward", comment)}
        nextApprover="HR Head"
        isLoading={currentLeaveId ? processingIds.has(currentLeaveId) : false}
      />

      <CancelDialog
        open={dialogs.cancel.open}
        onOpenChange={dialogs.cancel.setOpen}
        onConfirm={(reason) => handleConfirmAction("cancel", reason)}
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
