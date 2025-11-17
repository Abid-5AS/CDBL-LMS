"use client";

import { useEffect, useState } from "react";
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
  Loader2,
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
import { toast } from "sonner";

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
  requester?: {
    role?: string;
    name?: string;
    email?: string;
  };
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
  const [isNudging, setIsNudging] = useState(false);

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

  const handleNudge = async () => {
    if (!leave) return;

    setIsNudging(true);
    try {
      const response = await fetch(`/api/leaves/${leave.id}/nudge`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to send nudge");
        return;
      }

      const data = await response.json();
      toast.success(data.message || "Reminder sent successfully");
    } catch (error) {
      toast.error("Failed to send nudge");
    } finally {
      setIsNudging(false);
    }
  };

  if (!leave) return null;

  const requesterRole = leave.requester?.role;
  const currentIndex = calculateCurrentStageIndex(
    leave.approvals || [],
    leave.status,
    requesterRole
  );
  const nextApprover = getNextApproverRole(currentIndex, requesterRole);
  const latestDate = getLatestApprovalDate(leave.approvals || []);

  const canNudge =
    currentIndex < 4 &&
    leave.status !== "APPROVED" &&
    leave.status !== "REJECTED" &&
    leave.status !== "CANCELLED";

  return (
    <GlassModal open={open} onOpenChange={onOpenChange}>
      <GlassModalContent className="max-w-3xl max-h-[90vh] overflow-y-auto [&>button]:hidden rounded-3xl border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl">
        <GlassModalHeader className="pb-4 border-b border-border/50">
          {/* Header Row 1: Title + Status + Close Button */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <FileText className="h-5 w-5 text-brand shrink-0" />
              <div className="flex items-center gap-2 min-w-0">
                <GlassModalTitle className="text-lg font-semibold text-foreground truncate">
                  {leaveTypeLabel[leave.type] || leave.type}
                </GlassModalTitle>
                <StatusBadge status={leave.status} />
              </div>
            </div>

            {/* Single Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 hover:bg-muted"
              onClick={() => onOpenChange(false)}
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Header Row 2: Stepper */}
          <div className="mb-4">
            <ApprovalStepper
              currentIndex={currentIndex}
              requesterRole={requesterRole as any}
            />
          </div>

          {/* Header Row 3: Status line */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {currentIndex < 4 ? (
                <>
                  Next:{" "}
                  <span className="font-semibold text-foreground">
                    {nextApprover}
                  </span>
                </>
              ) : leave.status === "APPROVED" ? (
                <span className="text-green-600 dark:text-green-400 font-semibold">
                  Approved
                </span>
              ) : leave.status === "REJECTED" ? (
                <span className="text-red-600 dark:text-red-400 font-semibold">
                  Rejected
                </span>
              ) : (
                <span className="font-semibold text-foreground">
                  Completed
                </span>
              )}
            </span>
            {latestDate && (
              <span>
                Last update:{" "}
                <span className="font-medium text-foreground">
                  {formatHeaderDate(latestDate)}
                </span>
              </span>
            )}
          </div>
        </GlassModalHeader>

        <div className="space-y-5 mt-4 px-1">
          {/* Dates and Duration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-muted/50 border border-border/50">
              <Calendar className="h-4 w-4 text-brand mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Start Date
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {formatDate(leave.startDate)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-muted/50 border border-border/50">
              <Calendar className="h-4 w-4 text-brand mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  End Date
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {formatDate(leave.endDate)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-muted/50 border border-border/50">
              <Clock className="h-4 w-4 text-brand mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Duration
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {leave.workingDays} {leave.workingDays === 1 ? "day" : "days"}
                </p>
              </div>
            </div>
          </div>

          {/* Reason */}
          {leave.reason && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Reason
              </p>
              <div className="bg-muted/50 rounded-2xl p-4 border border-border/50">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {leave.reason}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Actions */}
        <GlassModalFooter className="flex justify-between items-center pt-4 border-t border-border/50 mt-6">
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
                onClick={handleNudge}
                disabled={isNudging}
              >
                {isNudging ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Nudge
                  </>
                )}
              </Button>
            )}
          </div>
        </GlassModalFooter>
      </GlassModalContent>
    </GlassModal>
  );
}
