"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ClipboardCheck, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { leaveTypeLabel } from "@/lib/ui";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LeaveDetailsModal } from "@/components/shared/LeaveDetailsModal";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLeaveData } from "@/components/providers/LeaveDataProvider";
import { CANCELABLE_STATUSES } from "@/hooks/useLeaveRequests";

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

const ITEMS_PER_PAGE = 5;

export function MyLeavesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedLeave, setSelectedLeave] = useState<LeaveRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
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
    return allRows.filter(row => {
      const status = row.status.toLowerCase();
      switch (selectedFilter) {
        case "pending":
          return status === "submitted" || status === "pending" || status === "cancellation_requested";
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

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-8">
      {/* Header */}
      <header className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-1">My Leave Requests</h1>
          <p className="text-sm text-muted-foreground">
            Track your submitted leave applications and manage requests.
          </p>
        </div>
      </header>

      {/* Status Filter Pills */}
      <Card className="bg-white/70 dark:bg-neutral-900/50 border border-neutral-200/70 dark:border-neutral-800/70 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {FILTER_OPTIONS.map((option) => {
              const isActive = selectedFilter === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => handleFilterChange(option.value)}
                  className={cn(
                    "px-4 py-1.5 rounded-full border text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm hover:bg-indigo-700"
                      : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-gray-600 dark:text-slate-300">
              Loading...
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-red-600 dark:text-red-400" role="alert">
              Failed to load requests
            </CardContent>
          </Card>
        ) : filteredRows.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={ClipboardCheck}
                title="No leave requests"
                description={selectedFilter === "all" 
                  ? "Start by applying for your first leave request."
                  : `No ${selectedFilter} requests found.`}
              />
            </CardContent>
          </Card>
        ) : (
          <motion.div
            key={selectedFilter}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto md:overflow-x-visible overflow-y-auto max-h-[450px]">
                  <Table className="[&_[data-slot=table-container]]:overflow-visible [&_[data-slot=table-container]]:relative">
                    <TableHeader className="[&_tr]:sticky [&_tr]:top-0 [&_tr]:z-10 [&_tr]:bg-white [&_tr]:dark:bg-neutral-950 [&_tr]:backdrop-blur-sm">
                      <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-neutral-200/70 dark:border-neutral-800/70">
                        <TableHead className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Type</TableHead>
                        <TableHead className="hidden sm:table-cell text-xs font-medium text-neutral-700 dark:text-neutral-300">Dates</TableHead>
                        <TableHead className="hidden md:table-cell text-xs font-medium text-neutral-700 dark:text-neutral-300">Days</TableHead>
                        <TableHead className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Status</TableHead>
                        <TableHead className="hidden lg:table-cell text-xs font-medium text-neutral-700 dark:text-neutral-300">Updated</TableHead>
                        <TableHead className="text-right text-xs font-medium text-neutral-700 dark:text-neutral-300">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedRows.map((row, index) => (
                        <TableRow 
                          key={row.id} 
                          className={cn(
                            "hover:bg-muted/40 cursor-pointer transition-colors",
                            index % 2 === 0 && "bg-white dark:bg-neutral-900/50"
                          )}
                          onClick={() => {
                            setSelectedLeave(row);
                            setModalOpen(true);
                          }}
                        >
                          <TableCell className="font-medium text-sm text-neutral-900 dark:text-neutral-100">
                            {leaveTypeLabel[row.type] ?? row.type}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-gray-600 dark:text-slate-300">
                            {formatDate(row.startDate)} → {formatDate(row.endDate)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-gray-600 dark:text-slate-300">
                            {row.workingDays}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={row.status} />
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-gray-600 dark:text-slate-300">
                            {formatDate(row.updatedAt)}
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            {CANCELABLE_STATUSES.has(row.status) ? (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                    aria-label="Cancel request"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Cancel this request?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will mark the request as cancelled. Approvers will no longer see it.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Keep</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => cancelRequest(row.id)}>
                                      Cancel Request
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            ) : (
                              <span className="text-xs text-gray-500 dark:text-slate-400">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

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
                  <ChevronLeft className="w-4 h-4" />
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
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={cn(
                          "w-8 h-8 p-0",
                          currentPage === pageNum && "bg-indigo-600 hover:bg-indigo-700"
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
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
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
