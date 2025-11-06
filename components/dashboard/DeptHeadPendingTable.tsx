"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, RotateCcw, ArrowRight, Search, X, Inbox, Loader2, ChevronLeft, ChevronRight, XCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { leaveTypeLabel } from "@/lib/ui";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LeaveStatus, LeaveType, AppRole } from "@prisma/client";
import { toast } from "sonner";
import { SUCCESS_MESSAGES, getToastMessage } from "@/lib/toast-messages";
import { isFinalApprover, canPerformAction } from "@/lib/workflow";
import { useUser } from "@/lib/user-context";
import { getStatusColors } from "@/lib/status-colors";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { LeaveComparisonModal } from "./LeaveComparisonModal";
import { useFilterFromUrl } from "@/lib/url-filters";
import { useDebounce } from "@/lib/use-debounce";
import { DEFAULT_FILTER } from "@/types/filters";

// Status options - role-aware (DEPT_HEAD sees "Forwarded" instead of "Approved")
const getStatusOptions = (role: string) => {
  if (role === "DEPT_HEAD") {
    return [
      { value: "all", label: "All" },
      { value: "PENDING", label: "Pending" },
      { value: "FORWARDED", label: "Forwarded" },
      { value: "RETURNED", label: "Returned" },
      { value: "CANCELLED", label: "Cancelled" },
    ];
  }
  return [
    { value: "all", label: "All" },
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "RETURNED", label: "Returned" },
    { value: "CANCELLED", label: "Cancelled" },
  ];
};

// Type options - dynamically generated from LeaveType enum
const TYPE_OPTIONS = [
  { value: "all", label: "All" },
  ...Object.values(LeaveType).map((type) => ({
    value: type,
    label: leaveTypeLabel[type] || type,
  })),
];

const fetcher = (url: string) => fetch(url).then((res) => res.json());

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

