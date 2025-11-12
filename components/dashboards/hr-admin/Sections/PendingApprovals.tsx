"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  X,
  RotateCcw,
  Search,
  Calendar,
  User,
  Clock,
  Loader2,
} from "lucide-react";
import { LeaveStatus } from "@prisma/client";

// UI Components (barrel export)
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Badge,
  Input,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui";

// Shared Components (barrel export)
import {
  StatusBadge,
  ReviewModal,
  ApprovalActionButtons,
} from "@/components/shared";

// Lib utilities (barrel export)
import { cn, formatDate, leaveTypeLabel } from "@/lib";

// Hook
import { usePendingRequests } from "@/components/dashboards/dept-head/hooks/usePendingRequests";

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

const STATUS_TABS = [
  { value: "PENDING", label: "Pending" },
  { value: "RETURNED", label: "Returned" },
  { value: "CANCELLED", label: "Cancelled" },
];

// Enhanced color mapping with Material You palette
const getLeaveTypeColor = (type: string): string => {
  switch (type) {
    case "CASUAL":
      return "bg-data-info/10 text-data-info border-data-info/20";
    case "EARNED":
      return "bg-data-success/10 text-data-success border-data-success/20";
    case "MEDICAL":
      return "bg-data-error/10 text-data-error border-data-error/20";
    default:
      return "bg-bg-secondary text-text-secondary border-bg-muted";
  }
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
    searchInput,
    setSearchInput,
    urlFilters,
    setUrlFilters,
    handleSingleAction,
    isProcessing,
    refresh,
    requests,
    isLoading: hookIsLoading,
    error: hookError,
  } = usePendingRequests();

  // Local state
  const [statusTab, setStatusTab] = useState("PENDING");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionType, setActionType] = useState<
    "forward" | "reject" | "return" | null
  >(null);
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

  // Filter by status tab and search
  const filteredLeaves = useMemo(() => {
    let filtered = allLeaves.filter((leave) => leave.requester);

    // Status tab filter
    if (statusTab === "PENDING") {
      filtered = filtered.filter(
        (leave) => leave.status === "PENDING" || leave.status === "SUBMITTED"
      );
    } else if (statusTab === "RETURNED") {
      filtered = filtered.filter((leave) => leave.status === "RETURNED");
    } else if (statusTab === "CANCELLED") {
      filtered = filtered.filter((leave) => leave.status === "CANCELLED");
    }

    // Search filter
    if (searchInput.trim()) {
      const query = searchInput.toLowerCase();
      filtered = filtered.filter(
        (leave) =>
          leave.requester?.name?.toLowerCase().includes(query) ||
          leave.requester?.email?.toLowerCase().includes(query) ||
          leave.type.toLowerCase().includes(query) ||
          (leaveTypeLabel[leave.type]?.toLowerCase().includes(query) ??
            false) ||
          leave.reason?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allLeaves, statusTab, searchInput]);

  // Pagination
  const totalPages = Math.ceil(filteredLeaves.length / ITEMS_PER_PAGE);
  const paginatedLeaves = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLeaves.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLeaves, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusTab, searchInput]);

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

  const handleQuickAction = (
    leave: LeaveRequest,
    action: "reject" | "return"
  ) => {
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
      <div className="glass-card rounded-2xl p-12 text-center text-sm text-muted-foreground">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <p className="mt-2">Loading requests...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center text-sm text-data-error">
        Failed to load requests
      </div>
    );
  }

  // Empty state
  if (allLeaves.length === 0 && !searchInput) {
    return (
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-6 pt-6">
          <h3 className="text-lg font-semibold">Pending Requests</h3>
        </div>
        <div className="p-6">
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">No pending requests</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="glass-card rounded-2xl overflow-hidden backdrop-blur-lg bg-bg-primary/60 border border-bg-muted shadow-lg">
        <div className="space-y-4 p-6">
          {/* Header with Title and Export Button */}
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
                <Table
                  aria-label="Pending leave requests table"
                  className="w-full table-auto"
                >
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
                            onClick={() => handleRowClick(leave)}
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
                                    onForward={() => handleForward(leave)}
                                    onReturn={() =>
                                      handleQuickAction(leave, "return")
                                    }
                                    onCancel={() =>
                                      handleQuickAction(leave, "reject")
                                    }
                                    disabled={isProcessingThis}
                                    loading={isProcessingThis}
                                    loadingAction={
                                      isProcessingThis ? "forward" : null
                                    }
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
                      <motion.div
                        key={leave.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                        className="glass-card p-4 rounded-xl border border-border-strong/50 dark:border-border-strong/50 cursor-pointer hover:shadow-md transition-all"
                        onClick={() => handleRowClick(leave)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="rounded-full bg-gradient-to-br from-card-action to-card-summary p-2">
                              <User className="h-4 w-4 text-text-inverted" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {leave.requester.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {leave.requester.email}
                              </p>
                            </div>
                          </div>
                          <StatusBadge status={leave.status} />
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs font-medium",
                                getLeaveTypeColor(leave.type)
                              )}
                            >
                              {leaveTypeLabel[leave.type] ?? leave.type}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{leave.workingDays} days</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                              {formatDate(leave.startDate)} →{" "}
                              {formatDate(leave.endDate)}
                            </span>
                          </div>
                        </div>

                        {(leave.status === "PENDING" ||
                          leave.status === "SUBMITTED") && (
                          <div
                            className="flex gap-2 pt-3 border-t border-border-strong/50 dark:border-border-strong/50"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-data-info border-data-info hover:bg-data-info"
                              onClick={() => handleForward(leave)}
                              disabled={isProcessingThis}
                            >
                              {isProcessingThis ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <ArrowRight className="h-4 w-4 mr-2" />
                              )}
                              Forward
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-data-warning border-data-warning hover:bg-data-warning"
                              onClick={() => handleQuickAction(leave, "return")}
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Return
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-border-strong/50 dark:border-border-strong/50">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
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
