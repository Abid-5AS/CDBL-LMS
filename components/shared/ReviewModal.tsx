"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, RotateCcw } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { leaveTypeLabel } from "@/lib/ui";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useUser } from "@/lib/user-context";
import type { AppRole } from "@/lib/rbac";
import { LeaveStatus } from "@prisma/client";
import { UnifiedModal } from "./UnifiedModal";
import { apiPost } from "@/lib/apiClient";

type LeaveRequest = {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  reason: string;
  status: LeaveStatus;
  requester: {
    id: number;
    name: string;
    email: string;
  };
};

type ReviewModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveRequest: LeaveRequest | null;
  onActionComplete?: () => void;
  initialAction?: "forward" | "reject" | "return";
};

/**
 * Unified Review Modal Component
 * Consolidates components/dashboard/ReviewLeaveModal.tsx
 * Uses UnifiedModal for consistent modal behavior
 */
export function ReviewModal({
  open,
  onOpenChange,
  leaveRequest,
  onActionComplete,
  initialAction,
}: ReviewModalProps) {
  const user = useUser();
  const viewerRole = (user?.role as AppRole) || "EMPLOYEE";
  const isHRAdmin = viewerRole === "HR_ADMIN";
  const [action, setAction] = useState<"forward" | "reject" | "return" | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // When modal opens with initialAction, set it immediately
  useEffect(() => {
    if (open) {
      if (initialAction) {
        setAction(initialAction);
      } else {
        setAction(null);
      }
      setNote("");
    } else {
      setAction(null);
      setNote("");
    }
  }, [open, initialAction]);

  const handleForward = useCallback(async () => {
    if (!leaveRequest) return;

    try {
      setSubmitting(true);
      await apiPost(`/api/leaves/${leaveRequest.id}/forward`, {});
      toast.success("Request forwarded successfully");
      await onActionComplete?.();
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }, [leaveRequest, onActionComplete, onOpenChange]);

  const handleReject = useCallback(async () => {
    if (!leaveRequest) return;

    if (!note.trim()) {
      toast.error("Please provide a reason for rejecting this request");
      return;
    }

    try {
      setSubmitting(true);
      await apiPost(`/api/leaves/${leaveRequest.id}/reject`, { comment: note.trim() });
      toast.success("Request rejected");
      await onActionComplete?.();
      onOpenChange(false);
      setAction(null);
      setNote("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }, [leaveRequest, note, onActionComplete, onOpenChange]);

  const handleReturn = useCallback(async () => {
    if (!leaveRequest || !note.trim() || note.trim().length < 5) {
      toast.error("Comment must be at least 5 characters when returning a request");
      return;
    }

    try {
      setSubmitting(true);
      await apiPost(`/api/leaves/${leaveRequest.id}/return`, { comment: note.trim() });
      toast.success("Request returned for modification");
      await onActionComplete?.();
      onOpenChange(false);
      setAction(null);
      setNote("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }, [leaveRequest, note, onActionComplete, onOpenChange]);

  if (!leaveRequest) return null;

  const showActionInput = action === "reject" || action === "return";
  const mainModalOpen = open && !showActionInput;
  const actionModalOpen = open && showActionInput;

  // Main modal footer
  const mainModalFooter = (
    <>
      <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
        Cancel
      </Button>
      {isHRAdmin ? (
        <>
          <Button
            variant="outline"
            onClick={handleForward}
            disabled={submitting}
            className="flex items-center gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            Forward
          </Button>
          <Button
            variant="destructive"
            onClick={() => setAction("reject")}
            disabled={submitting}
          >
            Reject
          </Button>
          <Button
            variant="outline"
            onClick={() => setAction("return")}
            disabled={submitting}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Return
          </Button>
        </>
      ) : (
        <>
          <Button
            variant="destructive"
            onClick={() => setAction("reject")}
            disabled={submitting}
          >
            Reject
          </Button>
          <Button
            onClick={() => toast.info("Approve functionality available for HR Head/CEO")}
            disabled={submitting}
          >
            Approve
          </Button>
        </>
      )}
    </>
  );

  // Action modal footer (for reject/return)
  const actionModalFooter = (
    <>
      <Button variant="outline" onClick={() => setAction(null)} disabled={submitting}>
        Cancel
      </Button>
      <Button
        onClick={() => {
          if (action === "reject") {
            handleReject();
          } else if (action === "return") {
            handleReturn();
          }
        }}
        disabled={submitting || (action === "return" && (!note.trim() || note.trim().length < 5))}
        variant={action === "reject" ? "destructive" : "default"}
      >
        {submitting
          ? "Processing..."
          : action === "reject"
          ? "Confirm Reject"
          : "Confirm Return"}
      </Button>
    </>
  );

  return (
    <>
      {/* Main Review Modal */}
      <UnifiedModal
        open={mainModalOpen}
        onOpenChange={onOpenChange}
        title="Review Leave Request"
        description={`Review and process leave request from ${leaveRequest.requester.name}`}
        footer={mainModalFooter}
        className="max-w-2xl"
        size="2xl"
        disableOutsideClick={actionModalOpen}
      >
        <div className="space-y-4 py-4">
          {/* Employee Info */}
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Employee</h3>
            <p className="text-lg font-medium">{leaveRequest.requester.name}</p>
            <p className="text-sm text-muted-foreground">{leaveRequest.requester.email}</p>
          </div>

          {/* Leave Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="glass-card rounded-xl p-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Leave Type</h3>
              <p className="text-base font-medium">
                {leaveTypeLabel[leaveRequest.type] ?? leaveRequest.type}
              </p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Status</h3>
              <StatusBadge status={leaveRequest.status} />
            </div>
            <div className="glass-card rounded-xl p-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Dates</h3>
              <p className="text-base">
                {formatDate(leaveRequest.startDate)} → {formatDate(leaveRequest.endDate)}
              </p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Working Days</h3>
              <p className="text-base font-medium">{leaveRequest.workingDays} days</p>
            </div>
          </div>

          {/* Reason */}
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Reason</h3>
            <p className="text-sm whitespace-pre-wrap">{leaveRequest.reason}</p>
          </div>
        </div>
      </UnifiedModal>

      {/* Action Modal (Reject/Return) */}
      <UnifiedModal
        open={actionModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setAction(null);
            setNote("");
          }
        }}
        title={
          action === "reject"
            ? "Reject Leave Request"
            : "Return Leave Request for Modification"
        }
        description={
          action === "reject"
            ? `Please provide a reason for rejecting ${leaveRequest.requester.name}'s leave request.`
            : `Return ${leaveRequest.requester.name}'s leave request for modification. Please provide a reason (minimum 5 characters).`
        }
        footer={actionModalFooter}
      >
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={
            action === "return"
              ? "Required: Provide a reason for returning this request (minimum 5 characters)..."
              : "Add a reason for rejecting this request..."
          }
          className="min-h-[120px]"
          required={action === "return"}
        />
      </UnifiedModal>
    </>
  );
}
