"use client";

import { useState, useMemo, useEffect, useCallback, type ReactNode } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardCheck,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Table2,
  History,
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
import {
  StatusBadge,
  LeaveDetailsModal,
  EmptyState,
  SharedTimeline,
} from "@/components/shared";
import { useLeaveData } from "@/components/providers";

// Lib utilities (barrel export)
import { cn, formatDate, leaveTypeLabel } from "@/lib";
import { CANCELABLE_STATUSES } from "@/hooks/useLeaveRequests";
import useSWR from "swr";
import { apiFetcher } from "@/lib/apiClient";
import Link from "next/link";
import { Wallet, ArrowRight } from "lucide-react";
import { SortedTimelineAdapter } from "@/components/shared/timeline-adapters";

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
    color: "bg-muted hover:bg-muted/80 dark:bg-muted dark:hover:bg-muted/90",
    cardContent: (
      <div className="p-6 h-full flex flex-col justify-center">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">All Requests</h3>
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
    color: "bg-data-warning/80 hover:bg-data-warning dark:bg-data-warning/70 dark:hover:bg-data-warning/80",
    cardContent: (
      <div className="p-6 h-full flex flex-col justify-center">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">Pending Approval</h3>
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
    color: "bg-data-success/80 hover:bg-data-success dark:bg-data-success/70 dark:hover:bg-data-success/80",
    cardContent: (
      <div className="p-6 h-full flex flex-col justify-center">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">Approved Leaves</h3>
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
    color: "bg-data-error/80 hover:bg-data-error dark:bg-data-error/70 dark:hover:bg-data-error/80",
    cardContent: (
      <div className="p-6 h-full flex flex-col justify-center">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">Rejected Requests</h3>
          <p className="text-sm text-muted-foreground">
            Requests that were not approved
          </p>
        </div>
      </div>
    ),
  },
];

const ITEMS_PER_PAGE = 5;
const VIEW_MODES = [
  { id: "table", label: "Table View", icon: Table2 },
  { id: "timeline", label: "Timeline", icon: History },
];
type ViewMode = (typeof VIEW_MODES)[number]["id"];

export function MyLeavesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedLeave, setSelectedLeave] = useState<LeaveRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [animationDirection, setAnimationDirection] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // Fetch data first
  const { data, isLoading, error, mutate } = useLeaveData();

  // Get all rows from data
  const allRows: LeaveRow[] = useMemo(() => {
    return Array.isArray(data?.items) ? data.items : [];
  }, [data?.items]);

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

  const timelineItems = useMemo(() => {
    return SortedTimelineAdapter(filteredRows);
  }, [filteredRows]);

  const summaryStats = useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => {
        if (
          row.status === "SUBMITTED" ||
          row.status === "PENDING" ||
          row.status === "CANCELLATION_REQUESTED" ||
          row.status === "RECALLED"
        ) {
          acc.pending += 1;
        } else if (row.status === "APPROVED") {
          acc.approved += 1;
        } else if (row.status === "RETURNED" || row.status === "REJECTED") {
          acc.action += 1;
        }
        return acc;
      },
      { pending: 0, approved: 0, action: 0 }
    );
  }, [filteredRows]);

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

  const handleTimelineItemSelect = useCallback(
    (itemId: string) => {
      const numericId = Number(itemId.replace(/\D+/g, ""));
      if (!numericId) return;
      const leave = filteredRows.find((row) => row.id === numericId);
      if (leave) {
        setSelectedLeave(leave);
        setModalOpen(true);
      }
    },
    [filteredRows]
  );

  // Fetch balance data for the strip with proper typing
  const { data: balanceData, isLoading: balanceLoading } = useSWR<Record<string, number>>(
    "/api/balance/mine",
    apiFetcher,
    { revalidateOnFocus: false }
  );
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-8">
      <div className="surface-card p-6 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
              History
            </p>
            <h1 className="text-2xl font-semibold text-foreground">
              My Leave Requests
            </h1>
            <p className="text-sm text-muted-foreground">
              Track submissions, manage pending approvals, and see live updates.
            </p>
          </div>
          <div className="rounded-xl border border-border/70 px-4 py-3 text-sm text-muted-foreground">
            <p className="text-xs uppercase tracking-widest">Today</p>
            <p className="text-xl font-semibold text-foreground">{todayLabel}</p>
          </div>
        </div>
      </div>

      {!balanceLoading && balanceData && (
        <div className="surface-card px-4 py-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wallet className="size-4 text-primary" aria-hidden="true" />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                Earned:{" "}
                <span className="font-semibold text-foreground">
                  {balanceData.EARNED || 0}
                </span>
              </span>
              <span className="text-muted-foreground">
                Casual:{" "}
                <span className="font-semibold text-foreground">
                  {balanceData.CASUAL || 0}
                </span>
              </span>
              <span className="text-muted-foreground">
                Medical:{" "}
                <span className="font-semibold text-foreground">
                  {balanceData.MEDICAL || 0}
                </span>
              </span>
            </div>
          </div>
          <Link
            href="/balance"
            className="ml-auto text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            View balance details
            <ArrowRight className="size-3" aria-hidden="true" />
          </Link>
        </div>
      )}

      {/* Status Filter + View Toggle */}
      <div className="surface-card px-4 py-4 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
              Status Filters
            </p>
            <p className="text-sm text-muted-foreground">
              Focus on pending work or review past approvals.
            </p>
          </div>
          <div className="inline-flex rounded-full border border-border bg-background/80 p-1 gap-1">
            {VIEW_MODES.map((mode) => {
              const Icon = mode.icon;
              const isActive = viewMode === mode.id;
              return (
                <Button
                  key={mode.id}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "rounded-full px-4 py-2 text-sm",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setViewMode(mode.id as ViewMode)}
                >
                  <Icon className="size-4 mr-2" aria-hidden="true" />
                  {mode.label}
                </Button>
              );
            })}
          </div>
        </div>
        <EnhancedSmoothTab
          items={LEAVE_TAB_ITEMS}
          value={selectedFilter}
          onChange={handleFilterChange}
          onDirectionChange={setAnimationDirection}
          className="bg-bg-primary/70 border border-bg-muted backdrop-blur-sm"
          showCardContent={false}
        />
      </div>

      {/* Requests Table / Timeline */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <Card className="surface-card">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Loading leave history…
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="surface-card">
            <CardContent
              className="p-8 text-center text-sm text-data-error dark:text-data-error-strong"
              role="alert"
            >
              Failed to load requests
            </CardContent>
          </Card>
        ) : filteredRows.length === 0 ? (
          <Card className="surface-card">
            <CardContent className="p-0">
              <EmptyState
                icon={ClipboardCheck}
                title="No leave requests"
                description={
                  selectedFilter === "all"
                    ? "Start by applying for your first leave request."
                    : `No ${selectedFilter} requests found.`
                }
                action={
                  selectedFilter === "all"
                    ? {
                        label: "Apply for Leave",
                        href: "/leaves/apply",
                      }
                    : undefined
                }
              />
            </CardContent>
          </Card>
        ) : (
          <Card
            className={cn(
              "surface-card",
              viewMode === "table" ? "p-0 overflow-hidden" : "p-0"
            )}
          >
            <motion.div
              key={`${selectedFilter}-${viewMode}`}
              initial={{
                opacity: 0,
                x: animationDirection > 0 ? 100 : -100,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              exit={{
                opacity: 0,
                x: animationDirection < 0 ? 100 : -100,
              }}
              transition={{
                duration: 0.4,
                ease: [0.32, 0.72, 0, 1],
              }}
            >
              {viewMode === "table" ? (
                <>
                  <div className="max-h-[450px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs font-medium">Type</TableHead>
                          <TableHead className="hidden sm:table-cell text-xs font-medium">
                            Dates
                          </TableHead>
                          <TableHead className="hidden md:table-cell text-xs font-medium">
                            Days
                          </TableHead>
                          <TableHead className="text-xs font-medium">Status</TableHead>
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
                              {formatDate(row.startDate)} → {formatDate(row.endDate)}
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
                                      <AlertDialogTitle>Cancel this request?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will mark the request as cancelled. Approvers will no
                                        longer see it.
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

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4 px-4 pb-4">
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
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className={cn(
                                "w-8 h-8 p-0",
                                currentPage === pageNum && "bg-card-action hover:bg-card-action"
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
                        <ChevronRight className="size-4" aria-hidden="true" />
                      </Button>
                      <span className="text-xs text-muted-foreground ml-2">
                        Page {currentPage} of {totalPages}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-6 space-y-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                        Timeline View
                      </p>
                      <h2 className="text-xl font-semibold text-foreground">
                        Latest leave activity
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Tap any entry to open the detailed request.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => setViewMode("table")}>
                        Back to Table
                      </Button>
                      <Button variant="secondary" size="sm" asChild>
                        <Link href="/leaves/apply">Apply for Leave</Link>
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-border/70 p-3">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">
                        Pending / Submitted
                      </p>
                      <p className="text-2xl font-semibold text-foreground">
                        {summaryStats.pending}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 p-3">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">
                        Approved
                      </p>
                      <p className="text-2xl font-semibold text-data-success">
                        {summaryStats.approved}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 p-3">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">
                        Needs Attention
                      </p>
                      <p className="text-2xl font-semibold text-data-warning">
                        {summaryStats.action}
                      </p>
                    </div>
                  </div>
                  <SharedTimeline
                    items={timelineItems}
                    variant="requests"
                    dense
                    limit={12}
                    emptyState={
                      <EmptyState
                        icon={ClipboardCheck}
                        title="No history yet"
                        description="Requests matching this filter will appear here."
                      />
                    }
                    onItemClick={(item) => handleTimelineItemSelect(item.id)}
                  />
                </div>
              )}
            </motion.div>
          </Card>
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
