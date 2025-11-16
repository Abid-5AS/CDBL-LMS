"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Circle,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isToday, isFuture, isPast } from "date-fns";

/**
 * Leave Status Type
 */
export type LeaveStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED";

/**
 * Approval Chain Step
 */
export interface TimelineApprovalStep {
  step: number;
  role: string;
  status: "pending" | "approved" | "rejected";
  approver?: string;
  timestamp?: Date | string;
}

/**
 * Leave Timeline Item
 */
export interface LeaveTimelineItem {
  id: string | number;
  type: string;
  status: LeaveStatus;
  startDate: Date | string;
  endDate: Date | string;
  days: number;
  reason?: string;
  approvalChain?: TimelineApprovalStep[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * LeaveTimeline Props
 *
 * @interface LeaveTimelineProps
 * @property {LeaveTimelineItem[]} leaves - Array of leave records
 * @property {'vertical'|'horizontal'} [orientation] - Timeline orientation
 * @property {boolean} [interactive] - Enable click interactions
 * @property {(leave: LeaveTimelineItem) => void} [onLeaveClick] - Leave click handler
 * @property {boolean} [showApprovalChain] - Display approval chain details
 */
export interface LeaveTimelineProps {
  leaves: LeaveTimelineItem[];
  orientation?: "vertical" | "horizontal";
  interactive?: boolean;
  onLeaveClick?: (leave: LeaveTimelineItem) => void;
  showApprovalChain?: boolean;
  isLoading?: boolean;
  className?: string;
  title?: string;
  description?: string;
}

const statusConfig: Record<
  LeaveStatus,
  {
    icon: typeof CheckCircle;
    color: string;
    bg: string;
    border: string;
    label: string;
  }
> = {
  PENDING: {
    icon: Clock,
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-100 dark:bg-yellow-950",
    border: "border-yellow-300 dark:border-yellow-700",
    label: "Pending",
  },
  APPROVED: {
    icon: CheckCircle,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-950",
    border: "border-green-300 dark:border-green-700",
    label: "Approved",
  },
  REJECTED: {
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-950",
    border: "border-red-300 dark:border-red-700",
    label: "Rejected",
  },
  CANCELLED: {
    icon: XCircle,
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-800",
    border: "border-gray-300 dark:border-gray-700",
    label: "Cancelled",
  },
  COMPLETED: {
    icon: CheckCircle,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-950",
    border: "border-blue-300 dark:border-blue-700",
    label: "Completed",
  },
};

const leaveTypeColors: Record<string, string> = {
  CASUAL: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  EARNED: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  MEDICAL: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  MATERNITY: "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300",
  STUDY: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  LWP: "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-300",
};

/**
 * LeaveTimeline Component
 *
 * Visual timeline showing leave history and status.
 * Features chronological display, status indicators, and approval chain tracking.
 *
 * @example
 * ```tsx
 * <LeaveTimeline
 *   leaves={[
 *     {
 *       id: 1,
 *       type: 'CASUAL',
 *       status: 'APPROVED',
 *       startDate: new Date('2024-01-15'),
 *       endDate: new Date('2024-01-17'),
 *       days: 3,
 *       reason: 'Personal work'
 *     }
 *   ]}
 *   orientation="vertical"
 *   interactive
 *   showApprovalChain
 *   onLeaveClick={(leave) => console.log(leave)}
 * />
 * ```
 */
export function LeaveTimeline({
  leaves,
  orientation = "vertical",
  interactive = true,
  onLeaveClick,
  showApprovalChain = false,
  isLoading = false,
  className,
  title = "Leave Timeline",
  description = "Chronological view of your leave history",
}: LeaveTimelineProps) {
  const sortedLeaves = [...leaves].sort(
    (a, b) =>
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  const formatDate = (date: Date | string) => {
    return format(new Date(date), "MMM dd, yyyy");
  };

  const getDateStatus = (startDate: Date | string, endDate: Date | string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();

    if (isToday(start)) return "Starts Today";
    if (isFuture(start)) return "Upcoming";
    if (isPast(end)) return "Past";
    if (isPast(start) && isFuture(end)) return "Ongoing";
    return "";
  };

  if (isLoading) {
    return (
      <Card className={cn("bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700", className)}>
        <CardHeader className="pb-3">
          <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                  <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!leaves || leaves.length === 0) {
    return (
      <Card className={cn("bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
              <Calendar className="h-8 w-8 text-gray-400 dark:text-gray-600" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              No leave history
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Your leave records will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn("bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                {title}
                <Badge variant="secondary" className="ml-2">
                  {leaves.length}
                </Badge>
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
          <ScrollArea className="h-auto max-h-[600px]">
            <div className={cn("relative", orientation === "horizontal" && "flex gap-6 overflow-x-auto")}>
              {/* Timeline Line */}
              {orientation === "vertical" && (
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
              )}

              {/* Timeline Items */}
              <div className={cn(orientation === "vertical" ? "space-y-6" : "flex gap-6")}>
                {sortedLeaves.map((leave, index) => {
                  const config = statusConfig[leave.status];
                  const Icon = config.icon;
                  const leaveTypeColor =
                    leaveTypeColors[leave.type] ||
                    "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-300";
                  const dateStatus = getDateStatus(leave.startDate, leave.endDate);

                  return (
                    <motion.div
                      key={leave.id}
                      initial={{ opacity: 0, x: orientation === "vertical" ? -20 : 0, y: orientation === "horizontal" ? 20 : 0 }}
                      animate={{ opacity: 1, x: 0, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "relative flex gap-4",
                        orientation === "horizontal" && "flex-col min-w-[300px]"
                      )}
                    >
                      {/* Timeline Dot */}
                      {orientation === "vertical" && (
                        <div
                          className={cn(
                            "relative z-10 flex-shrink-0 w-12 h-12 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center",
                            config.bg,
                            config.border
                          )}
                        >
                          <Icon className={cn("h-6 w-6", config.color)} />
                        </div>
                      )}

                      {/* Content Card */}
                      <div
                        className={cn(
                          "flex-1 p-4 rounded-lg border-2 bg-gray-50 dark:bg-slate-800/50 transition-all duration-200",
                          config.border,
                          interactive && onLeaveClick && "cursor-pointer hover:shadow-md hover:border-blue-400 dark:hover:border-blue-600"
                        )}
                        onClick={() => interactive && onLeaveClick && onLeaveClick(leave)}
                        role={interactive && onLeaveClick ? "button" : undefined}
                        tabIndex={interactive && onLeaveClick ? 0 : undefined}
                        onKeyDown={
                          interactive && onLeaveClick
                            ? (e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  onLeaveClick(leave);
                                }
                              }
                            : undefined
                        }
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={cn("text-xs", leaveTypeColor)}>
                              {leave.type}
                            </Badge>
                            <Badge variant="outline" className={cn("text-xs", config.color, config.border)}>
                              {config.label}
                            </Badge>
                            {dateStatus && (
                              <Badge variant="secondary" className="text-xs">
                                {dateStatus}
                              </Badge>
                            )}
                          </div>
                          {interactive && onLeaveClick && (
                            <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-600 flex-shrink-0" />
                          )}
                        </div>

                        {/* Dates */}
                        <div className="space-y-1 mb-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 ml-6">
                            {leave.days} {leave.days === 1 ? "day" : "days"}
                          </p>
                        </div>

                        {/* Reason */}
                        {leave.reason && (
                          <div className="mb-3 p-2 rounded bg-gray-100 dark:bg-slate-800">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {leave.reason}
                            </p>
                          </div>
                        )}

                        {/* Approval Chain */}
                        {showApprovalChain && leave.approvalChain && leave.approvalChain.length > 0 && (
                          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                              Approval Chain:
                            </p>
                            <div className="flex items-center gap-1">
                              {leave.approvalChain.map((step, stepIndex) => (
                                <div key={stepIndex} className="flex items-center">
                                  <div
                                    className={cn(
                                      "flex items-center justify-center w-6 h-6 rounded-full border-2 text-xs",
                                      step.status === "approved"
                                        ? "bg-green-100 border-green-500 dark:bg-green-950 dark:border-green-600 text-green-600 dark:text-green-400"
                                        : step.status === "rejected"
                                        ? "bg-red-100 border-red-500 dark:bg-red-950 dark:border-red-600 text-red-600 dark:text-red-400"
                                        : "bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-600 text-gray-600 dark:text-gray-400"
                                    )}
                                  >
                                    {step.status === "approved" ? (
                                      <CheckCircle className="h-3 w-3" />
                                    ) : step.status === "rejected" ? (
                                      <XCircle className="h-3 w-3" />
                                    ) : (
                                      <Circle className="h-2 w-2 fill-current" />
                                    )}
                                  </div>
                                  {stepIndex < (leave.approvalChain?.length || 0) - 1 && (
                                    <div
                                      className={cn(
                                        "h-0.5 w-4",
                                        step.status === "approved"
                                          ? "bg-green-500 dark:bg-green-600"
                                          : "bg-gray-300 dark:bg-gray-600"
                                      )}
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Timestamps */}
                        {(leave.createdAt || leave.updatedAt) && (
                          <div className="pt-3 border-t border-gray-200 dark:border-gray-700 mt-3">
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                              {leave.createdAt && (
                                <span>
                                  Applied: {format(new Date(leave.createdAt), "MMM dd, yyyy")}
                                </span>
                              )}
                              {leave.updatedAt && (
                                <span>
                                  Updated: {format(new Date(leave.updatedAt), "MMM dd, yyyy")}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * LeaveTimeline Skeleton Loader
 */
export function LeaveTimelineSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700", className)}>
      <CardHeader className="pb-3">
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
