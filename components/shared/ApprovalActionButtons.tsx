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
  const buttonSize = size === "sm" ? "h-10 w-10" : "h-12 w-12";
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const gap = size === "sm" ? "gap-2" : "gap-2.5";
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
            className={`group ${buttonSize} rounded-xl border border-[var(--shell-card-border)] bg-[var(--color-card-elevated)] hover:border-red-500/50 hover:bg-red-500/5 transition-all duration-200 shadow-sm hover:shadow-[0_4px_12px_rgba(239,68,68,0.15)]`}
            title="Cancel Request"
          >
            <X
              className={`${iconSize} text-red-600 dark:text-red-400 transition-colors`}
            />
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
            className={`group ${buttonSize} rounded-xl border border-[var(--shell-card-border)] bg-[var(--color-card-elevated)] hover:border-green-500/50 hover:bg-green-500/5 transition-all duration-200 shadow-sm hover:shadow-[0_4px_12px_rgba(34,197,94,0.15)]`}
            title="Approve"
          >
            <Check
              className={`${iconSize} text-green-600 dark:text-green-400 transition-colors`}
            />
          </Button>
        )}
        {onCancel && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onCancel}
            disabled={disabled || loading}
            className={`group ${buttonSize} rounded-xl border border-[var(--shell-card-border)] bg-[var(--color-card-elevated)] hover:border-red-500/50 hover:bg-red-500/5 transition-all duration-200 shadow-sm hover:shadow-[0_4px_12px_rgba(239,68,68,0.15)]`}
            title="Cancel Request"
          >
            <X
              className={`${iconSize} text-red-600 dark:text-red-400 transition-colors`}
            />
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
          className={`group ${buttonSize} rounded-xl border border-[var(--shell-card-border)] bg-[var(--color-card-elevated)] hover:border-[rgb(91,94,252)]/50 hover:bg-[rgba(91,94,252,0.05)] transition-all duration-200 shadow-sm hover:shadow-[0_4px_12px_rgba(91,94,252,0.2)]`}
          title="Forward to Next Stage"
        >
          {loadingAction === "forward" ? (
            <div
              className={`${iconSize} animate-spin rounded-full border-2 border-[rgb(91,94,252)] border-t-transparent`}
            />
          ) : (
            <ArrowRight
              className={`${iconSize} text-[rgb(91,94,252)] transition-colors`}
            />
          )}
        </Button>
      )}
      {onReturn && (
        <Button
          size="icon"
          variant="ghost"
          onClick={onReturn}
          disabled={disabled || loading}
          className={`group ${buttonSize} rounded-xl border border-[var(--shell-card-border)] bg-[var(--color-card-elevated)] hover:border-amber-500/50 hover:bg-amber-500/5 transition-all duration-200 shadow-sm hover:shadow-[0_4px_12px_rgba(245,158,11,0.15)]`}
          title="Return for Modification"
        >
          {loadingAction === "return" ? (
            <div
              className={`${iconSize} animate-spin rounded-full border-2 border-amber-600 border-t-transparent`}
            />
          ) : (
            <RotateCcw
              className={`${iconSize} text-amber-600 dark:text-amber-400 transition-colors`}
            />
          )}
        </Button>
      )}
      {onCancel && (
        <Button
          size="icon"
          variant="ghost"
          onClick={onCancel}
          disabled={disabled || loading}
          className={`group ${buttonSize} rounded-xl border border-[var(--shell-card-border)] bg-[var(--color-card-elevated)] hover:border-red-500/50 hover:bg-red-500/5 transition-all duration-200 shadow-sm hover:shadow-[0_4px_12px_rgba(239,68,68,0.15)]`}
          title="Cancel Request"
        >
          {loadingAction === "cancel" ? (
            <div
              className={`${iconSize} animate-spin rounded-full border-2 border-red-600 border-t-transparent`}
            />
          ) : (
            <X
              className={`${iconSize} text-red-600 dark:text-red-400 transition-colors`}
            />
          )}
        </Button>
      )}
    </div>
  );
}
