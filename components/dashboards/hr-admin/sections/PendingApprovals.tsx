"use client";

import { useState, useMemo } from "react";
import { Search, X, User, Calendar, Clock } from "lucide-react";
import { LeaveStatus } from "@/lib/enums";

// UI Components
import {
  Badge,
  Input,
  TooltipProvider,
} from "@/components/ui";

// Shared Components
import {
  StatusBadge,
  ReviewModal,
  ApprovalActionButtons,
  LoadingSpinner,
  ErrorState,
  AllClearState,
  LeaveTable,
  ColumnDef,
  ActionDef,
} from "@/components/shared";

// Lib utilities
import { cn, formatDate, leaveTypeLabel } from "@/lib";

// Extracted hooks and components
import { usePendingRequests } from "@/components/dashboards/dept-head/hooks/usePendingRequests";
import { useLeaveFiltering } from "../hooks/useLeaveFiltering";
import { STATUS_TABS, getLeaveTypeColor } from "../utils/leave-utils";



type LeaveRequest = {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  reason: string;
  status: LeaveStatus;
  requester: {
    id: number;
    name: string;
    email: string;
  };
};

type PendingLeaveRequestsTableProps = {
  onRowClick?: (leave: LeaveRequest) => void;
  data?: { items: LeaveRequest[] };
  isLoading?: boolean;
  error?: any;
  onMutate?: () => Promise<any>;
};

const ITEMS_PER_PAGE = 10;

