"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Forward,
  Loader2,
} from "lucide-react";
import { LeaveType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  approveLeaveRequest,
  rejectLeaveRequest,
  forwardLeaveRequest,
  returnLeaveForModification,
} from "@/app/actions/leave-actions";

type ApprovalActionCardProps = {
  leaveId: number;
  leaveType: LeaveType;
  currentUserRole: string;
};

type DialogType = "approve" | "reject" | "forward" | "return" | null;

export function ApprovalActionCard({
  leaveId,
  leaveType,
  currentUserRole,
}: ApprovalActionCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [comment, setComment] = useState("");

  // Determine which actions are available based on role
  const isCEO = currentUserRole === "CEO";
  const canForward = ["HR_ADMIN", "DEPT_HEAD"].includes(currentUserRole);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea or if a dialog is open
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        activeDialog !== null ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      ) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case "a":
          event.preventDefault();
          setActiveDialog("approve");
          break;
        case "r":
          event.preventDefault();
          setActiveDialog("reject");
          break;
        case "m":
          event.preventDefault();
          setActiveDialog("return");
          break;
        case "f":
          if (canForward) {
            event.preventDefault();
            setActiveDialog("forward");
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeDialog, canForward]);

  const handleApprove = async () => {
    startTransition(async () => {
      try {
        const result = await approveLeaveRequest(leaveId, comment || undefined);

        if (result.success) {
          toast.success("Leave request approved successfully");
          router.push("/approvals");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to approve request");
        }
      } catch (error) {
        toast.error("An error occurred while approving");
      } finally {
        setActiveDialog(null);
        setComment("");
      }
    });
  };

  const handleReject = async () => {
    if (!comment || comment.length < 5) {
      toast.error("Please provide a reason for rejection (minimum 5 characters)");
      return;
    }

    startTransition(async () => {
      try {
        const result = await rejectLeaveRequest(leaveId, comment);

        if (result.success) {
          toast.success("Leave request rejected");
          router.push("/approvals");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to reject request");
        }
      } catch (error) {
        toast.error("An error occurred while rejecting");
      } finally {
        setActiveDialog(null);
        setComment("");
      }
    });
  };

  const handleForward = async () => {
    startTransition(async () => {
      try {
        const result = await forwardLeaveRequest(leaveId);

        if (result.success) {
          toast.success("Leave request forwarded to next approver");
          router.push("/approvals");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to forward request");
        }
      } catch (error) {
        toast.error("An error occurred while forwarding");
      } finally {
        setActiveDialog(null);
      }
    });
  };

  const handleReturn = async () => {
    if (!comment || comment.length < 5) {
      toast.error(
        "Please provide detailed feedback (minimum 5 characters)"
      );
      return;
    }

    startTransition(async () => {
      try {
        const result = await returnLeaveForModification(leaveId, comment);

        if (result.success) {
          toast.success("Request returned to employee for modification");
          router.push("/approvals");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to return request");
        }
      } catch (error) {
        toast.error("An error occurred while returning request");
      } finally {
        setActiveDialog(null);
        setComment("");
      }
    });
  };

  return (
    <>
      <Card className="rounded-2xl border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-lg sticky top-6">
        <CardHeader>
          <CardTitle className="text-xl">Take Action</CardTitle>
          <CardDescription>
            Review the request details and make a decision
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Approve Button */}
          <Button
            onClick={() => setActiveDialog("approve")}
            disabled={isPending}
            className="w-full h-12 text-base bg-green-600 hover:bg-green-700 justify-between"
            size="lg"
            leftIcon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
          >
            <span>Approve Request</span>
            <kbd className="hidden sm:inline-flex h-5 min-w-5 items-center justify-center rounded border border-white/30 bg-white/20 px-1.5 text-[11px] font-medium text-white">
              A
            </kbd>
          </Button>

          {/* Reject Button */}
          <Button
            onClick={() => setActiveDialog("reject")}
            disabled={isPending}
            className="w-full h-12 text-base bg-red-600 hover:bg-red-700 justify-between"
            size="lg"
            variant="destructive"
            leftIcon={<XCircle className="h-4 w-4" aria-hidden="true" />}
          >
            <span>Reject Request</span>
            <kbd className="hidden sm:inline-flex h-5 min-w-5 items-center justify-center rounded border border-white/30 bg-white/20 px-1.5 text-[11px] font-medium text-white">
              R
            </kbd>
          </Button>

          {/* Forward Button (if not CEO) */}
          {canForward && (
            <Button
              onClick={() => setActiveDialog("forward")}
              disabled={isPending}
              className="w-full h-12 text-base justify-between"
              size="lg"
              variant="secondary"
              leftIcon={<Forward className="h-4 w-4" aria-hidden="true" />}
            >
              <span>Forward to Next Approver</span>
              <kbd className="hidden sm:inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-muted px-1.5 text-[11px] font-medium">
                F
              </kbd>
            </Button>
          )}

          {/* Return Button */}
          <Button
            onClick={() => setActiveDialog("return")}
            disabled={isPending}
            className="w-full h-12 text-base justify-between"
            size="lg"
            variant="outline"
            leftIcon={<RotateCcw className="h-4 w-4" aria-hidden="true" />}
          >
            <span>Return for Modification</span>
            <kbd className="hidden sm:inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-muted px-1.5 text-[11px] font-medium">
              M
            </kbd>
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-4">
            All actions will send email notifications to relevant parties
          </p>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <AlertDialog
        open={activeDialog === "approve"}
        onOpenChange={(open) => !open && setActiveDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Leave Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this {leaveType.toLowerCase()} leave request? The employee will be notified via email.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="approve-comment" className="text-sm">
              Optional Comment
            </Label>
            <Textarea
              id="approve-comment"
              placeholder="Add any notes or instructions..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {isPending ? (
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

      {/* Reject Dialog */}
      <Dialog
        open={activeDialog === "reject"}
        onOpenChange={(open) => !open && setActiveDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
            <DialogDescription>
              Please provide a clear reason for rejection. The employee will receive this feedback.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reject-comment" className="text-sm font-medium">
              Reason for Rejection <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reject-comment"
              placeholder="Explain why this request is being rejected..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-2"
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground mt-2">
              Minimum 5 characters required
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActiveDialog(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={isPending || comment.length < 5}
              variant="destructive"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Reject Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Forward Dialog */}
      <AlertDialog
        open={activeDialog === "forward"}
        onOpenChange={(open) => !open && setActiveDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Forward to Next Approver</AlertDialogTitle>
            <AlertDialogDescription>
              This request will be forwarded to the next approver in the chain. They will be notified via email.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForward}
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Forwarding...
                </>
              ) : (
                "Forward"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Return Dialog */}
      <Dialog
        open={activeDialog === "return"}
        onOpenChange={(open) => !open && setActiveDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return for Modification</DialogTitle>
            <DialogDescription>
              Provide specific feedback so the employee can improve their request.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="return-comment" className="text-sm font-medium">
              Feedback for Employee <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="return-comment"
              placeholder="What needs to be changed or clarified?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-2"
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground mt-2">
              Minimum 5 characters required
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActiveDialog(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReturn}
              disabled={isPending || comment.length < 5}
              variant="secondary"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Returning...
                </>
              ) : (
                "Return to Employee"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
