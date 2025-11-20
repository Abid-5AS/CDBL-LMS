"use client";

import { CheckCircle, XCircle, Forward, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ApprovalAction = "approve" | "reject" | "forward" | "return";

type ApprovalActionButtonsProps = {
  onAction: (action: ApprovalAction) => void;
  disabled?: boolean;
  hideForward?: boolean;
  hideReturn?: boolean;
  hideDanger?: boolean;
};

export function ApprovalActionButtons({
  onAction,
  disabled = false,
  hideForward = false,
  hideReturn = false,
  hideDanger = false,
}: ApprovalActionButtonsProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Approve Button */}
      <Button
        onClick={() => onAction("approve")}
        disabled={disabled}
        size="sm"
        className="bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        Approve
      </Button>

      {/* Forward Button */}
      {!hideForward && (
        <Button
          onClick={() => onAction("forward")}
          disabled={disabled}
          size="sm"
          variant="outline"
        >
          <Forward className="h-4 w-4 mr-2" />
          Forward
        </Button>
      )}

      {/* Return for Modification Button */}
      {!hideReturn && (
        <Button
          onClick={() => onAction("return")}
          disabled={disabled}
          size="sm"
          variant="outline"
          className="border-amber-500 text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/20"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Return
        </Button>
      )}

      {/* Reject Button */}
      {!hideDanger && (
        <Button
          onClick={() => onAction("reject")}
          disabled={disabled}
          size="sm"
          variant="outline"
          className="border-red-500 text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
        >
          <XCircle className="h-4 w-4 mr-2" />
          Reject
        </Button>
      )}
    </div>
  );
}
