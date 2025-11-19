"use client";

import { motion } from "framer-motion";
import { Calendar, User, Clock, Loader2, ArrowRight, RotateCcw } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { StatusBadge } from "@/components/shared";
import { cn, formatDate, leaveTypeLabel } from "@/lib";
import { getLeaveTypeColor } from "../utils/leave-utils";
import type { LeaveStatus } from "@prisma/client";

type LeaveRequest = {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  status: LeaveStatus;
  requester: {
    id: number;
    name: string;
    email: string;
  };
};

type PendingLeaveCardProps = {
  leave: LeaveRequest;
  index: number;
  isProcessing: boolean;
  onRowClick: (leave: LeaveRequest) => void;
  onForward: (leave: LeaveRequest) => void;
  onReturn: (leave: LeaveRequest) => void;
};

export function PendingLeaveCard({
  leave,
  index,
  isProcessing,
  onRowClick,
  onForward,
  onReturn,
}: PendingLeaveCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className="surface-card-interactive p-4 rounded-xl border border-border-strong/50 dark:border-border-strong/50 cursor-pointer transition-all"
      onClick={() => onRowClick(leave)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-gradient-to-br from-card-action to-card-summary p-2">
            <User className="h-4 w-4 text-text-inverted" />
          </div>
          <div>
            <p className="font-medium text-sm">{leave.requester.name}</p>
            <p className="text-xs text-muted-foreground">
              {leave.requester.email}
            </p>
          </div>
        </div>
        <StatusBadge status={leave.status} />
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn("text-xs font-medium", getLeaveTypeColor(leave.type))}
          >
            {leaveTypeLabel[leave.type] ?? leave.type}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{leave.workingDays} days</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
          </span>
        </div>
      </div>

      {(leave.status === "PENDING" || leave.status === "SUBMITTED") && (
        <div
          className="flex gap-2 pt-3 border-t border-border-strong/50 dark:border-border-strong/50"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-data-info border-data-info hover:bg-data-info"
            onClick={() => onForward(leave)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4 mr-2" />
            )}
            Forward
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-data-warning border-data-warning hover:bg-data-warning"
            onClick={() => onReturn(leave)}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Return
          </Button>
        </div>
      )}
    </motion.div>
  );
}
