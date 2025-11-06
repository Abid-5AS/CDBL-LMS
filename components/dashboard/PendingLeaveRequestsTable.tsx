"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
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
import { ArrowRight, X, RotateCcw, Search } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { leaveTypeLabel } from "@/lib/ui";
import StatusBadge from "@/app/dashboard/components/status-badge";
import { StatusTabChips } from "./StatusTabChips";
import { ReviewLeaveModal } from "./ReviewLeaveModal";
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

// Color mapping for leave types
const getLeaveTypeColor = (type: string): string => {
  switch (type) {
    case "CASUAL":
      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
    case "EARNED":
      return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800";
    case "MEDICAL":
      return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
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
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
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

  // Handle row click to show details
  const handleRowClick = useCallback(
    (leave: LeaveRequest) => {
      setSelectedLeave(leave);
      setDetailsModalOpen(true);
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
        toast.success("Request forwarded to HR Head");
        // Await mutate to ensure UI updates before any navigation
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
      setSelectedLeave(leave);
      setActionType(action);
      setModalOpen(true);
    },
    []
  );

  const handleActionComplete = useCallback(async () => {
    await mutate();
    setModalOpen(false);
    setSelectedLeave(null);
    setActionType(null);
  }, [mutate]);

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center text-sm text-muted-foreground">
        Loading...
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
    <>
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="space-y-4 p-6">
          {/* Tab Chips */}
          <div className="overflow-x-auto scrollbar-hide tablist-pad">
            <StatusTabChips
              options={STATUS_TABS}
              value={statusTab}
              onChange={setStatusTab}
            />
          </div>

          {/* Optional Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by employee, type, or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Table */}
          {filteredLeaves.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <p className="text-sm text-muted-foreground">
                No pending requests
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block relative overflow-y-auto overflow-x-hidden max-h-[450px] border rounded-lg nice-scrollbars">
                <Table
                  aria-label="Pending leave requests table"
                  className="w-full table-fixed"
                >
                  <TableHeader className="sticky top-0 z-10 bg-background dark:bg-neutral-900">
                    <TableRow>
                      <TableHead className="w-[25%]">Employee</TableHead>
                      <TableHead className="w-[15%]">Type</TableHead>
                      <TableHead className="w-[20%]">Dates</TableHead>
                      <TableHead className="w-[10%]">Days</TableHead>
                      <TableHead className="w-[15%]">Status</TableHead>
                      <TableHead className="w-[15%] text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLeaves.map((leave, index) => {
                      if (!leave.requester) return null;
                      return (
                        <TableRow
                          key={leave.id}
                          onClick={() => handleRowClick(leave)}
                          className={cn(
                            "hover:bg-muted/50 transition-colors cursor-pointer",
                            index % 2 === 0 ? "bg-background" : "bg-muted/30"
                          )}
                        >
                          <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">
                            <div
                              className="font-medium truncate"
                              title={leave.requester.name}
                            >
                              {leave.requester.name}
                            </div>
                            <div
                              className="text-xs text-muted-foreground truncate"
                              title={leave.requester.email}
                            >
                              {leave.requester.email}
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">
                            <Badge
                              variant="outline"
                              className={cn(
                                "font-medium",
                                getLeaveTypeColor(leave.type)
                              )}
                            >
                              {leaveTypeLabel[leave.type] ?? leave.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis text-slate-600 dark:text-slate-400">
                            {formatDate(leave.startDate)} →{" "}
                            {formatDate(leave.endDate)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis text-slate-600 dark:text-slate-400">
                            {leave.workingDays}
                          </TableCell>
                          <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">
                            <StatusBadge status={leave.status} />
                          </TableCell>
                          <TableCell
                            className="text-right whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="inline-flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleForward(leave);
                                }}
                                className="h-7 px-2 text-xs"
                                title="Forward"
                              >
                                <ArrowRight className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickAction(leave, "reject");
                                }}
                                className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                title="Reject"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickAction(leave, "return");
                                }}
                                className="h-7 px-2 text-xs"
                                title="Return"
                              >
                                <RotateCcw className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {paginatedLeaves.map((leave) => {
                  if (!leave.requester) return null;
                  return (
                    <div
                      key={leave.id}
                      onClick={() => handleRowClick(leave)}
                      className="glass-card rounded-xl p-4 border hover:shadow-md transition-shadow cursor-pointer"
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
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 mt-3 border-t">
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
                >
                  Previous
                </Button>
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
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
        </div>
      </div>

      {/* Details Modal (shown on row click) */}
      {selectedLeave && (
        <ReviewLeaveModal
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
          leaveRequest={selectedLeave}
          onActionComplete={handleActionComplete}
        />
      )}

      {/* Action Modal for Reject/Return */}
      {selectedLeave && actionType && (
        <ReviewLeaveModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          leaveRequest={selectedLeave}
          onActionComplete={handleActionComplete}
          initialAction={actionType}
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
      `}</style>
    </>
  );
}
