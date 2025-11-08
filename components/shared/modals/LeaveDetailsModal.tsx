"use client";

import { useEffect } from "react";
import {
  GlassModal,
  GlassModalContent,
  GlassModalHeader,
  GlassModalTitle,
  GlassModalDescription,
  GlassModalFooter,
} from "@/components/ui/glass-modal";
import { Badge } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { leaveTypeLabel } from "@/lib/ui";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Calendar,
  Clock,
  FileText,
  User,
  MessageSquare,
  Eye,
  X,
} from "lucide-react";
import { SharedTimeline } from "@/components/shared/SharedTimeline";
import { ApprovalTimelineAdapter } from "@/components/shared/timeline-adapters";
import { ApprovalStepper } from "@/components/shared/forms/ApprovalStepper";
import {
  calculateCurrentStageIndex,
  getNextApproverRole,
  getLatestApprovalDate,
  formatHeaderDate,
} from "@/components/shared/forms/approval-utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui";
import { Button } from "@/components/ui";
import { useRouter } from "next/navigation";

type LeaveDetails = {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  status:
    | "SUBMITTED"
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "CANCELLED"
    | "RETURNED"
    | "CANCELLATION_REQUESTED"
    | "RECALLED";
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
  approvals?: Array<{
    step?: number;
    approver?: string | { name: string | null } | null;
    decision: string;
    comment?: string | null;
    decidedAt?: string | null;
    toRole?: string | null;
  }>;
};

type LeaveDetailsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leave: LeaveDetails | null;
};

export function LeaveDetailsModal({
  open,
  onOpenChange,
  leave,
}: LeaveDetailsModalProps) {
  const router = useRouter();

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!leave) return null;

  const currentIndex = calculateCurrentStageIndex(
    leave.approvals || [],
    leave.status
  );
  const nextApprover = getNextApproverRole(currentIndex);
  const latestDate = getLatestApprovalDate(leave.approvals || []);

  const canNudge =
    currentIndex < 4 &&
    leave.status !== "APPROVED" &&
    leave.status !== "REJECTED" &&
    leave.status !== "CANCELLED";

  return (
    <GlassModal open={open} onOpenChange={onOpenChange}>
      <GlassModalContent className="max-w-3xl max-h-[90vh] overflow-y-auto [&>button]:hidden">
        <GlassModalHeader className="pb-3">
          {/* Header Row 1: Title + Status + Close Button */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div className="flex items-center gap-2 min-w-0">
                <GlassModalTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {leaveTypeLabel[leave.type] || leave.type}
                </GlassModalTitle>
                <StatusBadge status={leave.status} />
              </div>
            </div>

            {/* Single Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => onOpenChange(false)}
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Header Row 2: Stepper */}
          <div className="mb-3">
            <ApprovalStepper currentIndex={currentIndex} />
          </div>

          {/* Header Row 3: Status line */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {currentIndex < 4 ? (
                <>
                  Next:{" "}
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {nextApprover}
                  </span>
                </>
              ) : leave.status === "APPROVED" ? (
                <span className="text-green-600 dark:text-green-500 font-semibold">
                  Approved
                </span>
              ) : leave.status === "REJECTED" ? (
                <span className="text-red-600 dark:text-red-500 font-semibold">
                  Rejected
                </span>
              ) : (
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  Completed
                </span>
              )}
            </span>
            {latestDate && (
              <span>
                Last update:{" "}
                <span className="font-medium">
                  {formatHeaderDate(latestDate)}
                </span>
              </span>
            )}
          </div>
        </GlassModalHeader>

        <div className="space-y-4 mt-2">
          {/* Dates and Duration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Start Date
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {formatDate(leave.startDate)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  End Date
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {formatDate(leave.endDate)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-slate-500 dark:text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Duration
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {leave.workingDays} {leave.workingDays === 1 ? "day" : "days"}
                </p>
              </div>
            </div>
          </div>

          {/* Reason */}
          {leave.reason && (
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                Reason
              </p>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
                  {leave.reason}
                </p>
              </div>
            </div>
          )}

          {/* Approval History (Collapsible) */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem
              value="history"
              className="border-slate-200 dark:border-slate-700"
            >
              <AccordionTrigger className="text-xs font-medium text-slate-700 dark:text-slate-300 py-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5" />
                  <span>History</span>
                  {leave.approvals && leave.approvals.length > 0 && (
                    <span className="text-muted-foreground">
                      ({leave.approvals.length})
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <div className="max-h-64 overflow-y-auto">
                  <SharedTimeline
                    items={ApprovalTimelineAdapter(
                      leave.approvals?.map((a) => ({
                        step: a.step,
                        approver:
                          typeof a.approver === "string"
                            ? a.approver
                            : a.approver?.name || undefined,
                        decision: a.decision,
                        comment: a.comment || undefined,
                        decidedAt: a.decidedAt || undefined,
                        toRole: a.toRole,
                      })) || [],
                      leave.createdAt,
                      leave.status
                    )}
                    variant="approval"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Footer with Actions */}
        <GlassModalFooter className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <div className="flex items-center gap-2">
            {leave.status === "RETURNED" && (
              <Button
                onClick={() => {
                  router.push(`/leaves/${leave.id}/edit`);
                  onOpenChange(false);
                }}
              >
                Edit & Resubmit
              </Button>
            )}
            {(leave.status === "PENDING" || leave.status === "SUBMITTED") && (
              <Button
                variant="destructive"
                onClick={() => {
                  router.push(`/leaves?id=${leave.id}`);
                  onOpenChange(false);
                }}
              >
                Cancel Request
              </Button>
            )}
            {canNudge && (
              <Button
                variant="outline"
                onClick={() => {
                  console.log("Nudge approver for leave", leave.id);
                }}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Nudge
              </Button>
            )}
          </div>
        </GlassModalFooter>
      </GlassModalContent>
    </GlassModal>
  );
}
