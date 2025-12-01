"use client";

import { useState, useEffect, useMemo } from "react";
import { GlassCard, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckCircle2, ArrowRight, RotateCcw, XCircle, FileText, GitCompare } from "lucide-react";
import { DEFAULT_FILTER } from "@/types/filters";
import { useDebounce, useFilterFromUrl, useUser } from "@/lib";
import { formatDate } from "@/lib/utils";
import { leaveTypeLabel } from "@/lib/ui/ui";
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
import {
  LeaveTable,
  ColumnDef,
  ActionDef,
  BulkActionDef,
} from "@/components/shared";

// Extracted hooks and components
import { useLeaveActions } from "../../shared/hooks/useLeaveActions";
import { useLeaveDialogs } from "../../shared/hooks/useLeaveDialogs";
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

  // Columns Configuration
  const columns: ColumnDef<any>[] = [
    {
      header: "Employee",
      accessorKey: "requester",
      cell: (leave) => (
        <div>
          <Link
            href={`/leaves/${leave.id}`}
            className="text-data-info hover:underline font-medium cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            {leave.requester.name}
          </Link>
          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
            {leave.requester.email}
          </div>
        </div>
      ),
    },
    {
      header: "Type",
      accessorKey: "type",
      cell: (leave) => (
        <span className="font-medium">
          {leaveTypeLabel[leave.type] ?? leave.type}
        </span>
      ),
    },
    {
      header: "Dates",
      accessorKey: "startDate",
      className: "hidden sm:table-cell",
      cell: (leave) => (
        <span className="text-text-secondary">
          {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
        </span>
      ),
    },
    {
      header: "Days",
      accessorKey: "workingDays",
      className: "hidden md:table-cell",
      cell: (leave) => (
        <span className="text-text-secondary">
          {leave.workingDays}
        </span>
      ),
    },
    {
      header: "Reason",
      accessorKey: "reason",
      className: "hidden lg:table-cell",
      cell: (leave) => (
        leave.reason && leave.reason.length > 50 ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="truncate text-text-secondary cursor-help max-w-xs">
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
        )
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (leave) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={leave.status} />
          {leave.isModified && (
            <Badge variant="outline" className="text-xs text-data-info border-data-info">
              Modified
            </Badge>
          )}
        </div>
      ),
    },
  ];

  // Actions Configuration
  const actions: ActionDef<any>[] = [
    {
      label: "Approve",
      icon: CheckCircle2,
      variant: "default", // Will be overridden by custom styling if needed, but LeaveTable uses standard variants
      onClick: (leave) => openDialog(leave.id, "approve", leave.type, leave.requester.name),
      disabled: (leave) => {
        const available = getAvailableActions(leave.type);
        return !available.includes("approve") || processingIds.has(leave.id);
      },
      loading: (leave) => processingIds.has(leave.id),
    },
    {
      label: "Forward",
      icon: ArrowRight,
      variant: "outline",
      onClick: (leave) => openDialog(leave.id, "forward", leave.type, leave.requester.name),
      disabled: (leave) => {
        const available = getAvailableActions(leave.type);
        return !available.includes("forward") || processingIds.has(leave.id);
      },
      loading: (leave) => processingIds.has(leave.id),
    },
    {
      label: "Return",
      icon: RotateCcw,
      variant: "outline",
      onClick: (leave) => openDialog(leave.id, "return", leave.type, leave.requester.name),
      disabled: (leave) => {
        const available = getAvailableActions(leave.type);
        return !available.includes("return") || processingIds.has(leave.id);
      },
      loading: (leave) => processingIds.has(leave.id),
    },
    {
      label: "Cancel",
      icon: XCircle,
      variant: "ghost",
      onClick: (leave) => openDialog(leave.id, "cancel", leave.type, leave.requester.name),
      disabled: (leave) => {
        const available = getAvailableActions(leave.type);
        return !available.includes("cancel") || processingIds.has(leave.id);
      },
      loading: (leave) => processingIds.has(leave.id),
    },
    {
        label: "Compare",
        icon: GitCompare,
        variant: "outline",
        onClick: (leave) => {
            setSelectedLeaveForComparison(leave);
            setComparisonModalOpen(true);
        },
        disabled: (leave) => !leave.isModified
    }
  ];

  // Filter out actions that are effectively disabled for all rows to clean up UI?
  // Or just let them be disabled. LeaveTable renders all actions.
  // We can filter the actions array dynamically if we want, but for now let's keep it static.

  // Bulk Actions
  const bulkActions: BulkActionDef[] = [
    {
      label: "Approve Selected",
      icon: CheckCircle2,
      variant: "default", // Should be success color, but LeaveTable uses standard variants. We might need to enhance LeaveTable for custom colors.
      onClick: async (selectedIds: (string | number)[]) => {
        for (const id of selectedIds) {
          await handleAction(Number(id), "approve");
        }
        if (onMutate) onMutate();
      },
    },
    {
        label: "Return Selected",
        icon: RotateCcw,
        variant: "outline",
        onClick: (selectedIds: (string | number)[]) => {
            // Bulk return logic - simplified for now as it usually requires comments per request
            // For now, maybe just clear selection
             // In a real app, we'd open a bulk return dialog
             console.log("Bulk return not fully implemented yet", selectedIds);
        }
    }
  ];

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
      <GlassCard variant="hover">
        <GlassCardHeader className="pb-3">
          <GlassCardTitle className="text-lg font-semibold">Pending Requests</GlassCardTitle>
          <p className="text-sm text-muted-foreground mt-1">Review and manage team leave requests</p>
        </GlassCardHeader>
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
            <PendingTableNoResults />
          ) : (
            <LeaveTable
              data={rows}
              columns={columns}
              actions={actions}
              bulkActions={bulkActions}
              keyField="id"
              selection={true}
              pagination={{
                currentPage: state.page,
                totalPages: totalPages,
                onPageChange: (page) => set({ page }),
              }}
              emptyState={<PendingTableNoResults />}
            />
          )}
        </div>
      </GlassCard>

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
