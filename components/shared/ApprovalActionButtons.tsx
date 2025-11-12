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
  /** Button size variant */
  size?: "default" | "sm";
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
  size = "default",
  className = "",
}: ApprovalActionButtonsProps) {
  const buttonSize = size === "sm" ? "h-9 w-9" : "h-12 w-12";
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const gap = size === "sm" ? "gap-1.5" : "gap-2";
  // Employee: Only cancel
  if (employeeMode) {
    return (
      <div className={`flex items-center ${gap} ${className}`}>
        {onCancel && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onCancel}
            disabled={disabled || loading}
            className={`group ${buttonSize} rounded-2xl border border-border hover:border-destructive transition-colors`}
            title="Cancel Request"
          >
            <X className={`${iconSize} text-destructive group-hover:text-destructive transition-colors`} />
          </Button>
        )}
      </div>
    );
  }

  // CEO: Approve + Cancel
  if (ceoMode) {
    return (
      <div className={`flex items-center ${gap} ${className}`}>
        {onApprove && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onApprove}
            disabled={disabled || loading}
            className={`group ${buttonSize} rounded-2xl border border-border hover:border-success transition-colors`}
            title="Approve"
          >
            <Check className={`${iconSize} text-success group-hover:text-success transition-colors`} />
          </Button>
        )}
        {onCancel && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onCancel}
            disabled={disabled || loading}
            className={`group ${buttonSize} rounded-2xl border border-border hover:border-destructive transition-colors`}
            title="Cancel Request"
          >
            <X className={`${iconSize} text-destructive group-hover:text-destructive transition-colors`} />
          </Button>
        )}
      </div>
    );
  }

  // All other roles (DEPT_HEAD, HR_ADMIN, HR_HEAD): Forward, Return, Cancel
  return (
    <div className={`flex items-center ${gap} ${className}`}>
      {onForward && (
        <Button
          size="icon"
          variant="ghost"
          onClick={onForward}
          disabled={disabled || loading}
          className={`group ${buttonSize} rounded-2xl border border-border hover:border-primary transition-colors`}
          title="Forward to Next Stage"
        >
          {loadingAction === "forward" ? (
            <div className={`${iconSize} animate-spin rounded-full border-2 border-primary border-t-transparent`} />
          ) : (
            <ArrowRight className={`${iconSize} text-primary group-hover:text-primary transition-colors`} />
          )}
        </Button>
      )}
      {onReturn && (
        <Button
          size="icon"
          variant="ghost"
          onClick={onReturn}
          disabled={disabled || loading}
          className={`group ${buttonSize} rounded-2xl border border-border hover:border-warning transition-colors`}
          title="Return for Modification"
        >
          {loadingAction === "return" ? (
            <div className={`${iconSize} animate-spin rounded-full border-2 border-warning border-t-transparent`} />
          ) : (
            <RotateCcw className={`${iconSize} text-warning group-hover:text-warning transition-colors`} />
          )}
        </Button>
      )}
      {onCancel && (
        <Button
          size="icon"
          variant="ghost"
          onClick={onCancel}
          disabled={disabled || loading}
          className={`group ${buttonSize} rounded-2xl border border-border hover:border-destructive transition-colors`}
          title="Cancel Request"
        >
          {loadingAction === "cancel" ? (
            <div className={`${iconSize} animate-spin rounded-full border-2 border-destructive border-t-transparent`} />
          ) : (
            <X className={`${iconSize} text-destructive group-hover:text-destructive transition-colors`} />
          )}
        </Button>
      )}
    </div>
  );
}
