"use client";

import { ArrowRight, RotateCcw, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ApprovalAction = "forward" | "return" | "cancel" | "approve";

interface ApprovalActionButtonsProps {
  onForward?: () => void;
  onReturn?: () => void;
  onCancel?: () => void;
  onApprove?: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingAction?: ApprovalAction | null;
  /** Show only CEO actions (approve/cancel) */
  ceoMode?: boolean;
  /** Show employee mode (cancel only) */
  employeeMode?: boolean;
  className?: string;
}

export function ApprovalActionButtons({
  onForward,
  onReturn,
  onCancel,
  onApprove,
  disabled = false,
  loading = false,
  loadingAction = null,
  ceoMode = false,
  employeeMode = false,
  className = "",
}: ApprovalActionButtonsProps) {
  // Employee: Only cancel
  if (employeeMode) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {onCancel && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onCancel}
            disabled={disabled || loading}
            className="h-12 w-12 rounded-2xl border border-border hover:bg-destructive/10 hover:border-destructive transition-colors"
            title="Cancel Request"
          >
            <X className="h-5 w-5 text-destructive" />
          </Button>
        )}
      </div>
    );
  }

  // CEO: Approve + Cancel
  if (ceoMode) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {onApprove && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onApprove}
            disabled={disabled || loading}
            className="h-12 w-12 rounded-2xl border border-border hover:bg-success/10 hover:border-success transition-colors"
            title="Approve"
          >
            <Check className="h-5 w-5 text-success" />
          </Button>
        )}
        {onCancel && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onCancel}
            disabled={disabled || loading}
            className="h-12 w-12 rounded-2xl border border-border hover:bg-destructive/10 hover:border-destructive transition-colors"
            title="Cancel Request"
          >
            <X className="h-5 w-5 text-destructive" />
          </Button>
        )}
      </div>
    );
  }

  // All other roles (DEPT_HEAD, HR_ADMIN, HR_HEAD): Forward, Return, Cancel
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {onForward && (
        <Button
          size="icon"
          variant="ghost"
          onClick={onForward}
          disabled={disabled || loading}
          className="h-12 w-12 rounded-2xl border border-border hover:bg-primary/10 hover:border-primary transition-colors"
          title="Forward to Next Stage"
        >
          {loadingAction === "forward" ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : (
            <ArrowRight className="h-5 w-5 text-primary" />
          )}
        </Button>
      )}
      {onReturn && (
        <Button
          size="icon"
          variant="ghost"
          onClick={onReturn}
          disabled={disabled || loading}
          className="h-12 w-12 rounded-2xl border border-border hover:bg-warning/10 hover:border-warning transition-colors"
          title="Return for Modification"
        >
          {loadingAction === "return" ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-warning border-t-transparent" />
          ) : (
            <RotateCcw className="h-5 w-5 text-warning" />
          )}
        </Button>
      )}
      {onCancel && (
        <Button
          size="icon"
          variant="ghost"
          onClick={onCancel}
          disabled={disabled || loading}
          className="h-12 w-12 rounded-2xl border border-border hover:bg-destructive/10 hover:border-destructive transition-colors"
          title="Cancel Request"
        >
          {loadingAction === "cancel" ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
          ) : (
            <X className="h-5 w-5 text-destructive" />
          )}
        </Button>
      )}
    </div>
  );
}
