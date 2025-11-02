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

type LeaveType = "CASUAL" | "MEDICAL" | "EARNED";

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
  CASUAL: "Casual Leave",
  MEDICAL: "Sick Leave",
  EARNED: "Earned Leave",
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
          <GlassModalTitle className="text-2xl">Review Your Leave Application</GlassModalTitle>
          <GlassModalDescription>
            Please review your details carefully before submitting. This request will be sent for approval.
          </GlassModalDescription>
        </GlassModalHeader>

        <div className="space-y-4 py-4">
          {/* Leave Summary Card */}
          <div className="rounded-xl border border-white/20 bg-white/50 dark:bg-slate-800/50 p-4 backdrop-blur-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                  <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Leave Type</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{LEAVE_TYPE_LABELS[type]}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30">
                  <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Duration</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{duration} day(s)</p>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2 border-t border-slate-200 dark:border-slate-700 pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Start Date</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{formatDate(startDate)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">End Date</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{formatDate(endDate)}</span>
              </div>
            </div>
          </div>

          {/* Balance Impact */}
          <div className="rounded-xl border border-white/20 bg-white/50 dark:bg-slate-800/50 p-4 backdrop-blur-sm">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Balance Impact</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Current Balance</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{currentBalance} days</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">After This Leave</span>
                <span
                  className={`font-semibold ${
                    isInsufficientBalance
                      ? "text-red-600 dark:text-red-400"
                      : projectedBalance < 2
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {projectedBalance >= 0 ? projectedBalance : 0} days
                </span>
              </div>
              <div className="flex items-center justify-between text-sm border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                <span className="text-slate-600 dark:text-slate-400">Days Deducted</span>
                <span className="font-medium text-red-600 dark:text-red-400">-{Math.abs(balanceChange)} days</span>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="rounded-xl border border-white/20 bg-white/50 dark:bg-slate-800/50 p-4 backdrop-blur-sm">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Reason</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{reason}</p>
          </div>

          {/* Attached File */}
          {fileName && (
            <div className="rounded-xl border border-white/20 bg-white/50 dark:bg-slate-800/50 p-4 backdrop-blur-sm">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Attached Document</h4>
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-slate-700 dark:text-slate-300 truncate">{fileName}</span>
              </div>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100">Important Notice</h4>
                  <ul className="space-y-1">
                    {warnings.map((warning, idx) => (
                      <li key={idx} className="text-sm text-amber-700 dark:text-amber-200">
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
            className="dark:border-slate-700"
          >
            Go Back
          </Button>
          <Button onClick={onConfirm} disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700">
            {submitting ? "Submitting..." : "Confirm & Submit"}
          </Button>
        </GlassModalFooter>
      </GlassModalContent>
    </GlassModal>
  );
}
