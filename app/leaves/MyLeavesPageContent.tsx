"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardCheck,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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
  EmptyState,
  Button,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
  EnhancedSmoothTab,
} from "@/components/ui";

// Shared Components (barrel export)
import { StatusBadge, LeaveDetailsModal } from "@/components/shared";
import { useLeaveData } from "@/components/providers";

// Lib utilities (barrel export)
import { cn, formatDate, leaveTypeLabel } from "@/lib";
import { CANCELABLE_STATUSES } from "@/hooks/useLeaveRequests";
import useSWR from "swr";
import { apiFetcher } from "@/lib/apiClient";
import Link from "next/link";
import { Wallet, ArrowRight } from "lucide-react";

type LeaveRow = {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  status:
    | "SUBMITTED"
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "CANCELLED"
    | "RETURNED"
    | "CANCELLATION_REQUESTED"
    | "RECALLED";
  updatedAt: string;
  reason?: string;
};

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "returned", label: "Returned" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

// Tab items for SmoothTab
const LEAVE_TAB_ITEMS = [
  {
    id: "all",
    title: "All",
    color: "bg-slate-500 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500",
    cardContent: (
      <div className="p-6 h-full flex flex-col justify-center">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-text-primary">All Requests</h3>
          <p className="text-sm text-muted-foreground">
            View all your leave requests across all statuses
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "pending",
    title: "Pending",
    color: "bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600",
    cardContent: (
      <div className="p-6 h-full flex flex-col justify-center">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-text-primary">Pending Approval</h3>
          <p className="text-sm text-muted-foreground">
            Requests awaiting manager or HR approval
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "approved",
    title: "Approved",
    color: "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600",
    cardContent: (
      <div className="p-6 h-full flex flex-col justify-center">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-text-primary">Approved Leaves</h3>
          <p className="text-sm text-muted-foreground">
            Successfully approved leave requests
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "rejected",
    title: "Rejected",
    color: "bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600",
    cardContent: (
      <div className="p-6 h-full flex flex-col justify-center">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-text-primary">Rejected Requests</h3>
          <p className="text-sm text-muted-foreground">
            Requests that were not approved
          </p>
        </div>
      </div>
    ),
  },
];

const ITEMS_PER_PAGE = 5;

export function MyLeavesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedLeave, setSelectedLeave] = useState<LeaveRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [animationDirection, setAnimationDirection] = useState(0);

  // Fetch data first
  const { data, isLoading, error, mutate } = useLeaveData();

  // Get all rows from data
  const allRows: LeaveRow[] = Array.isArray(data?.items) ? data.items : [];

  // Get initial filter and highlight from URL
  const urlFilter = searchParams.get("status") || "all";
  const highlightId = searchParams.get("highlight") || searchParams.get("id");
  const [selectedFilter, setSelectedFilter] = useState(urlFilter);

  // Update filter when URL changes
  useEffect(() => {
    const urlFilter = searchParams.get("status") || "all";
    setSelectedFilter(urlFilter);
    setCurrentPage(1); // Reset to first page when filter changes
  }, [searchParams]);

  // Handle highlight ID when leaves data is loaded
  useEffect(() => {
    if (highlightId && allRows.length > 0) {
      const leaveId = parseInt(highlightId, 10);
      const leave = allRows.find((row) => row.id === leaveId);
      if (leave) {
        setSelectedLeave(leave);
        setModalOpen(true);
      }
    }
  }, [highlightId, allRows]);

  // Update URL when filter changes
  const handleFilterChange = (value: string) => {
    setSelectedFilter(value);
    setCurrentPage(1); // Reset to first page
    if (value === "all") {
      router.push("/leaves");
    } else {
      router.push(`/leaves?status=${value}`);
    }
  };

  const filteredRows = useMemo(() => {
    if (selectedFilter === "all") return allRows;
    return allRows.filter((row) => {
      const status = row.status.toLowerCase();
      switch (selectedFilter) {
        case "pending":
          return (
            status === "submitted" ||
            status === "pending" ||
            status === "cancellation_requested"
          );
        case "returned":
          return status === "returned";
        case "cancelled":
          return status === "cancelled" || status === "recalled";
        default:
          return status === selectedFilter;
      }
    });
  }, [allRows, selectedFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredRows.length / ITEMS_PER_PAGE);
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredRows.slice(start, end);
  }, [filteredRows, currentPage]);

  const cancelRequest = async (id: number) => {
    try {
      const res = await fetch(`/api/leaves/${id}`, { method: "PATCH" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error("Couldn't cancel request", {
          description: body?.error ?? "Please try again.",
        });
        return;
      }
      toast.success("Request cancelled");
      mutate();
    } catch (err) {
      console.error(err);
      toast.error("Couldn't cancel request", {
        description: "Network error. Please try again.",
      });
    }
  };

  // Fetch balance data for the strip
  const { data: balanceData, isLoading: balanceLoading } = useSWR(
    "/api/balance/mine",
    apiFetcher,
    { revalidateOnFocus: false }
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-8">
      {/* Header */}
      <header className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary mb-1">
            My Leave Requests
          </h1>
          <p className="text-sm text-muted-foreground">
            Track your submitted leave applications and manage requests.
          </p>
        </div>
      </header>

      {/* Balance Strip */}
      {!balanceLoading && balanceData && (
        <Card className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Wallet className="size-4 text-primary" aria-hidden="true" />
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Earned:</span>
                    <span className="font-semibold text-text-primary">{balanceData.EARNED || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Casual:</span>
                    <span className="font-semibold text-text-primary">{balanceData.CASUAL || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Medical:</span>
                    <span className="font-semibold text-text-primary">{balanceData.MEDICAL || 0}</span>
                  </div>
                </div>
              </div>
              <Link
                href="/balance"
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
              >
                View Details
                <ArrowRight className="size-3" aria-hidden="true" />
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Filter Tabs */}
      <div className="flex justify-center mb-6">
        <EnhancedSmoothTab
          items={LEAVE_TAB_ITEMS}
          value={selectedFilter}
          onChange={handleFilterChange}
          onDirectionChange={setAnimationDirection}
          className="bg-bg-primary/70 border border-bg-muted backdrop-blur-sm"
          showCardContent={false}
        />
      </div>

      {/* Requests Table */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-text-secondary">
              Loading...
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent
              className="p-8 text-center text-sm text-data-error dark:text-data-error"
              role="alert"
            >
              Failed to load requests
            </CardContent>
          </Card>
        ) : filteredRows.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={ClipboardCheck}
                title="No leave requests"
                description={
                  selectedFilter === "all"
                    ? "Start by applying for your first leave request."
                    : `No ${selectedFilter} requests found.`
                }
              />
            </CardContent>
          </Card>
        ) : (
          <motion.div
            key={selectedFilter}
            initial={{ 
              opacity: 0, 
              x: animationDirection > 0 ? 100 : -100
            }}
            animate={{ 
              opacity: 1, 
              x: 0
            }}
            exit={{ 
              opacity: 0, 
              x: animationDirection < 0 ? 100 : -100
            }}
            transition={{ 
              duration: 0.4,
              ease: [0.32, 0.72, 0, 1]
            }}
          >
            <div className="max-h-[450px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-medium">
                      Type
                    </TableHead>
                    <TableHead className="hidden sm:table-cell text-xs font-medium">
                      Dates
                    </TableHead>
                    <TableHead className="hidden md:table-cell text-xs font-medium">
                      Days
                    </TableHead>
                    <TableHead className="text-xs font-medium">
                      Status
                    </TableHead>
                    <TableHead className="hidden lg:table-cell text-xs font-medium">
                      Updated
                    </TableHead>
                    <TableHead className="text-right text-xs font-medium">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                      {paginatedRows.map((row, index) => (
                        <TableRow
                          key={row.id}
                          className={cn(
                            "hover:bg-muted/40 cursor-pointer transition-colors",
                            index % 2 === 0 && "bg-bg-primary dark:bg-bg-secondary/50"
                          )}
                          onClick={() => {
                            setSelectedLeave(row);
                            setModalOpen(true);
                          }}
                        >
                          <TableCell className="font-medium text-sm text-text-secondary dark:text-text-secondary">
                            {leaveTypeLabel[row.type] ?? row.type}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-text-secondary dark:text-text-secondary">
                            {formatDate(row.startDate)} →{" "}
                            {formatDate(row.endDate)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-text-secondary dark:text-text-secondary">
                            {row.workingDays}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={row.status} />
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-text-secondary dark:text-text-secondary">
                            {formatDate(row.updatedAt)}
                          </TableCell>
                          <TableCell
                            className="text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {CANCELABLE_STATUSES.has(row.status) ? (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-data-error hover:bg-data-error dark:hover:bg-data-error/20"
                                    aria-label="Cancel request"
                                  >
                                    <XCircle className="size-4" aria-hidden="true" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Cancel this request?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will mark the request as cancelled.
                                      Approvers will no longer see it.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Keep</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => cancelRequest(row.id)}
                                    >
                                      Cancel Request
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            ) : (
                              <span className="text-xs text-text-secondary dark:text-text-secondary">
                                —
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={
                          currentPage === pageNum ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={cn(
                          "w-8 h-8 p-0",
                          currentPage === pageNum &&
                            "bg-card-action hover:bg-card-action"
                        )}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Button>
                <span className="text-xs text-muted-foreground ml-2">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leave Details Modal */}
      <LeaveDetailsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        leave={selectedLeave}
      />
    </div>
  );
}
