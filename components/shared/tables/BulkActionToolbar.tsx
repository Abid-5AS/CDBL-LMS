"use client";

import { CheckCircle2, RotateCcw, ArrowRight, XCircle, X } from "lucide-react";

// UI Components (barrel export)
import {
  Button,
  Badge,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui";

type BulkActionToolbarProps = {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkApprove?: () => void;
  onBulkReject?: () => void;
  onBulkReturn?: () => void;
  onBulkForward?: () => void;
  canApprove?: boolean;
  canReject?: boolean;
  canReturn?: boolean;
  canForward?: boolean;
  isProcessing?: boolean;
  isFinalApprover?: boolean;
};

/**
 * Reusable bulk action toolbar for pending requests tables
 * Appears when requests are selected
 */
export function BulkActionToolbar({
  selectedCount,
  onClearSelection,
  onBulkApprove,
  onBulkReject,
  onBulkReturn,
  onBulkForward,
  canApprove = true,
  canReject = true,
  canReturn = true,
  canForward = false,
  isProcessing = false,
  isFinalApprover = false,
}: BulkActionToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-0 z-10 mb-4 rounded-lg border bg-data-info/10 p-3 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm">
            {selectedCount} selected
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClearSelection}
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {canApprove && onBulkApprove && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onBulkApprove}
                    disabled={isProcessing}
                    className="text-data-success border-data-success/20 hover:bg-data-success/10 hover:text-data-success hover:border-data-success/30"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {isFinalApprover ? "Approve All" : "Forward All"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isFinalApprover
                    ? "Approve selected requests"
                    : "Forward selected requests to next approver"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {canReject && onBulkReject && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onBulkReject}
                    disabled={isProcessing}
                    className="text-data-error border-data-error/20 hover:bg-data-error/10 hover:text-data-error hover:border-data-error/30"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject All
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reject selected requests</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {canReturn && onBulkReturn && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onBulkReturn}
                    disabled={isProcessing}
                    className="text-data-warning border-data-warning/20 hover:bg-data-warning/10 hover:text-data-warning hover:border-data-warning/30"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Return All
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Return selected requests for revision
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {canForward && onBulkForward && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onBulkForward}
                    disabled={isProcessing}
                    className="text-data-info border-data-info/20 hover:bg-data-info/10 hover:text-data-info hover:border-data-info/30"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Forward All
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Forward selected requests</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </div>
  );
}
