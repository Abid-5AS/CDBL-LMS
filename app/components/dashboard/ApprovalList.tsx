"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  X,
  Forward,
  ChevronRight,
  Clock,
  User,
  Calendar,
  FileText,
  CheckCircle,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AppRole } from "@/types/auth";

/**
 * Approval Chain Step Interface
 */
export interface ApprovalStep {
  step: number;
  role: string;
  status: "pending" | "approved" | "rejected" | "current";
  approver?: string;
  timestamp?: Date | string;
}

/**
 * Approval Item Interface
 */
export interface ApprovalItem {
  id: string | number;
  employeeName: string;
  employeeId?: string | number;
  leaveType: string;
  startDate: Date | string;
  endDate: Date | string;
  days: number;
  currentStep: number;
  totalSteps: number;
  chain: ApprovalStep[];
  reason?: string;
  status?: string;
}

/**
 * ApprovalList Props
 *
 * @interface ApprovalListProps
 * @property {ApprovalItem[]} approvals - Array of pending approvals
 * @property {(id: string | number) => void} onApprove - Approve callback
 * @property {(id: string | number, reason?: string) => void} onReject - Reject callback
 * @property {(id: string | number) => void} [onForward] - Forward callback
 * @property {boolean} [isLoading] - Loading state
 * @property {AppRole} userRole - Current user's role
 */
export interface ApprovalListProps {
  approvals: ApprovalItem[];
  onApprove: (id: string | number) => void;
  onReject: (id: string | number, reason?: string) => void;
  onForward?: (id: string | number) => void;
  isLoading?: boolean;
  userRole: AppRole;
  className?: string;
  title?: string;
  description?: string;
  maxItems?: number;
}

const leaveTypeColors: Record<string, string> = {
  CASUAL: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  EARNED: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  MEDICAL: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  MATERNITY: "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300",
  STUDY: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  LWP: "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-300",
};

/**
 * ApprovalList Component
 *
 * List of pending approvals with approval chain status.
 * Features approve/reject/forward actions and visual chain indicators.
 *
 * @example
 * ```tsx
 * <ApprovalList
 *   approvals={pendingApprovals}
 *   onApprove={(id) => handleApprove(id)}
 *   onReject={(id, reason) => handleReject(id, reason)}
 *   onForward={(id) => handleForward(id)}
 *   userRole="HR_ADMIN"
 * />
 * ```
 */
