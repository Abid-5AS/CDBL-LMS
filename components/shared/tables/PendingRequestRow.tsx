"use client";

import { CheckCircle2, RotateCcw, ArrowRight, XCircle } from "lucide-react";
import { LeaveStatus } from "@prisma/client";
import Link from "next/link";

// UI Components (barrel export)
import {
  Button,
  Badge,
  Checkbox,
  TableCell,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui";

// Shared Components
import { StatusBadge } from "@/components/shared";

// Lib utilities
import { formatDate, leaveTypeLabel } from "@/lib";

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

type PendingRequestRowProps = {
  request: LeaveRequest;
  isSelected?: boolean;
  onToggleSelect?: (id: number) => void;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  onReturn?: (id: number) => void;
  onForward?: (id: number) => void;
  canApprove?: boolean;
  canReject?: boolean;
  canReturn?: boolean;
  canForward?: boolean;
  isFinalApprover?: boolean;
  showActions?: boolean;
};

/**
 * Reusable table row component for pending leave requests
 * Used across dept-head, hr-admin, and hr-head dashboards
 */
export function PendingRequestRow({
  request,
  isSelected = false,
  onToggleSelect,
  onApprove,
  onReject,
  onReturn,
  onForward,
  canApprove = true,
  canReject = true,
  canReturn = true,
  canForward = false,
  isFinalApprover = false,
  showActions = true,
}: PendingRequestRowProps) {
  return (
    <TableRow>
      {onToggleSelect && (
        <TableCell className="w-12">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(request.id)}
            aria-label={`Select request from ${request.requester.name}`}
          />
        </TableCell>
      )}

      <TableCell>
        <Link
          href={`/leaves/${request.id}`}
          className="font-medium text-data-info hover:underline"
        >
          {request.requester.name}
        </Link>
        <div className="text-xs text-muted-foreground">
          {request.requester.email}
        </div>
      </TableCell>

      <TableCell>
        <Badge variant="outline">
          {leaveTypeLabel[request.type as keyof typeof leaveTypeLabel] ||
            request.type}
        </Badge>
      </TableCell>

      <TableCell className="text-sm">
        <div>{formatDate(request.startDate)}</div>
        <div className="text-muted-foreground">
          {formatDate(request.endDate)}
        </div>
      </TableCell>

      <TableCell className="text-center">
        <Badge variant="secondary">{request.workingDays}</Badge>
      </TableCell>

      <TableCell>
        <StatusBadge status={request.status} />
      </TableCell>

      <TableCell className="max-w-xs">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="truncate text-sm text-muted-foreground cursor-help">
                {request.reason}
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-sm">
              <p>{request.reason}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>

      {showActions && (
        <TableCell>
          <div className="flex items-center gap-2">
            {canApprove && onApprove && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onApprove(request.id)}
                      className="h-8 w-8 p-0 text-data-success hover:bg-data-success/10 hover:text-data-success"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isFinalApprover ? "Approve" : "Forward to next approver"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {canReject && onReject && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onReject(request.id)}
                      className="h-8 w-8 p-0 text-data-error hover:bg-data-error/10 hover:text-data-error"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reject</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {canReturn && onReturn && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onReturn(request.id)}
                      className="h-8 w-8 p-0 text-data-warning hover:bg-data-warning/10 hover:text-data-warning"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Return for revision</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {canForward && onForward && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onForward(request.id)}
                      className="h-8 w-8 p-0 text-data-info hover:bg-data-info/10 hover:text-data-info"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Forward</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}
