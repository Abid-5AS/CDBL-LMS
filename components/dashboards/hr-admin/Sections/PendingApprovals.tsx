"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowRight,
  X,
  RotateCcw,
  Search,
  Calendar,
  User,
  Clock,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { leaveTypeLabel } from "@/lib/ui";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ReviewModal } from "@/components/shared/ReviewModal";
import useSWR from "swr";
import { LeaveStatus } from "@prisma/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const STATUS_TABS = [
  { value: "PENDING", label: "Pending" },
  { value: "RETURNED", label: "Returned" },
  { value: "CANCELLED", label: "Cancelled" },
];

// Enhanced color mapping with Material You palette
const getLeaveTypeColor = (type: string): string => {
  switch (type) {
    case "CASUAL":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50";
    case "EARNED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50";
    case "MEDICAL":
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-800/50";
  }
};

type PendingLeaveRequestsTableProps = {
  onRowClick?: (leave: LeaveRequest) => void;
};

const ITEMS_PER_PAGE = 10;

export function PendingLeaveRequestsTable({
  onRowClick,
}: PendingLeaveRequestsTableProps = {}) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [statusTab, setStatusTab] = useState("PENDING");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionType, setActionType] = useState<
    "forward" | "reject" | "return" | null
  >(null);

  const { data, isLoading, error, mutate } = useSWR<{ items: LeaveRequest[] }>(
    "/api/approvals",
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const allLeaves: LeaveRequest[] = useMemo(
    () => (Array.isArray(data?.items) ? data.items : []),
    [data?.items]
  );

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

    // Search filter (using debounced value)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
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
  }, [allLeaves, statusTab, debouncedSearchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredLeaves.length / ITEMS_PER_PAGE);
  const paginatedLeaves = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLeaves.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLeaves, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusTab, debouncedSearchQuery]);

  // Handle modal open/close
  const handleModalOpenChange = useCallback((open: boolean) => {
    setModalOpen(open);
    if (!open) {
      // Clear all state when closing
      setActionType(null);
      setSelectedLeave(null);
    }
  }, []);

  // Handle row click to show details
  const handleRowClick = useCallback(
    (leave: LeaveRequest) => {
      // Clear any pending actions and open modal
      setActionType(null);
      setSelectedLeave(leave);
      setModalOpen(true);
      onRowClick?.(leave);
    },
    [onRowClick]
  );

  const handleForward = useCallback(
    async (leave: LeaveRequest) => {
      try {
        const res = await fetch(`/api/leaves/${leave.id}/forward`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to forward request");
        }
        toast.success("Request forwarded successfully");
        await mutate();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        toast.error(message);
      }
    },
    [mutate]
  );

  const handleQuickAction = useCallback(
    (leave: LeaveRequest, action: "reject" | "return") => {
      // Set leave and action, then open modal
      setSelectedLeave(leave);
      setActionType(action);
      setModalOpen(true);
    },
    []
  );

  const handleActionComplete = useCallback(async () => {
    await mutate();
    // Clear all state and close modal
    setModalOpen(false);
    setActionType(null);
    setSelectedLeave(null);
  }, [mutate]);

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center text-sm text-muted-foreground">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <p className="mt-2">Loading requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center text-sm text-red-600">
        Failed to load requests
      </div>
    );
  }

  if (allLeaves.length === 0 && !searchQuery) {
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
      <div className="glass-card rounded-2xl overflow-hidden backdrop-blur-lg bg-white/60 dark:bg-neutral-950/60 border border-neutral-200/70 dark:border-neutral-800/70 shadow-lg">
        <div className="space-y-4 p-6">
          {/* Tab Chips */}
          <div className="overflow-x-auto scrollbar-hide tablist-pad">
            <StatusTabChips
              options={STATUS_TABS}
              value={statusTab}
              onChange={setStatusTab}
            />
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by employee, type, or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/50 dark:bg-neutral-900/50 border-neutral-200/50 dark:border-neutral-800/50"
            />
          </div>

          {/* Table/List */}
          {filteredLeaves.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-xl p-12 text-center"
            >
              <p className="text-sm text-muted-foreground">
                No pending requests
              </p>
            </motion.div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block relative overflow-y-auto overflow-x-hidden max-h-[450px] border border-neutral-200/50 dark:border-neutral-800/50 rounded-xl nice-scrollbars">
                <Table
                  aria-label="Pending leave requests table"
                  className="w-full table-fixed"
                >
                  <TableHeader className="sticky top-0 z-10 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-sm border-b border-neutral-200/50 dark:border-neutral-800/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[25%] font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                        Employee
                      </TableHead>
                      <TableHead className="w-[15%] font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                        Type
                      </TableHead>
                      <TableHead className="w-[20%] font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                        Dates
                      </TableHead>
                      <TableHead className="w-[10%] font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                        Days
                      </TableHead>
                      <TableHead className="w-[15%] font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                        Status
                      </TableHead>
                      <TableHead className="w-[15%] text-right font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {paginatedLeaves.map((leave, index) => {
                        if (!leave.requester) return null;
                        return (
                          <motion.tr
                            key={leave.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15, delay: index * 0.02 }}
                            onClick={() => handleRowClick(leave)}
                            className={cn(
                              "group hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all duration-200 cursor-pointer border-b border-neutral-200/30 dark:border-neutral-800/30",
                              index % 2 === 0
                                ? "bg-white/30 dark:bg-neutral-900/30"
                                : "bg-white/50 dark:bg-neutral-900/50"
                            )}
                          >
                            <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis py-4">
                              <div
                                className="font-medium truncate text-sm"
                                title={leave.requester.name}
                              >
                                {leave.requester.name}
                              </div>
                              <div
                                className="text-xs text-muted-foreground truncate mt-0.5"
                                title={leave.requester.email}
                              >
                                {leave.requester.email}
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis py-4">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "font-medium text-xs",
                                  getLeaveTypeColor(leave.type)
                                )}
                              >
                                {leaveTypeLabel[leave.type] ?? leave.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis py-4 text-slate-600 dark:text-slate-400 text-sm">
                              {formatDate(leave.startDate)} →{" "}
                              {formatDate(leave.endDate)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis py-4 text-slate-600 dark:text-slate-400 text-sm font-medium">
                              {leave.workingDays}
                            </TableCell>
                            <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis py-4">
                              <StatusBadge status={leave.status} />
                            </TableCell>
                            <TableCell
                              className="text-right whitespace-nowrap py-4"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="inline-flex items-center gap-1.5">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleForward(leave);
                                      }}
                                      className="h-7 w-7 p-0 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
                                    >
                                      <ArrowRight className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Forward</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleQuickAction(leave, "reject");
                                      }}
                                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-300 dark:hover:border-red-800 transition-all"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Reject</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleQuickAction(leave, "return");
                                      }}
                                      className="h-7 w-7 p-0 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:border-amber-300 dark:hover:border-amber-700 transition-all"
                                    >
                                      <RotateCcw className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Return</TooltipContent>
                                </Tooltip>
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
                    return (
                      <motion.div
                        key={leave.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15, delay: index * 0.02 }}
                        onClick={() => handleRowClick(leave)}
                        className="glass-card rounded-xl p-4 border border-neutral-200/50 dark:border-neutral-800/50 hover:shadow-lg hover:scale-[1.01] transition-all cursor-pointer backdrop-blur-lg bg-white/60 dark:bg-neutral-950/60"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-base mb-1 truncate">
                              {leave.requester.name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate mb-2">
                              {leave.requester.email}
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                getLeaveTypeColor(leave.type)
                              )}
                            >
                              {leaveTypeLabel[leave.type] ?? leave.type}
                            </Badge>
                          </div>
                          <StatusBadge status={leave.status} />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-3">
                          <span>
                            {formatDate(leave.startDate)} →{" "}
                            {formatDate(leave.endDate)}
                          </span>
                          <span>•</span>
                          <span>{leave.workingDays} days</span>
                        </div>
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleForward(leave);
                            }}
                            className="flex-1 h-8 text-xs"
                          >
                            <ArrowRight className="h-3 w-3 mr-1" />
                            Forward
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickAction(leave, "reject");
                            }}
                            className="flex-1 h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickAction(leave, "return");
                            }}
                            className="flex-1 h-8 text-xs"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Return
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between pt-4 mt-3 border-t border-neutral-200/50 dark:border-neutral-800/50"
            >
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredLeaves.length)}{" "}
                of {filteredLeaves.length} requests
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8"
                >
                  Previous
                </Button>
                <div className="text-sm text-muted-foreground px-3">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="h-8"
                >
                  Next
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Unified Review Modal - handles both viewing details and actions */}
      {selectedLeave && (
        <ReviewModal
          open={modalOpen}
          onOpenChange={handleModalOpenChange}
          leaveRequest={selectedLeave}
          onActionComplete={handleActionComplete}
          initialAction={actionType || undefined}
        />
      )}
      <style jsx>{`
        .tablist-pad [role="tablist"] {
          padding: 8px 12px;
        }
        /* Hide horizontal scrollbar and beautify vertical scrollbars */
        .nice-scrollbars {
          overflow-x: hidden !important;
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.3) transparent;
        }
        .nice-scrollbars::-webkit-scrollbar {
          width: 6px;
        }
        .nice-scrollbars::-webkit-scrollbar-thumb {
          border-radius: 3px;
          background: rgba(148, 163, 184, 0.4);
        }
        .nice-scrollbars::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.6);
        }
        .nice-scrollbars::-webkit-scrollbar-track {
          background: transparent;
        }
        .dark .nice-scrollbars {
          scrollbar-color: rgba(100, 116, 139, 0.3) transparent;
        }
        .dark .nice-scrollbars::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.4);
        }
        .dark .nice-scrollbars::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.6);
        }
        /* Table cell text overflow */
        .table-fixed th,
        .table-fixed td {
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }
        /* Glass card styling */
        .glass-card {
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .glass-modal {
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
      `}</style>
    </TooltipProvider>
  );
}
