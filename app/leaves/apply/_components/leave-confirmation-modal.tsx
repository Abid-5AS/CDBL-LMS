"use client";

import { Calendar, Clock, AlertCircle, FileText } from "lucide-react";
import {
  GlassModal,
  GlassModalContent,
  GlassModalHeader,
  GlassModalFooter,
  GlassModalTitle,
  GlassModalDescription,
} from "@/components/ui/glass-modal";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { LeaveType } from "./leave-constants";

interface LeaveConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  submitting: boolean;
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  duration: number;
  reason: string;
  fileName: string | null;
  currentBalance: number;
  projectedBalance: number;
  warnings: string[];
}

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  EARNED: "Earned Leave",
  CASUAL: "Casual Leave",
  MEDICAL: "Sick Leave",
  MATERNITY: "Maternity Leave",
  PATERNITY: "Paternity Leave",
  STUDY: "Study Leave",
  SPECIAL_DISABILITY: "Special Disability Leave",
  QUARANTINE: "Quarantine Leave",
  EXTRAWITHPAY: "Extra With Pay",
  EXTRAWITHOUTPAY: "Extra Without Pay",
};

export function LeaveConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  submitting,
  type,
  startDate,
  endDate,
  duration,
  reason,
  fileName,
  currentBalance,
  projectedBalance,
  warnings,
}: LeaveConfirmationModalProps) {
  const balanceChange = projectedBalance - currentBalance;
  const isInsufficientBalance = projectedBalance < 0;

  return (
    <GlassModal open={open} onOpenChange={onOpenChange}>
      <GlassModalContent className="max-w-2xl">
        <GlassModalHeader>
          <GlassModalTitle className="text-2xl">
            Review Your Leave Application
          </GlassModalTitle>
          <GlassModalDescription>
            Please review your details carefully before submitting. This request
            will be sent for approval.
          </GlassModalDescription>
        </GlassModalHeader>

        <div className="space-y-4 py-4">
          {/* Leave Summary Card */}
          <div className="rounded-xl border border-bg-primary/20 bg-bg-primary/50 dark:bg-bg-secondary/50 p-4 backdrop-blur-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-data-info p-2 dark:bg-data-info/30">
                  <Calendar className="h-4 w-4 text-data-info dark:text-data-info" />
                </div>
                <div>
                  <p className="text-xs font-medium text-text-secondary dark:text-text-secondary">
                    Leave Type
                  </p>
                  <p className="text-sm font-semibold text-text-secondary dark:text-text-secondary">
                    {LEAVE_TYPE_LABELS[type]}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-data-success p-2 dark:bg-data-success/30">
                  <Clock className="h-4 w-4 text-data-success dark:text-data-success" />
                </div>
                <div>
                  <p className="text-xs font-medium text-text-secondary dark:text-text-secondary">
                    Duration
                  </p>
                  <p className="text-sm font-semibold text-text-secondary dark:text-text-secondary">
                    {duration} day(s)
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2 border-t border-border-strong dark:border-border-strong pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary dark:text-text-secondary">
                  Start Date
                </span>
                <span className="font-medium text-text-secondary dark:text-text-secondary">
                  {formatDate(startDate)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary dark:text-text-secondary">
                  End Date
                </span>
                <span className="font-medium text-text-secondary dark:text-text-secondary">
                  {formatDate(endDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Balance Impact */}
          <div className="rounded-xl border border-bg-primary/20 bg-bg-primary/50 dark:bg-bg-secondary/50 p-4 backdrop-blur-sm">
            <h4 className="text-sm font-semibold text-text-secondary dark:text-text-secondary mb-3">
              Balance Impact
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary dark:text-text-secondary">
                  Current Balance
                </span>
                <span className="font-medium text-text-secondary dark:text-text-secondary">
                  {currentBalance} days
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary dark:text-text-secondary">
                  After This Leave
                </span>
                <span
                  className={`font-semibold ${
                    isInsufficientBalance
                      ? "text-data-error dark:text-data-error"
                      : projectedBalance < 2
                      ? "text-data-warning dark:text-data-warning"
                      : "text-data-success dark:text-data-success"
                  }`}
                >
                  {projectedBalance >= 0 ? projectedBalance : 0} days
                </span>
              </div>
              <div className="flex items-center justify-between text-sm border-t border-border-strong dark:border-border-strong pt-2 mt-2">
                <span className="text-text-secondary dark:text-text-secondary">
                  Days Deducted
                </span>
                <span className="font-medium text-data-error dark:text-data-error">
                  -{Math.abs(balanceChange)} days
                </span>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="rounded-xl border border-bg-primary/20 bg-bg-primary/50 dark:bg-bg-secondary/50 p-4 backdrop-blur-sm">
            <h4 className="text-sm font-semibold text-text-secondary dark:text-text-secondary mb-2">
              Reason
            </h4>
            <p className="text-sm text-text-secondary dark:text-text-secondary whitespace-pre-wrap">
              {reason}
            </p>
          </div>

          {/* Attached File */}
          {fileName && (
            <div className="rounded-xl border border-bg-primary/20 bg-bg-primary/50 dark:bg-bg-secondary/50 p-4 backdrop-blur-sm">
              <h4 className="text-sm font-semibold text-text-secondary dark:text-text-secondary mb-2">
                Attached Document
              </h4>
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-data-info dark:text-data-info" />
                <span className="text-text-secondary dark:text-text-secondary truncate">
                  {fileName}
                </span>
              </div>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="rounded-xl border border-data-warning dark:border-data-warning bg-data-warning dark:bg-data-warning/20 p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-data-warning dark:text-data-warning shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-data-warning dark:text-data-warning">
                    Important Notice
                  </h4>
                  <ul className="space-y-1">
                    {warnings.map((warning, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-data-warning dark:text-data-warning"
                      >
                        • {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <GlassModalFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="dark:border-border-strong"
          >
            Go Back
          </Button>
          <Button
            onClick={onConfirm}
            disabled={submitting}
            className="bg-card-action hover:bg-card-action"
          >
            {submitting ? "Submitting..." : "Confirm & Submit"}
          </Button>
        </GlassModalFooter>
      </GlassModalContent>
    </GlassModal>
  );
}