export function PendingLeaveRequestsTable({
  onRowClick,
  data: externalData,
  isLoading: externalIsLoading,
  error: externalError,
  onMutate,
  hideHeader = false,
}: PendingLeaveRequestsTableProps & { hideHeader?: boolean } = {}) {
  const {
    searchInput: hookSearchInput,
    setSearchInput: setHookSearchInput,
    handleSingleAction,
    isProcessing,
    refresh,
    requests,
    isLoading: hookIsLoading,
    error: hookError,
  } = usePendingRequests();

  // Local state
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"forward" | "reject" | "return" | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Use external data if provided
  const allLeaves: LeaveRequest[] = useMemo(() => {
    if (Array.isArray(externalData?.items)) {
      return externalData.items;
    }
    return requests;
  }, [externalData?.items, requests]);

  const isLoading = externalIsLoading ?? hookIsLoading;
  const error = externalError ?? hookError;

  // Use filtering hook
  const {
    statusTab,
    setStatusTab,
    searchInput,
    setSearchInput,
    currentPage,
    setCurrentPage,
    filteredLeaves,
    paginatedLeaves,
    totalPages,
  } = useLeaveFiltering(allLeaves, ITEMS_PER_PAGE);

  // Action handlers
  const handleForward = async (leave: LeaveRequest) => {
    setProcessingId(leave.id);
    await handleSingleAction(leave.id, "forward");
    setProcessingId(null);

    if (onMutate) {
      await onMutate();
    } else {
      await refresh();
    }
  };

  const handleQuickAction = (leave: LeaveRequest, action: "reject" | "return") => {
    setSelectedLeave(leave);
    setActionType(action);
    setModalOpen(true);
  };

  const handleRowClick = (leave: LeaveRequest) => {
    setActionType(null);
    setSelectedLeave(leave);
    setModalOpen(true);
    onRowClick?.(leave);
  };

  const handleActionComplete = async () => {
    if (onMutate) {
      await onMutate();
    } else {
      await refresh();
    }
    setModalOpen(false);
    setActionType(null);
    setSelectedLeave(null);
  };

  const handleModalOpenChange = (open: boolean) => {
    setModalOpen(open);
    if (!open) {
      setActionType(null);
      setSelectedLeave(null);
    }
  };

  // Columns Configuration
  const columns: ColumnDef<LeaveRequest>[] = [
    {
      header: "Employee",
      accessorKey: "requester",
      cell: (leave: LeaveRequest) => (
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-gradient-to-br from-card-action to-card-summary p-2">
            <User className="h-4 w-4 text-text-inverted" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-medium text-sm">
                {leave.requester.name}
              </p>
              <Badge
                variant="outline"
                className={cn(
                  "sm:hidden font-medium text-xs whitespace-nowrap",
                  getLeaveTypeColor(leave.type)
                )}
              >
                {leaveTypeLabel[leave.type] ?? leave.type}
              </Badge>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {leave.requester.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Type",
      accessorKey: "type",
      className: "hidden sm:table-cell",
      cell: (leave: LeaveRequest) => (
        <Badge
          variant="outline"
          className={cn(
            "font-medium text-xs whitespace-nowrap",
            getLeaveTypeColor(leave.type)
          )}
        >
          {leaveTypeLabel[leave.type] ?? leave.type}
        </Badge>
      ),
    },
    {
      header: "Dates",
      accessorKey: "startDate",
      cell: (leave: LeaveRequest) => (
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1">
            <span className="text-xs text-muted-foreground">
              {formatDate(leave.startDate)}
            </span>
            <span className="hidden sm:inline text-muted-foreground">→</span>
            <span className="text-xs text-muted-foreground">
              {formatDate(leave.endDate)}
            </span>
            <span className="sm:hidden text-xs font-medium text-foreground">
              ({leave.workingDays}d)
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Days",
      accessorKey: "workingDays",
      className: "hidden lg:table-cell",
      cell: (leave: LeaveRequest) => (
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium">
            {leave.workingDays}
          </span>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      className: "hidden xl:table-cell",
      cell: (leave: LeaveRequest) => <StatusBadge status={leave.status} />,
    },
  ];

  // Actions Configuration
  const actions: ActionDef<LeaveRequest>[] = [
    {
      label: "Forward",
      onClick: (leave: LeaveRequest) => handleForward(leave),
      variant: "default",
      disabled: (leave: LeaveRequest) => processingId === leave.id,
      loading: (leave: LeaveRequest) => processingId === leave.id,
    },
    {
      label: "Return",
      onClick: (leave: LeaveRequest) => handleQuickAction(leave, "return"),
      variant: "outline",
      disabled: (leave: LeaveRequest) => processingId === leave.id,
    },
    {
      label: "Reject",
      onClick: (leave: LeaveRequest) => handleQuickAction(leave, "reject"),
      variant: "destructive",
      disabled: (leave: LeaveRequest) => processingId === leave.id,
    },
  ];

  // Mobile Card Renderer
  const mobileCardRenderer = (
    leave: LeaveRequest,
    isSelected: boolean,
    toggleSelection: () => void,
    actionButtons: React.ReactNode
  ) => (
    <div
      className="surface-card p-4 rounded-xl space-y-3 border border-bg-muted"
      onClick={() => handleRowClick(leave)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-gradient-to-br from-card-action to-card-summary p-2">
            <User className="h-4 w-4 text-text-inverted" />
          </div>
          <div>
            <p className="font-medium text-sm">{leave.requester.name}</p>
            <p className="text-xs text-muted-foreground">{leave.requester.email}</p>
          </div>
        </div>
        <StatusBadge status={leave.status} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Type</p>
          <Badge
            variant="outline"
            className={cn(
              "font-medium text-xs whitespace-nowrap",
              getLeaveTypeColor(leave.type)
            )}
          >
            {leaveTypeLabel[leave.type] ?? leave.type}
          </Badge>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Duration</p>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span>{leave.workingDays} days</span>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Dates</p>
        <div className="flex items-center gap-2 text-sm bg-bg-secondary/50 p-2 rounded-lg">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span>
            {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
          </span>
        </div>
      </div>

      <div className="pt-2 flex justify-end gap-2">
        <ApprovalActionButtons
          size="sm"
          onAction={(action) => {
            if (action === "forward") handleForward(leave);
            if (action === "return") handleQuickAction(leave, "return");
            if (action === "reject") handleQuickAction(leave, "reject");
          }}
          disabled={processingId === leave.id}
          loading={processingId === leave.id}
          loadingAction={processingId === leave.id ? "forward" : null}
        />
      </div>
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="surface-card rounded-2xl p-12">
        <LoadingSpinner message="Loading requests..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="surface-card rounded-2xl">
        <ErrorState
          title="Failed to load requests"
          message="There was an error loading the approval queue. Please try again."
        />
      </div>
    );
  }

  // Empty state
  if (allLeaves.length === 0 && !searchInput) {
    return (
      <div className="surface-card rounded-2xl overflow-hidden">
        <AllClearState
          title="No pending requests"
          description="All leave requests have been processed."
        />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="surface-card rounded-2xl overflow-hidden">
        <div className="space-y-4 p-6">
          {/* Header */}
          {!hideHeader && (
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Pending Leave Requests</h3>
            </div>
          )}

          {/* Tab Chips */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusTab(tab.value)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                  statusTab === tab.value
                    ? "bg-card-action text-text-inverted"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by employee, type, or reason..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 bg-bg-primary/50 border-bg-muted"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Unified Leave Table */}
          <LeaveTable
            data={paginatedLeaves as LeaveRequest[]}
            columns={columns}
            actions={actions}
            keyField="id"
            onRowClick={handleRowClick}
            pagination={{
              currentPage,
              totalPages,
              onPageChange: setCurrentPage,
            }}
            mobileCardRenderer={mobileCardRenderer}
            emptyState={
              <div className="text-center p-12 text-muted-foreground">
                No matching requests found
              </div>
            }
          />
        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal
        open={modalOpen}
        onOpenChange={handleModalOpenChange}
        leaveRequest={selectedLeave}
        initialAction={actionType || undefined}
        onActionComplete={handleActionComplete}
      />
    </TooltipProvider>
  );
}
