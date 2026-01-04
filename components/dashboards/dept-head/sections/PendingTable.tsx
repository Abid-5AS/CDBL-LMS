"use client";

import { useState, useEffect, useMemo } from "react";
import { GlassCard, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import {
  Badge,
  Button,
  Checkbox,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui";
import { CheckCircle2, ArrowRight, RotateCcw, XCircle, FileText, GitCompare } from "lucide-react";
import { DEFAULT_FILTER } from "@/types/filters";
import { useDebounce, useFilterFromUrl, useUser } from "@/lib";
import { formatDate, cn } from "@/lib/utils";
import { leaveTypeLabel } from "@/lib/ui/ui";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LeaveType } from "@/lib/enums";
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

  // Selection state for bulk actions
  const [selectedRequests, setSelectedRequests] = useState<number[]>([]);
  const isProcessing = processingIds.size > 0;

  const handleBulkAction = async (action: "approve" | "forward" | "return" | "cancel") => {
    // TODO: Implement bulk actions
    console.log("Bulk action:", action, selectedRequests);
  };

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
  const handleConfirmAction = async (
    action: "approve" | "reject" | "forward" | "return" | "cancel",
    comment?: string,
    ignoreWarnings?: boolean
  ) => {
    if (currentLeaveId) {
      const result = await handleAction(currentLeaveId, action, comment, ignoreWarnings);
      if (result?.success) {
        closeAllDialogs();
      }
      return result;
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
            className="text-info dark:text-info/90 hover:underline font-medium cursor-pointer"
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
        <span className="text-muted-foreground dark:text-muted-foreground/80">
          {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
        </span>
      ),
    },
    {
      header: "Days",
      accessorKey: "workingDays",
      className: "hidden md:table-cell",
      cell: (leave) => (
        <span className="text-muted-foreground dark:text-muted-foreground/80">
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
                <div className="truncate text-muted-foreground dark:text-muted-foreground/80 cursor-help max-w-xs">
                  {leave.reason}
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p>{leave.reason}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <div className="text-muted-foreground dark:text-muted-foreground/80">{leave.reason}</div>
        )
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (leave) => {
        // Calculate aging
        // We need createdAt. Assuming it's in the leave object.
        // If not, we might default to 0.
        const created = leave.createdAt ? new Date(leave.createdAt) : new Date();
        const now = new Date();
        const ageInDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

        let agingBadge = null;
        if (leave.status === "PENDING") {
          if (ageInDays >= 7) {
            agingBadge = (
              <Badge variant="destructive" className="text-[10px] h-5 px-1.5 ml-1">
                {ageInDays}d overdue
              </Badge>
            );
          } else if (ageInDays >= 3) {
            agingBadge = (
              <Badge variant="warning" className="text-[10px] h-5 px-1.5 ml-1">
                {ageInDays}d old
              </Badge>
            );
          }
        }

        return (
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={leave.status} />
            {leave.isModified && (
              <Badge variant="outline" className="text-xs text-info dark:text-info/90 border-info">
                Modified
              </Badge>
            )}
            {agingBadge}
          </div>
        );
      },
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

          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1 space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Filter by status</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "All", value: "ALL" },
                  { label: "Pending", value: "PENDING" },
                  { label: "Forwarded", value: "FORWARDED" },
                  { label: "Returned", value: "RETURNED" },
                  { label: "Cancelled", value: "CANCELLED" },
                ].map((status) => (
                  <Badge
                    key={status.value}
                    variant={state.status === status.value ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-all hover:opacity-80",
                      state.status === status.value ? "shadow-sm" : "bg-transparent text-muted-foreground hover:bg-muted"
                    )}
                    onClick={() => set({ status: status.value as any })}
                  >
                    {status.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="w-full md:w-[240px] space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Filter by leave type</Label>
              <Select
                value={state.type}
                onValueChange={(value) => set({ type: value as any })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All types</SelectItem>
                  {Object.values(LeaveType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {leaveTypeLabel[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>


          {/* Bulk Actions */}
          {
            selectedRequests.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-2 text-sm text-primary animate-in fade-in slide-in-from-top-2">
                <span className="ml-2 font-medium">{selectedRequests.length} selected</span>
                <div className="ml-auto flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-primary/20 hover:bg-primary/10 hover:text-primary"
                    onClick={() => handleBulkAction("return")}
                    disabled={isProcessing}
                  >
                    <RotateCcw className="mr-2 h-3.5 w-3.5" />
                    Return
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleBulkAction("approve")}
                    disabled={isProcessing}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                    Forward / Approve
                  </Button>
                </div>
              </div>
            )
          }

          {/* Table or Empty State */}
          {
            rows.length === 0 ? (
              <PendingTableNoResults />
            ) : (
              <LeaveTable
                data={rows}
                columns={columns}
                actions={actions}
                // bulkActions={bulkActions} // Bulk actions are now handled by the custom UI above
                keyField="id"
                selection={true}
                pagination={{
                  currentPage: state.page,
                  totalPages: totalPages,
                  onPageChange: (page) => set({ page }),
                }}
                emptyState={<PendingTableNoResults />}
              />
            )
          }
        </div >
      </GlassCard >

      {/* Approval Dialogs */}
      < ApprovalDialog
        open={dialogs.approve.open}
        onOpenChange={dialogs.approve.setOpen}
        onConfirm={(ignoreWarnings) => handleConfirmAction("approve", undefined, ignoreWarnings)
        }
        leaveType={currentLeaveInfo.type}
        employeeName={currentLeaveInfo.name}
        isLoading={currentLeaveId ? processingIds.has(currentLeaveId) : false}
      />

      <RejectDialog
        open={dialogs.reject.open}
        onOpenChange={dialogs.reject.setOpen}
        onConfirm={async () => { await handleConfirmAction("reject"); }}
        leaveType={currentLeaveInfo.type}
        employeeName={currentLeaveInfo.name}
        isLoading={currentLeaveId ? processingIds.has(currentLeaveId) : false}
      />

      <ReturnDialog
        open={dialogs.return.open}
        onOpenChange={dialogs.return.setOpen}
        onConfirm={async (comment) => { await handleConfirmAction("return", comment); }}
        isLoading={currentLeaveId ? processingIds.has(currentLeaveId) : false}
      />

      <ForwardDialog
        open={dialogs.forward.open}
        onOpenChange={dialogs.forward.setOpen}
        onConfirm={async (comment) => { await handleConfirmAction("forward", comment); }}
        nextApprover="HR Head"
        isLoading={currentLeaveId ? processingIds.has(currentLeaveId) : false}
      />

      <CancelDialog
        open={dialogs.cancel.open}
        onOpenChange={dialogs.cancel.setOpen}
        onConfirm={async (reason) => { await handleConfirmAction("cancel", reason); }}
        isLoading={currentLeaveId ? processingIds.has(currentLeaveId) : false}
      />

      {/* Comparison Modal */}
      {
        selectedLeaveForComparison && (
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
        )
      }
    </>
  );
}
