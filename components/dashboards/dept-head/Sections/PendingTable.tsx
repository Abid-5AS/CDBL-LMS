"use client";

import { useState } from "react";
import Link from "next/link";
import { LeaveType, LeaveStatus } from "@prisma/client";
import {
  Search,
  X,
  Inbox,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  RotateCcw,
  ArrowRight,
  XCircle,
} from "lucide-react";

// UI Components (barrel export)
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Badge,
  Input,
  Textarea,
  Label,
  Skeleton,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";

// Shared Components (barrel export)
import { StatusBadge, LeaveComparisonModal } from "@/components/shared";

// Lib utilities (barrel export)
import { formatDate, leaveTypeLabel, canPerformAction } from "@/lib";
import type { AppRole } from "@/lib/rbac";

// Local imports
import { usePendingRequests } from "../hooks/usePendingRequests";
import { DEFAULT_FILTER } from "@/types/filters";

// Status options - role-aware (DEPT_HEAD sees "Forwarded" instead of "Approved")
const getStatusOptions = (role: string) => {
  if (role === "DEPT_HEAD") {
    return [
      { value: "ALL", label: "All" },
      { value: "PENDING", label: "Pending" },
      { value: "FORWARDED", label: "Forwarded" },
      { value: "RETURNED", label: "Returned" },
      { value: "CANCELLED", label: "Cancelled" },
    ];
  }
  return [
    { value: "ALL", label: "All" },
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "RETURNED", label: "Returned" },
    { value: "CANCELLED", label: "Cancelled" },
  ];
};

