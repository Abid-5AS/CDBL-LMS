"use client";

import { Calendar, Clock, AlertCircle, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
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
  SPECIAL: "Special Leave",
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-surface-1 border border-outline/60 dark:border-border shadow-panel">
        <DialogHeader>
          <DialogTitle className="text-2xl">Review Your Leave Application</DialogTitle>
          <DialogDescription>
            Please review your details carefully before submitting. This request will be sent for approval.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Leave Summary Card */}
          <div className="rounded-xl border border-outline/60 dark:border-border/60 bg-surface-2 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-info/10 text-info p-2">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Leave Type</p>
                  <p className="text-sm font-semibold text-foreground">{LEAVE_TYPE_LABELS[type]}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-success/10 text-success p-2">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Duration</p>
                  <p className="text-sm font-semibold text-foreground">{duration} day(s)</p>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2 border-t border-outline/60 dark:border-border/60 pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Start Date</span>
                <span className="font-medium text-foreground">{formatDate(startDate)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">End Date</span>
                <span className="font-medium text-foreground">{formatDate(endDate)}</span>
              </div>
            </div>
          </div>

          {/* Balance Impact */}
          <div className="rounded-xl border border-outline/60 dark:border-border/60 bg-surface-2 p-4">
            <h4 className="text-sm font-semibold text-foreground mb-3">Balance Impact</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Current Balance</span>
                <span className="font-medium text-foreground">{currentBalance} days</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">After This Leave</span>
                <span
                  className={cn(
                    "font-semibold",
                    isInsufficientBalance
                      ? "text-danger"
                      : projectedBalance < 2
                      ? "text-warning"
                      : "text-success"
                  )}
                >
                  {projectedBalance >= 0 ? projectedBalance : 0} days
                </span>
              </div>
              <div className="flex items-center justify-between text-sm border-t border-outline/60 dark:border-border/60 pt-2 mt-2">
                <span className="text-muted-foreground">Days Deducted</span>
                <span className="font-medium text-danger">-{Math.abs(balanceChange)} days</span>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="rounded-xl border border-outline/60 dark:border-border/60 bg-surface-2 p-4">
            <h4 className="text-sm font-semibold text-foreground mb-2">Reason</h4>
            <p className="text-sm text-foreground whitespace-pre-wrap">{reason}</p>
          </div>

          {/* Attached File */}
          {fileName && (
            <div className="rounded-xl border border-outline/60 dark:border-border/60 bg-surface-2 p-4">
              <h4 className="text-sm font-semibold text-foreground mb-2">Attached Document</h4>
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-info" />
                <span className="text-foreground truncate">{fileName}</span>
              </div>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="rounded-xl border border-warning bg-warning/10 p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-warning shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">Please review:</p>
                  <ul className="space-y-1 text-sm">
                    {warnings.map((warning, index) => (
                      <li key={index} className="text-foreground">
                        • {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Go Back
          </Button>
          <Button onClick={onConfirm} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
