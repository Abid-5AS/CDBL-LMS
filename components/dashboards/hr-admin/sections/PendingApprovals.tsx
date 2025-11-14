"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Calendar, User, Clock } from "lucide-react";
import { LeaveStatus } from "@prisma/client";

// UI Components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Input,
  TooltipProvider,
} from "@/components/ui";

// Shared Components
import {
  StatusBadge,
  ReviewModal,
  ApprovalActionButtons,
  SimplePagination,
  LoadingSpinner,
  ErrorState,
  AllClearState,
} from "@/components/shared";

// Lib utilities
import { cn, formatDate, leaveTypeLabel } from "@/lib";

// Extracted hooks and components
import { usePendingRequests } from "@/components/dashboards/dept-head/hooks/usePendingRequests";
import { useLeaveFiltering } from "../hooks/useLeaveFiltering";
import { PendingLeaveCard } from "../components/PendingLeaveCard";
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
}: PendingLeaveRequestsTableProps = {}) {
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

  // Loading state
  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-12">
        <LoadingSpinner message="Loading requests..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="glass-card rounded-2xl">
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
      <div className="glass-card rounded-2xl overflow-hidden">
        <AllClearState
          title="No pending requests"
          description="All leave requests have been processed."
        />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="glass-card rounded-2xl overflow-hidden backdrop-blur-lg bg-bg-primary/60 border border-bg-muted shadow-lg">
        <div className="space-y-4 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Pending Leave Requests</h3>
          </div>

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

          {/* Table/List */}
          {filteredLeaves.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-xl p-12 text-center"
            >
              <p className="text-sm text-muted-foreground">
                No matching requests found
              </p>
            </motion.div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block relative overflow-y-auto max-h-[600px] nice-scrollbars">
                <Table aria-label="Pending leave requests table" className="w-full table-auto">
                  <TableHeader className="sticky top-0 z-10 bg-bg-primary/80 backdrop-blur-sm border-b border-bg-muted">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                        Employee
                      </TableHead>
                      <TableHead className="hidden sm:table-cell font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                        Type
                      </TableHead>
                      <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                        Dates
                      </TableHead>
                      <TableHead className="hidden lg:table-cell font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                        Days
                      </TableHead>
                      <TableHead className="hidden xl:table-cell font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                        Status
                      </TableHead>
                      <TableHead className="w-[140px] text-right font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {paginatedLeaves.map((leave, index) => {
                        if (!leave.requester) return null;
                        const isProcessingThis = processingId === leave.id;

                        return (
                          <motion.tr
                            key={leave.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2, delay: index * 0.03 }}
                            className="group border-b border-bg-muted hover:bg-bg-secondary cursor-pointer transition-colors"
                            onClick={() => handleRowClick(leave as any)}
                          >
                            <TableCell className="py-4">
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
                            </TableCell>
                            <TableCell className="hidden sm:table-cell py-4">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "font-medium text-xs whitespace-nowrap",
                                  getLeaveTypeColor(leave.type)
                                )}
                              >
                                {leaveTypeLabel[leave.type] ?? leave.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-4">
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
                            </TableCell>
                            <TableCell className="hidden lg:table-cell py-4">
                              <div className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                  {leave.workingDays}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden xl:table-cell py-4">
                              <StatusBadge status={leave.status} />
                            </TableCell>
                            <TableCell className="py-4">
                              <div
                                className="flex items-center justify-end"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {(leave.status === "PENDING" ||
                                  leave.status === "SUBMITTED") && (
                                  <ApprovalActionButtons
                                    size="sm"
                                    onForward={() => handleForward(leave as any)}
                                    onReturn={() => handleQuickAction(leave as any, "return")}
                                    onCancel={() => handleQuickAction(leave as any, "reject")}
                                    disabled={isProcessingThis}
                                    loading={isProcessingThis}
                                    loadingAction={isProcessingThis ? "forward" : null}
                                  />
                                )}
                              </div>
                            </TableCell>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                <AnimatePresence mode="popLayout">
                  {paginatedLeaves.map((leave, index) => {
                    if (!leave.requester) return null;
                    const isProcessingThis = processingId === leave.id;

                    return (
                      <PendingLeaveCard
                        key={leave.id}
                        leave={leave as any}
                        index={index}
                        isProcessing={isProcessingThis}
                        onRowClick={(leave) => handleRowClick(leave as any)}
                        onForward={(leave) => handleForward(leave as any)}
                        onReturn={(l) => handleQuickAction(l as any, "return")}
                      />
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Pagination */}
              <div className="pt-4 border-t border-border-strong/50 dark:border-border-strong/50">
                <SimplePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  showPageInfo={true}
                />
              </div>
            </>
          )}
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
