/**
 * Reusable approval-related dialog components
 * Used across dashboards for consistent approval, return, forward, and cancel actions
 */

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

/**
 * Approval confirmation dialog
 * Simple yes/no confirmation for approving leave requests
 */
type ApprovalDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  leaveType: string;
  employeeName: string;
  isLoading?: boolean;
};

export function ApprovalDialog({
  open,
  onOpenChange,
  onConfirm,
  leaveType,
  employeeName,
  isLoading = false,
}: ApprovalDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Approve Leave Request</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to approve the {leaveType} request for{" "}
            {employeeName}?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Approving...
              </>
            ) : (
              "Approve"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Reject confirmation dialog
 * Simple yes/no confirmation for rejecting leave requests
 */
type RejectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  leaveType: string;
  employeeName: string;
  isLoading?: boolean;
};

export function RejectDialog({
  open,
  onOpenChange,
  onConfirm,
  leaveType,
  employeeName,
  isLoading = false,
}: RejectDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reject Leave Request</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to reject the {leaveType} request for{" "}
            {employeeName}?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rejecting...
              </>
            ) : (
              "Reject"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Return for modification dialog
 * Includes a comment/reason field for explaining why the request is being returned
 */
type ReturnDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (comment: string) => void | Promise<void>;
  isLoading?: boolean;
};

export function ReturnDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: ReturnDialogProps) {
  const [comment, setComment] = useState("");

  const handleConfirm = async () => {
    await onConfirm(comment);
    setComment(""); // Reset after submission
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setComment(""); // Reset when closing
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Return for Modification</DialogTitle>
          <DialogDescription>
            Provide a reason for returning this leave request to the employee.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="return-comment">Reason</Label>
          <Textarea
            id="return-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Enter reason for returning this request..."
            rows={4}
            disabled={isLoading}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!comment.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Returning...
              </>
            ) : (
              "Return Request"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Forward to next approver dialog
 * Optionally includes a comment field
 */
type ForwardDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (comment?: string) => void | Promise<void>;
  nextApprover?: string;
  isLoading?: boolean;
};

export function ForwardDialog({
  open,
  onOpenChange,
  onConfirm,
  nextApprover,
  isLoading = false,
}: ForwardDialogProps) {
  const [comment, setComment] = useState("");

  const handleConfirm = async () => {
    await onConfirm(comment || undefined);
    setComment(""); // Reset after submission
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setComment(""); // Reset when closing
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Forward Leave Request</DialogTitle>
          <DialogDescription>
            {nextApprover
              ? `Forward this request to ${nextApprover} for approval.`
              : "Forward this request to the next approver in the workflow."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="forward-comment">Comment (Optional)</Label>
          <Textarea
            id="forward-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment for the next approver..."
            rows={3}
            disabled={isLoading}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Forwarding...
              </>
            ) : (
              "Forward Request"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Cancel leave request dialog
 * Includes a reason field for explaining the cancellation
 */
type CancelDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void | Promise<void>;
  isLoading?: boolean;
};

export function CancelDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: CancelDialogProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = async () => {
    await onConfirm(reason);
    setReason(""); // Reset after submission
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setReason(""); // Reset when closing
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cancel Leave Request</DialogTitle>
          <DialogDescription>
            Provide a reason for cancelling this leave request.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="cancel-reason">Cancellation Reason</Label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for cancelling this request..."
            rows={4}
            disabled={isLoading}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelling...
              </>
            ) : (
              "Cancel Request"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