// Type options
const TYPE_OPTIONS = [
  { value: "ALL", label: "All" },
  ...Object.values(LeaveType).map((type) => ({
    value: type,
    label: leaveTypeLabel[type] || type,
  })),
];

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
  isLoading: externalIsLoading = false,
  error: externalError,
  onMutate,
}: DeptHeadPendingTableProps) {
  const {
    searchInput,
    setSearchInput,
    urlFilters,
    setUrlFilters,
    clearFilters,
    hasActiveFilters,
    handleSingleAction,
    isProcessing,
    user,
    refresh,
  } = usePendingRequests();

  const userRole = user?.role || "DEPT_HEAD";
  const statusOptions = getStatusOptions(userRole);

  // Use external data if provided, otherwise use hook data
  const rows = data?.rows || [];
  const total = data?.total || 0;
  const isLoading = externalIsLoading;
  const error = externalError;

  // Local state for dialogs
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<any | null>(null);
  const [returnComment, setReturnComment] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
  const [selectedLeaveForComparison, setSelectedLeaveForComparison] = useState<
    any | null
  >(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const totalPages = Math.ceil(total / urlFilters.pageSize);

  // Action handlers
  const handleAction = async (
    leaveId: number,
    action: "approve" | "reject" | "return" | "forward" | "cancel",
    comment?: string
  ) => {
    setProcessingId(leaveId);
    await handleSingleAction(leaveId, action, comment);
    setProcessingId(null);

    // Refresh external data if provided
    if (onMutate) {
      await onMutate();
    } else {
      await refresh();
    }

    // Close dialogs
    setReturnDialogOpen(false);
    setForwardDialogOpen(false);
    setCancelDialogOpen(false);
    setSelectedLeave(null);
    setReturnComment("");
    setCancelReason("");
  };

  // Helper to get available actions for a leave type
  const getAvailableActions = (
    leaveType: LeaveType
  ): Array<"approve" | "forward" | "return" | "cancel"> => {
    const actions: Array<"approve" | "forward" | "return" | "cancel"> = [];
    const role = (user?.role || "DEPT_HEAD") as AppRole;

    if (canPerformAction(role, "FORWARD", leaveType)) {
      actions.push("forward");
    }

    actions.push("return");
    actions.push("cancel");

    return actions;
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="rounded-2xl border-muted/60 shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="rounded-2xl border-muted/60 shadow-sm">
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center text-data-error">
            <p>Failed to load pending requests</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => refresh()}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card
        className="rounded-2xl border-muted/60 shadow-sm"
        id="pending-requests-table"
      >
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Pending Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <Select
              value={urlFilters.status}
              onValueChange={(value) => setUrlFilters({ status: value as any })}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={urlFilters.type}
              onValueChange={(value) => setUrlFilters({ type: value as any })}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </div>

          {/* Table */}
          {rows.length === 0 ? (
            <div className="p-12 text-center bg-linear-to-br from-muted/30 to-muted/10 rounded-lg border border-muted/60">
              {hasActiveFilters ? (
                <>
                  <Inbox className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium text-muted-foreground">
                    No matching requests found
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Try adjusting your filters
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </Button>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-data-success" />
                  <p className="text-lg font-medium text-data-success">
                    All caught up!
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    No pending requests to review
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-muted/60 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Date Range
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Days
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Reason
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((leave: any) => {
                      if (!leave.requester) return null;

                      const availableActions = getAvailableActions(
                        leave.type as LeaveType
                      );
                      const isPending =
                        leave.status === "PENDING" ||
                        leave.status === "SUBMITTED";
                      const isProcessing = processingId === leave.id;

                      return (
                        <TableRow
                          key={leave.id}
                          className="odd:bg-muted/40 hover:bg-muted/60 transition-colors"
                        >
                          <TableCell>
                            <Link
                              href={`/leaves/${leave.id}`}
                              className="text-data-info hover:underline font-medium cursor-pointer"
                            >
                              {leave.requester.name}
                            </Link>
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {leave.requester.email}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {leaveTypeLabel[leave.type] ?? leave.type}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-text-secondary">
                            {formatDate(leave.startDate)} →{" "}
                            {formatDate(leave.endDate)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-text-secondary">
                            {leave.workingDays}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell max-w-xs">
                            {leave.reason && leave.reason.length > 50 ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="truncate text-text-secondary cursor-help">
                                      {leave.reason}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="left"
                                    className="max-w-xs"
                                  >
                                    <p>{leave.reason}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <div className="text-text-secondary">
                                {leave.reason}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={leave.status} />
                              {leave.isModified && (
                                <Badge
                                  variant="outline"
                                  className="text-xs text-data-info border-data-info"
                                >
                                  Modified
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2 flex-nowrap">
                              {isPending && (
                                <>
                                  {availableActions.includes("forward") && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="icon"
                                            variant="outline"
                                            className="h-8 w-8 text-data-info hover:bg-data-info hover:text-data-info"
                                            onClick={() => {
                                              setSelectedLeave(leave);
                                              setForwardDialogOpen(true);
                                            }}
                                            disabled={isProcessing}
                                          >
                                            {isProcessing ? (
                                              <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                              <ArrowRight className="h-4 w-4" />
                                            )}
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          Forward to HR Head
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                  {availableActions.includes("return") && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="icon"
                                            variant="outline"
                                            className="h-8 w-8 text-data-error hover:bg-data-error hover:text-data-error"
                                            onClick={() => {
                                              setSelectedLeave(leave);
                                              setReturnDialogOpen(true);
                                            }}
                                            disabled={isProcessing}
                                          >
                                            {isProcessing ? (
                                              <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                              <RotateCcw className="h-4 w-4" />
                                            )}
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          Return for Modification
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                  {availableActions.includes("cancel") && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-text-secondary hover:text-data-error hover:bg-data-error/10"
                                            onClick={() => {
                                              setSelectedLeave(leave);
                                              setCancelDialogOpen(true);
                                            }}
                                            disabled={isProcessing}
                                          >
                                            {isProcessing ? (
                                              <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                              <XCircle className="h-4 w-4" />
                                            )}
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          Cancel this request permanently
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </>
                              )}
                              {!isPending && (
                                <Button
                                  asChild
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs"
                                >
                                  <Link href={`/leaves/${leave.id}`}>
                                    Review
                                  </Link>
                                </Button>
                              )}
                              {leave.isModified && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs"
                                        onClick={() => {
                                          setSelectedLeaveForComparison(leave);
                                          setComparisonModalOpen(true);
                                        }}
                                      >
                                        Compare
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Compare changes with previous version
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-2 py-2">
                  <div className="text-sm text-muted-foreground">
                    Page {urlFilters.page} of {totalPages} • {total} total
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setUrlFilters({
                          page: Math.max(1, urlFilters.page - 1),
                        })
                      }
                      disabled={urlFilters.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          let pageNum: number;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (urlFilters.page <= 3) {
                            pageNum = i + 1;
                          } else if (urlFilters.page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = urlFilters.page - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={
                                urlFilters.page === pageNum
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => setUrlFilters({ page: pageNum })}
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setUrlFilters({
                          page: Math.min(totalPages, urlFilters.page + 1),
                        })
                      }
                      disabled={urlFilters.page === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Forward Dialog */}
      <Dialog open={forwardDialogOpen} onOpenChange={setForwardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Forward Leave Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to forward this{" "}
              {selectedLeave?.type ? leaveTypeLabel[selectedLeave.type] : ""}{" "}
              leave request from {selectedLeave?.requester?.name} to HR Head?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setForwardDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedLeave && handleAction(selectedLeave.id, "forward")
              }
              disabled={isProcessing || !selectedLeave}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Forwarding...
                </>
              ) : (
                "Forward"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return for Modification</DialogTitle>
            <DialogDescription>
              Return this{" "}
              {selectedLeave?.type ? leaveTypeLabel[selectedLeave.type] : ""}{" "}
              leave request from {selectedLeave?.requester?.name} for
              modification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="return-comment">Comment (Required)</Label>
            <Textarea
              id="return-comment"
              placeholder="Explain why this request is being returned..."
              value={returnComment}
              onChange={(e) => setReturnComment(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReturnDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedLeave &&
                handleAction(selectedLeave.id, "return", returnComment)
              }
              disabled={isProcessing || !selectedLeave || !returnComment.trim()}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Returning...
                </>
              ) : (
                "Return"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Leave Request</DialogTitle>
            <DialogDescription>
              This will permanently cancel the{" "}
              {selectedLeave?.type ? leaveTypeLabel[selectedLeave.type] : ""}{" "}
              leave request from {selectedLeave?.requester?.name}. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Reason (Optional)</Label>
            <Textarea
              id="cancel-reason"
              placeholder="Provide a reason for cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={isProcessing}
            >
              Keep Request
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                selectedLeave &&
                handleAction(selectedLeave.id, "cancel", cancelReason)
              }
              disabled={isProcessing || !selectedLeave}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comparison Modal */}
      {selectedLeaveForComparison && (
        <LeaveComparisonModal
          open={comparisonModalOpen}
          onOpenChange={setComparisonModalOpen}
          leaveId={selectedLeaveForComparison.id}
          currentLeave={selectedLeaveForComparison}
        />
      )}
    </>
  );
}
