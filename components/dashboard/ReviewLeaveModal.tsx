"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, RotateCcw, X } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { leaveTypeLabel } from "@/lib/ui";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useUser } from "@/lib/user-context";
import type { AppRole } from "@/lib/rbac";
import { LeaveStatus } from "@prisma/client";

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

type ReviewLeaveModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveRequest: LeaveRequest | null;
  onActionComplete?: () => void;
  initialAction?: "forward" | "reject" | "return";
};

export function ReviewLeaveModal({
  open,
  onOpenChange,
  leaveRequest,
  onActionComplete,
  initialAction,
}: ReviewLeaveModalProps) {
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
        // If opening with initial action, set it immediately
        setAction(initialAction);
      } else {
        // If opening without initial action, clear any previous action
        setAction(null);
      }
      setNote("");
    } else {
      // Clear action and note when modal closes
      setAction(null);
      setNote("");
    }
  }, [open, initialAction]);

  // Handle main dialog close - ensure nested dialog also closes
  const handleMainDialogChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        // Clear action state first to close nested dialog
        setAction(null);
        setNote("");
      }
      onOpenChange(isOpen);
    },
    [onOpenChange]
  );

  const handleForward = useCallback(async () => {
    if (!leaveRequest) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/leaves/${leaveRequest.id}/forward`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to forward request");
      }
      toast.success("Request forwarded successfully");
      // Wait for action complete (which triggers mutate) before closing
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
      const res = await fetch(`/api/leaves/${leaveRequest.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: note.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to reject request");
      }
      toast.success("Request rejected");
      // Wait for action complete (which triggers mutate) before closing
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
      const res = await fetch(`/api/leaves/${leaveRequest.id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: note.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to return request");
      }
      toast.success("Request returned for modification");
      // Wait for action complete (which triggers mutate) before closing
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

  const showActionDialog = (action === "reject" || action === "return") && open;
  const showMainDialog = open && !showActionDialog;

  return (
    <>
      <Dialog open={showMainDialog} onOpenChange={handleMainDialogChange}>
        <DialogContent className="glass-modal max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Leave Request</DialogTitle>
            <DialogDescription>
              Review and process leave request from {leaveRequest.requester.name}
            </DialogDescription>
          </DialogHeader>

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

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setAction(null);
                setNote("");
                onOpenChange(false);
              }} 
              disabled={submitting}
            >
              Cancel
            </Button>
            {isHRAdmin ? (
              // HR Admin: Forward, Reject, Return
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
                  onClick={() => {
                    setAction("reject");
                  }}
                  disabled={submitting}
                >
                  Reject
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAction("return");
                  }}
                  disabled={submitting}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Return
                </Button>
              </>
            ) : (
              // HR_HEAD, CEO: Approve, Reject
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setAction("reject");
                  }}
                  disabled={submitting}
                >
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    // Approve action would go here for HR_HEAD/CEO
                    toast.info("Approve functionality available for HR Head/CEO");
                  }}
                  disabled={submitting}
                >
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject/Return Confirmation Dialog */}
      <Dialog 
        open={showActionDialog} 
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setAction(null);
            setNote("");
            // If closing the nested dialog, also close the main dialog
            onOpenChange(false);
          }
        }}
      >
        <DialogContent className="glass-modal">
          <DialogHeader>
            <DialogTitle>
              {action === "reject" && "Reject Leave Request"}
              {action === "return" && "Return Leave Request for Modification"}
            </DialogTitle>
            <DialogDescription>
              {action === "reject" &&
                `Please provide a reason for rejecting ${leaveRequest.requester.name}'s leave request.`}
              {action === "return" &&
                `Return ${leaveRequest.requester.name}'s leave request for modification. Please provide a reason (minimum 5 characters).`}
            </DialogDescription>
          </DialogHeader>
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
          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