// Will be defined after imports

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
  isLoading = false,
  error,
  onMutate,
}: DeptHeadPendingTableProps) {
  const { user } = useUser();
  const userRole = user?.role || "DEPT_HEAD";
  const statusOptions = getStatusOptions(userRole);
  
  const { state, set } = useFilterFromUrl();
  const [searchInput, setSearchInput] = useState(state.q);
  const debouncedSearch = useDebounce(searchInput, 250);
  
  // Update URL when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== state.q) {
      set({ q: debouncedSearch });
    }
  }, [debouncedSearch, state.q, set]);

  // Sync search input with URL state (when URL changes externally)
  useEffect(() => {
    if (state.q !== searchInput) {
      setSearchInput(state.q);
    }
  }, [state.q]);

  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    leaveId: number | null;
    action: "approve" | "reject" | "forward" | "return" | "cancel" | null;
    leaveType: string;
    employeeName: string;
  }>({
    open: false,
    leaveId: null,
    action: null,
    leaveType: "",
    employeeName: "",
  });

  const [returnComment, setReturnComment] = useState("");
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
  const [selectedLeaveForComparison, setSelectedLeaveForComparison] = useState<any | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  const rows = data?.rows || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / state.pageSize);

  // Clear all filters
  const clearFilters = () => {
    set(DEFAULT_FILTER);
    setSearchInput("");
  };

  const hasActiveFilters = state.q || state.status !== "PENDING" || state.type !== "ALL";

  const handleAction = async (leaveId: number, action: "approve" | "reject" | "forward" | "return" | "cancel", comment?: string) => {
    // Add to processing set
    setProcessingIds((prev) => new Set(prev).add(leaveId));

    try {
      let endpoint = "";

      if (action === "approve") {
        endpoint = `/api/leaves/${leaveId}/approve`;
      } else if (action === "return") {
        endpoint = `/api/leaves/${leaveId}/return`;
      } else if (action === "forward") {
        endpoint = `/api/leaves/${leaveId}/forward`;
      } else if (action === "reject") {
        endpoint = `/api/leaves/${leaveId}/reject`;
      } else if (action === "cancel") {
        endpoint = `/api/leaves/${leaveId}/cancel`;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          comment: comment || "",
          reason: comment || undefined,
        }),
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMessage = getToastMessage(
          payload?.error || `Failed to ${action} request`,
          payload?.message
        );
        toast.error(errorMessage);
        return;
      }

      toast.success(
        action === "approve"
          ? SUCCESS_MESSAGES.leave_approved
          : action === "reject"
          ? SUCCESS_MESSAGES.leave_rejected
          : action === "return"
          ? SUCCESS_MESSAGES.returned_for_modification
          : action === "cancel"
          ? "Leave request cancelled successfully"
          : SUCCESS_MESSAGES.leave_forwarded
      );
      
      // Refresh data using SWR mutate
      if (onMutate) {
        await onMutate();
      } else if (typeof window !== "undefined") {
        window.location.reload();
      }
      
      setActionDialog({ open: false, leaveId: null, action: null, leaveType: "", employeeName: "" });
      setReturnDialogOpen(false);
      setForwardDialogOpen(false);
      setCancelDialogOpen(false);
      setReturnComment("");
      setCancelReason("");
    } catch (err) {
      toast.error(getToastMessage("network_error", "Unable to update request"));
    } finally {
      // Remove from processing set
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(leaveId);
        return next;
      });
    }
  };

  const openActionDialog = (
    leaveId: number,
    action: "approve" | "reject" | "forward" | "return",
    leaveType: string,
    employeeName: string
  ) => {
    setActionDialog({
      open: true,
      leaveId,
      action,
      leaveType,
      employeeName,
    });
  };

  // Helper to determine available actions based on user role and leave type
  // For DEPT_HEAD: Only Forward, Return, Cancel (no Approve, even for CASUAL)
  const getAvailableActions = (leaveType: LeaveType): Array<"approve" | "forward" | "return" | "cancel"> => {
    const actions: Array<"approve" | "forward" | "return" | "cancel"> = [];
    const userRole = (user?.role || "DEPT_HEAD") as AppRole;

    // DEPT_HEAD never approves - they can only forward, return, or cancel
    // Even though CASUAL has DEPT_HEAD as final approver, they should forward to HR_HEAD/CEO
    // Only CEO and HR_HEAD can approve
    
    if (canPerformAction(userRole, "FORWARD", leaveType)) {
      actions.push("forward");
    }

    // Return is always available for supervisors (can return any pending request)
    actions.push("return");

    // Cancel is available for supervisors (per-row action only, not in Quick Actions)
    actions.push("cancel");

    return actions;
  };

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-muted/60 shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-20" />
            <div className="flex gap-2 flex-wrap">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-6 w-20" />
            <div className="flex gap-2 flex-wrap">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
          <div className="border rounded-lg">
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-2xl border-muted/60 shadow-sm">
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
        </CardHeader>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <div className="text-sm font-semibold text-red-600">
              Failed to load requests
            </div>
            <p className="text-xs text-muted-foreground">
              {error?.message || "Please refresh the page or try again later."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (onMutate) onMutate();
                else window.location.reload();
              }}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isLoading && rows.length === 0 && !hasActiveFilters) {
    return (
      <Card className="rounded-2xl border-muted/60 shadow-sm">
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-12 text-center bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg border border-muted/60">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <h3 className="text-lg font-semibold mb-2">All clear!</h3>
            <p className="text-sm text-muted-foreground">
              No pending approvals at the moment.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="rounded-2xl border-muted/60 shadow-sm">
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar with Clear Filters */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by employee, type, or reason..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
              {searchInput && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => {
                    setSearchInput("");
                    set({ q: "" });
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="whitespace-nowrap"
              >
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>

          {/* Sticky Filter Section - Stacked Status + Type */}
          <div 
            className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-muted/60 pb-4 -mx-6 px-6 mb-4 shadow-sm"
            style={{ marginTop: "-1rem" }}
          >
            <div className="flex flex-col gap-3 pt-2">
              {/* Status Filter */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">Status</Label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((option) => {
                    const statusValue = option.value === "all" ? "ALL" : option.value.toUpperCase();
                    const isSelected = state.status === statusValue;
                    return (
                      <Badge
                        key={option.value}
                        variant={isSelected ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer rounded-full px-3 py-1 text-xs transition-colors whitespace-nowrap",
                          isSelected 
                            ? getStatusColors(option.value === "FORWARDED" ? "FORWARDED" : option.value.toUpperCase(), "chip")
                            : "hover:bg-accent/20"
                        )}
                        onClick={() => set({ status: statusValue as any })}
                      >
                        {option.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* Type Filter - Wrapped */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">Leave Type</Label>
                <div className="flex flex-wrap gap-2">
                  {TYPE_OPTIONS.map((option) => {
                    const typeValue = option.value === "all" ? "ALL" : option.value;
                    const isSelected = state.type === typeValue;
                    return (
                      <Badge
                        key={option.value}
                        variant={isSelected ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer rounded-full px-2 py-1 text-xs transition-colors whitespace-nowrap",
                          isSelected 
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent/20"
                        )}
                        onClick={() => set({ type: typeValue as any })}
                      >
                        {option.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          {rows.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="font-semibold mb-2">No requests match your filters</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting filters or check approved requests.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-x-auto max-h-[70vh] overflow-y-auto">
                <Table className="min-w-full text-sm">
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow className="bg-muted/40">
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="hidden sm:table-cell">Dates</TableHead>
                      <TableHead className="hidden md:table-cell">Days</TableHead>
                      <TableHead className="hidden lg:table-cell">Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((leave: any) => {
                    if (!leave.requester) return null;
                    
                      const availableActions = getAvailableActions(leave.type as LeaveType);
                      const isPending = leave.status === "PENDING" || leave.status === "SUBMITTED";
                      const isProcessing = processingIds.has(leave.id);
                      
                      return (
                        <TableRow 
                          key={leave.id} 
                          className="odd:bg-muted/40 hover:bg-muted/60 transition-colors"
                        >
                          <TableCell>
                            <Link
                              href={`/leaves/${leave.id}`}
                              className="text-blue-600 hover:underline font-medium cursor-pointer"
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
                          <TableCell className="hidden sm:table-cell text-slate-600">
                            {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-slate-600">
                            {leave.workingDays}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell max-w-xs">
                            {leave.reason && leave.reason.length > 50 ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="truncate text-slate-600 cursor-help">
                                      {leave.reason}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="left" className="max-w-xs">
                                    <p>{leave.reason}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <div className="text-slate-600">{leave.reason}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={leave.status} />
                              {(leave as any).isModified && (
                                <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                                  Modified
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2 flex-nowrap">
                            {isPending && (
                              <>
                                {availableActions.includes("approve") && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="icon"
                                          variant="default"
                                          className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openActionDialog(leave.id, "approve", leave.type, leave.requester.name);
                                          }}
                                          disabled={isProcessing}
                                          aria-label="Approve leave request"
                                        >
                                          {isProcessing ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <CheckCircle2 className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Approve</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                {availableActions.includes("forward") && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="icon"
                                          variant="outline"
                                          className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActionDialog({
                                              open: false,
                                              leaveId: leave.id,
                                              action: "forward",
                                              leaveType: leave.type,
                                              employeeName: leave.requester.name,
                                            });
                                            setForwardDialogOpen(true);
                                          }}
                                          disabled={isProcessing}
                                          aria-label="Forward to HR Head"
                                        >
                                          {isProcessing ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <ArrowRight className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Forward to HR Head</TooltipContent>
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
                                          className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActionDialog({
                                              open: false,
                                              leaveId: leave.id,
                                              action: "return",
                                              leaveType: leave.type,
                                              employeeName: leave.requester.name,
                                            });
                                            setReturnDialogOpen(true);
                                          }}
                                          disabled={isProcessing}
                                          aria-label="Return for modification"
                                        >
                                          {isProcessing ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <RotateCcw className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Return for Modification</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                {/* Cancel action - available for all pending requests */}
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-gray-600 hover:text-red-600 hover:bg-red-50"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActionDialog({
                                            open: false,
                                            leaveId: leave.id,
                                            action: "cancel",
                                            leaveType: leave.type,
                                            employeeName: leave.requester.name,
                                          });
                                          setCancelDialogOpen(true);
                                        }}
                                        disabled={isProcessing}
                                        aria-label="Cancel request"
                                      >
                                        {isProcessing ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <XCircle className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Cancel this request permanently</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </>
                            )}
                            {!isPending && (
                              <>
                                <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                                  <Link href={`/leaves/${leave.id}`}>Review</Link>
                                </Button>
                                {(leave as any).isModified && (
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
                                      <TooltipContent>Compare changes with previous version</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </>
                            )}
                            {isPending && (leave as any).isModified && (
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
                                  <TooltipContent>Compare changes with previous version</TooltipContent>
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

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-2 py-2">
                  <div className="text-sm text-muted-foreground">
                    Page {state.page} of {totalPages} • {total} total
                  </div>
                  <div className="text-xs text-muted-foreground sm:hidden">
                    Showing {(state.page - 1) * state.pageSize + 1}-{Math.min(state.page * state.pageSize, total)} of {total}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        set({ page: Math.max(1, state.page - 1) });
                        // Smooth scroll to table top
                        setTimeout(() => {
                          const tableElement = document.getElementById("pending-requests-table");
                          if (tableElement) {
                            tableElement.scrollIntoView({ behavior: "smooth", block: "start" });
                          }
                        }, 100);
                      }}
                      disabled={state.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (state.page <= 3) {
                          pageNum = i + 1;
                        } else if (state.page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = state.page - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={state.page === pageNum ? "default" : "outline"}
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              set({ page: pageNum });
                              // Smooth scroll to table top
                              setTimeout(() => {
                                const tableElement = document.getElementById("pending-requests-table");
                                if (tableElement) {
                                  tableElement.scrollIntoView({ behavior: "smooth", block: "start" });
                                }
                              }, 100);
                            }}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        set({ page: Math.min(totalPages, state.page + 1) });
                        // Smooth scroll to table top
                        setTimeout(() => {
                          const tableElement = document.getElementById("pending-requests-table");
                          if (tableElement) {
                            tableElement.scrollIntoView({ behavior: "smooth", block: "start" });
                          }
                        }, 100);
                      }}
                      disabled={state.page === totalPages}
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

      {/* Action Confirmation Dialog (for Approve/Reject) */}
      <AlertDialog open={actionDialog.open && actionDialog.action !== "return" && actionDialog.action !== "forward" && actionDialog.action !== "cancel"} onOpenChange={(open) => !open && setActionDialog({ open: false, leaveId: null, action: null, leaveType: "", employeeName: "" })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog.action === "approve" && "Approve Leave Request"}
              {actionDialog.action === "reject" && "Reject Leave Request"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {`Are you sure you want to ${actionDialog.action} the ${actionDialog.leaveType} leave request from ${actionDialog.employeeName}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                actionDialog.leaveId &&
                actionDialog.action &&
                handleAction(actionDialog.leaveId, actionDialog.action)
              }
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Forward Confirmation Dialog */}
      <Dialog open={forwardDialogOpen} onOpenChange={(open) => {
        setForwardDialogOpen(open);
        if (!open) {
          setActionDialog({ open: false, leaveId: null, action: null, leaveType: "", employeeName: "" });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Forward Leave Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to forward this {actionDialog.leaveType} leave request from {actionDialog.employeeName} to HR Head?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setForwardDialogOpen(false);
                setActionDialog({ open: false, leaveId: null, action: null, leaveType: "", employeeName: "" });
              }}
              disabled={processingIds.has(actionDialog.leaveId || 0)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (actionDialog.leaveId && actionDialog.action === "forward") {
                  handleAction(actionDialog.leaveId, "forward");
                }
              }}
              disabled={processingIds.has(actionDialog.leaveId || 0) || !actionDialog.leaveId}
            >
              {processingIds.has(actionDialog.leaveId || 0) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Forwarding...
                </>
              ) : (
                "Confirm Forward"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Comment Dialog - Comment is Required */}
      <Dialog open={returnDialogOpen} onOpenChange={(open) => {
        setReturnDialogOpen(open);
        if (!open) {
          setReturnComment("");
          setActionDialog({ open: false, leaveId: null, action: null, leaveType: "", employeeName: "" });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return Leave Request for Modification</DialogTitle>
            <DialogDescription>
              Please provide a clear reason for returning this {actionDialog.leaveType} leave request from {actionDialog.employeeName}. 
              The employee will see this comment and can fix the issue before resubmitting.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="return-comment">Return Reason <span className="text-red-500">*</span></Label>
              <Textarea
                id="return-comment"
                placeholder="e.g., Please attach medical certificate for leaves longer than 3 days"
                value={returnComment}
                onChange={(e) => setReturnComment(e.target.value)}
                className="min-h-[100px]"
                required
              />
              <p className="text-xs text-muted-foreground">
                This comment will be visible to the employee and will help them understand what needs to be fixed.
                <span className="block mt-1">Minimum 5 characters required.</span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReturnDialogOpen(false);
                setReturnComment("");
                setActionDialog({ open: false, leaveId: null, action: null, leaveType: "", employeeName: "" });
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (returnComment.trim().length < 5) {
                  toast.error("Please provide a return reason (minimum 5 characters)");
                  return;
                }
                if (actionDialog.leaveId && actionDialog.action === "return") {
                  handleAction(actionDialog.leaveId, "return", returnComment.trim());
                }
              }}
              disabled={returnComment.trim().length < 5}
            >
              Confirm Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Request Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={(open) => {
        setCancelDialogOpen(open);
        if (!open) {
          setCancelReason("");
          setActionDialog({ open: false, leaveId: null, action: null, leaveType: "", employeeName: "" });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Leave Request</DialogTitle>
            <DialogDescription>
              This will permanently cancel the {actionDialog.leaveType} leave request from {actionDialog.employeeName}.
              Are you sure you want to proceed?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Cancellation Reason (Optional)</Label>
              <Textarea
                id="cancel-reason"
                placeholder="e.g., Employee resigned, project deadline changed, etc."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                This reason will be visible to the employee and recorded in the audit log.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelDialogOpen(false);
                setCancelReason("");
                setActionDialog({ open: false, leaveId: null, action: null, leaveType: "", employeeName: "" });
              }}
              disabled={processingIds.has(actionDialog.leaveId || 0)}
            >
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (actionDialog.leaveId && actionDialog.action === "cancel") {
                  handleAction(actionDialog.leaveId, "cancel", cancelReason.trim() || undefined);
                }
              }}
              disabled={processingIds.has(actionDialog.leaveId || 0) || !actionDialog.leaveId}
            >
              {processingIds.has(actionDialog.leaveId || 0) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Confirm Cancel"
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
          currentLeave={{
            type: selectedLeaveForComparison.type,
            startDate: selectedLeaveForComparison.startDate,
            endDate: selectedLeaveForComparison.endDate,
            workingDays: selectedLeaveForComparison.workingDays,
            reason: selectedLeaveForComparison.reason,
            needsCertificate: (selectedLeaveForComparison as any).needsCertificate,
            certificateUrl: (selectedLeaveForComparison as any).certificateUrl,
            fitnessCertificateUrl: (selectedLeaveForComparison as any).fitnessCertificateUrl,
          }}
        />
      )}
    </>
  );
}