export function ApprovalList({
  approvals,
  onApprove,
  onReject,
  onForward,
  isLoading = false,
  userRole,
  className,
  title = "Pending Approvals",
  description = "Review and process leave requests",
  maxItems,
}: ApprovalListProps) {
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const [rejectingId, setRejectingId] = useState<string | number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const displayedApprovals = maxItems ? approvals.slice(0, maxItems) : approvals;

  const handleApprove = (id: string | number) => {
    onApprove(id);
  };

  const handleReject = (id: string | number) => {
    onReject(id, rejectReason);
    setRejectingId(null);
    setRejectReason("");
  };

  const handleForward = (id: string | number) => {
    if (onForward) {
      onForward(id);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <Card className={cn("bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700", className)}>
        <CardHeader className="pb-3">
          <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="space-y-3">
                  <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                  <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              {title}
              {approvals.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {approvals.length}
                </Badge>
              )}
            </CardTitle>
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {approvals.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-950 mb-3">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              All caught up!
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              No pending approvals at this time
            </p>
          </div>
        ) : (
          <ScrollArea className="h-auto max-h-[600px]">
            <AnimatePresence mode="popLayout">
              <div className="space-y-4">
                {displayedApprovals.map((approval, index) => {
                  const isExpanded = expandedId === approval.id;
                  const isRejecting = rejectingId === approval.id;
                  const leaveTypeColor =
                    leaveTypeColors[approval.leaveType] ||
                    "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-300";

                  return (
                    <motion.div
                      key={approval.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "p-4 rounded-lg border-2 bg-gray-50 dark:bg-slate-800/50",
                        "border-gray-200 dark:border-gray-700",
                        "hover:border-blue-300 dark:hover:border-blue-700",
                        "transition-all duration-200"
                      )}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                              {approval.employeeName}
                            </h4>
                            <Badge variant="outline" className={cn("text-xs", leaveTypeColor)}>
                              {approval.leaveType}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {formatDate(approval.startDate)} - {formatDate(approval.endDate)}
                              </span>
                            </div>
                            <span className="font-medium">
                              {approval.days} {approval.days === 1 ? "day" : "days"}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setExpandedId(isExpanded ? null : approval.id)
                          }
                          className="p-1"
                        >
                          <ChevronRight
                            className={cn(
                              "h-5 w-5 transition-transform",
                              isExpanded && "rotate-90"
                            )}
                          />
                        </Button>
                      </div>

                      {/* Approval Chain */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2">
                          {approval.chain.map((step, stepIndex) => (
                            <div key={stepIndex} className="flex items-center">
                              <div
                                className={cn(
                                  "flex items-center justify-center w-8 h-8 rounded-full border-2",
                                  step.status === "approved"
                                    ? "bg-green-100 border-green-500 dark:bg-green-950 dark:border-green-600"
                                    : step.status === "current"
                                    ? "bg-blue-100 border-blue-500 dark:bg-blue-950 dark:border-blue-600"
                                    : step.status === "rejected"
                                    ? "bg-red-100 border-red-500 dark:bg-red-950 dark:border-red-600"
                                    : "bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-600"
                                )}
                              >
                                {step.status === "approved" ? (
                                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                                ) : step.status === "rejected" ? (
                                  <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                                ) : (
                                  <Circle
                                    className={cn(
                                      "h-3 w-3",
                                      step.status === "current"
                                        ? "text-blue-600 dark:text-blue-400 fill-current"
                                        : "text-gray-400 dark:text-gray-600"
                                    )}
                                  />
                                )}
                              </div>
                              {stepIndex < approval.chain.length - 1 && (
                                <div
                                  className={cn(
                                    "h-0.5 w-8",
                                    step.status === "approved"
                                      ? "bg-green-500 dark:bg-green-600"
                                      : "bg-gray-300 dark:bg-gray-600"
                                  )}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Step {approval.currentStep} of {approval.totalSteps}:{" "}
                            <span className="font-medium">
                              {approval.chain[approval.currentStep - 1]?.role || "Unknown"}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                              {approval.reason && (
                                <div className="p-3 rounded bg-gray-100 dark:bg-slate-800">
                                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Reason:
                                  </p>
                                  <p className="text-sm text-gray-900 dark:text-gray-100">
                                    {approval.reason}
                                  </p>
                                </div>
                              )}
                              <div className="space-y-1">
                                {approval.chain.map((step, stepIndex) => (
                                  <div
                                    key={stepIndex}
                                    className="flex items-center justify-between text-xs p-2 rounded bg-gray-100 dark:bg-slate-800"
                                  >
                                    <span className="text-gray-600 dark:text-gray-400">
                                      Step {step.step}: {step.role}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-xs",
                                        step.status === "approved" &&
                                          "border-green-300 dark:border-green-700 text-green-700 dark:text-green-300",
                                        step.status === "current" &&
                                          "border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300",
                                        step.status === "pending" &&
                                          "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                                      )}
                                    >
                                      {step.status}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Actions */}
                      {isRejecting ? (
                        <div className="mt-4 space-y-2">
                          <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Provide a reason for rejection (optional)"
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleReject(approval.id)}
                              variant="destructive"
                              size="sm"
                              className="flex-1"
                            >
                              Confirm Reject
                            </Button>
                            <Button
                              onClick={() => {
                                setRejectingId(null);
                                setRejectReason("");
                              }}
                              variant="outline"
                              size="sm"
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 mt-4">
                          <Button
                            onClick={() => handleApprove(approval.id)}
                            variant="default"
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => setRejectingId(approval.id)}
                            variant="destructive"
                            size="sm"
                            className="flex-1"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          {onForward && (
                            <Button
                              onClick={() => handleForward(approval.id)}
                              variant="outline"
                              size="sm"
                            >
                              <Forward className="h-4 w-4 mr-1" />
                              Forward
                            </Button>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * ApprovalList Skeleton Loader
 */
export function ApprovalListSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700", className)}>
      <CardHeader className="pb-3">
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="space-y-3">
                <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
