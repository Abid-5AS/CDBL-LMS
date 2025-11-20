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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
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
import { Wallet, ArrowRight, CalendarPlus, Info } from "lucide-react";
import { SortedTimelineAdapter } from "@/components/shared/timeline-adapters";
import { LeaveSectionNav } from "@/components/layout/SectionNav";

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
  { value: "returned", label: "Need Action" },
  { value: "pending", label: "Under Review" },
  { value: "approved", label: "Approved" },
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
    title: "Under Review",
    color:
      "bg-data-info/80 hover:bg-data-info dark:bg-data-info/70 dark:hover:bg-data-info/80",
    cardContent: (
      <div className="p-6 h-full flex flex-col justify-center">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">Under Review</h3>
          <p className="text-sm text-muted-foreground">
            Approvers are processing these requests. No action required unless returned.
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
  {
    id: "returned",
    title: "Need Action",
    color:
      "bg-data-warning/90 hover:bg-data-warning dark:bg-data-warning/80 dark:hover:bg-data-warning/90",
    cardContent: (
      <div className="p-6 h-full flex flex-col justify-center">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">Needs Your Attention</h3>
          <p className="text-sm text-muted-foreground">
            Returned items that must be edited or cancelled promptly
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "cancelled",
    title: "Cancelled",
    color:
      "bg-muted/80 hover:bg-muted dark:bg-muted/60 dark:hover:bg-muted/80",
    cardContent: (
      <div className="p-6 h-full flex flex-col justify-center">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">Cancelled Requests</h3>
          <p className="text-sm text-muted-foreground">
            Requests you or an approver cancelled
          </p>
        </div>
      </div>
    ),
  },
];

const UNDER_REVIEW_STATUSES = new Set([
  "submitted",
  "pending",
  "cancellation_requested",
  "recalled",
]);

const ACTION_REQUIRED_STATUSES = new Set(["returned"]);

const QUICK_BALANCE_TYPES = [
  { key: "EARNED", label: "Earned", helper: "Carry-forward eligible" },
  { key: "CASUAL", label: "Casual", helper: "Expires Dec 31" },
  { key: "MEDICAL", label: "Medical", helper: "Certificate >3 days" },
] as const;

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
          return UNDER_REVIEW_STATUSES.has(status);
        case "returned":
          return ACTION_REQUIRED_STATUSES.has(status);
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
        const status = row.status.toLowerCase();
        if (UNDER_REVIEW_STATUSES.has(status)) {
          acc.underReview += 1;
        } else if (ACTION_REQUIRED_STATUSES.has(status)) {
          acc.needAction += 1;
        } else if (status === "approved") {
          acc.approved += 1;
        }
        return acc;
      },
      { underReview: 0, approved: 0, needAction: 0 }
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
    <TooltipProvider delayDuration={100}>
      <div className="max-w-6xl mx-auto space-y-6 py-8 px-4 sm:px-6 lg:px-0">
        <LeaveSectionNav />
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
        <div className="surface-card px-4 py-4 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                Quick balance snapshot
              </p>
              <p className="text-xs text-muted-foreground">
                Full history, conversion rules, and statements live on the Balance page.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Wallet className="size-4" aria-hidden="true" />}
              onClick={() => router.push("/balance")}
            >
              Open Balance
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {QUICK_BALANCE_TYPES.map((type) => (
              <div
                key={type.key}
                className="rounded-2xl border border-border/70 bg-muted/30 px-3 py-3"
              >
                <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                  {type.label}
                </p>
                <p className="text-xl font-semibold text-foreground">
                  {Math.max(0, Math.round(balanceData?.[type.key] ?? 0))}d
                </p>
                <p className="text-[11px] text-muted-foreground">{type.helper}</p>
              </div>
            ))}
          </div>
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
              Separate tasks that need your input from items approvers are reviewing.
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
                                row.status === "APPROVED" ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="inline-flex">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0 text-muted-foreground cursor-not-allowed"
                                          aria-label="Approved leave cancellation info"
                                          disabled
                                        >
                                          <Info className="size-4" aria-hidden="true" />
                                        </Button>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="left" className="max-w-xs">
                                      <p className="text-xs">
                                        Approved leave cancellations require manager approval.
                                        Use the Action Center to submit a cancellation request.
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
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
                                )
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
                        Under Review
                      </p>
                      <p className="text-2xl font-semibold text-foreground">
                        {summaryStats.underReview}
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
                        Need Your Attention
                      </p>
                      <p className="text-2xl font-semibold text-data-warning">
                        {summaryStats.needAction}
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
    </TooltipProvider>
  );
}
