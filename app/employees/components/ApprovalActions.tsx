"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea,
} from "@/components/ui";
import { submitApprovalDecision } from "@/lib/api";
import { useUser } from "@/lib/user-context";
import { ArrowRight, RotateCcw } from "lucide-react";
import type { AppRole } from "@/lib/rbac";

type ActionType = "approve" | "reject" | "forward" | "return";

type ApprovalActionsProps = {
  pendingRequestId?: number | null;
  employeeName: string;
  employeeRole: string;
  status?: string;
};

export function ApprovalActions({
  pendingRequestId,
  employeeName,
  employeeRole,
  status,
}: ApprovalActionsProps) {
  // Only show approve/reject buttons for EMPLOYEE role
  const isEmployee = employeeRole === "EMPLOYEE";
  const canAct = Boolean(pendingRequestId) && isEmployee;
  const router = useRouter();
  const user = useUser();
  const viewerRole = (user?.role as AppRole) || "EMPLOYEE";
  const isHRAdmin = viewerRole === "HR_ADMIN";
  const [dialogOpen, setDialogOpen] = useState(false);
  const [action, setAction] = useState<ActionType>("approve");
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);

  // Don't show approval actions at all if not an employee
  if (!isEmployee) {
    return null;
  }

  const handleOpen = useCallback((nextAction: ActionType) => {
    setAction(nextAction);
    // For return action, require comment
    if (nextAction === "return") {
      setDialogOpen(true);
    } else {
      setDialogOpen(true);
    }
  }, []);

  const runAction = useCallback(async () => {
    if (!pendingRequestId) return;
    try {
      setSubmitting(true);

      if (action === "forward") {
        const res = await fetch(`/api/leaves/${pendingRequestId}/forward`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to forward request");
        }
        toast.success("Request forwarded successfully");
      } else if (action === "return") {
        if (!note.trim() || note.trim().length < 5) {
          toast.error(
            "Comment must be at least 5 characters when returning a request"
          );
          return;
        }
        const res = await fetch(`/api/leaves/${pendingRequestId}/return`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comment: note.trim() }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to return request");
        }
        toast.success("Request returned for modification");
      } else {
        await submitApprovalDecision(
          String(pendingRequestId),
          action,
          note.trim() ? note.trim() : undefined
        );
        toast.success(
          `Request ${
            action === "approve" ? "approved" : "rejected"
          } successfully.`
        );
      }

      startTransition(() => {
        router.push("/approvals");
        router.refresh();
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      toast.error(message);
    } finally {
      setSubmitting(false);
      setDialogOpen(false);
      setNote("");
    }
  }, [action, note, pendingRequestId, router, startTransition]);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-4 py-3">
          <div className="flex flex-col text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wide text-slate-600">
              Status
            </span>
            <span>
              {status ?? (canAct ? "Pending HR Review" : "No pending request")}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/approvals")}
              disabled={isPending || submitting}
            >
              Back to Approvals
            </Button>
            {isHRAdmin ? (
              // HR Admin: Forward, Reject, Return
              <>
                <Button
                  variant="outline"
                  onClick={() => handleOpen("forward")}
                  disabled={!canAct || submitting || isPending}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Forward
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleOpen("reject")}
                  disabled={!canAct || submitting || isPending}
                >
                  Reject
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleOpen("return")}
                  disabled={!canAct || submitting || isPending}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Return
                </Button>
              </>
            ) : (
              // HR_HEAD, CEO: Approve, Reject
              <>
                <Button
                  variant="destructive"
                  onClick={() => handleOpen("reject")}
                  disabled={!canAct || submitting || isPending}
                >
                  Reject
                </Button>
                <Button
                  onClick={() => handleOpen("approve")}
                  disabled={!canAct || submitting || isPending}
                >
                  Approve
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "approve" && "Approve Leave Request"}
              {action === "reject" && "Reject Leave Request"}
              {action === "forward" && "Forward Leave Request"}
              {action === "return" && "Return Leave Request for Modification"}
            </DialogTitle>
            <DialogDescription>
              {action === "approve" &&
                `Confirm you want to approve ${employeeName}'s leave request.`}
              {action === "reject" &&
                `Please provide a reason for rejecting ${employeeName}'s leave request.`}
              {action === "forward" &&
                `Forward ${employeeName}'s leave request to the next approver in the chain.`}
              {action === "return" &&
                `Return ${employeeName}'s leave request for modification. Please provide a reason (minimum 5 characters).`}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={
              action === "return"
                ? "Required: Provide a reason for returning this request (minimum 5 characters)..."
                : action === "forward"
                ? "Optional: Add a note about forwarding this request..."
                : "Add an optional note for the employee..."
            }
            className="min-h-[120px]"
            required={action === "return"}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={runAction}
              disabled={
                submitting ||
                (action === "return" &&
                  (!note.trim() || note.trim().length < 5))
              }
            >
              {submitting
                ? "Processing..."
                : action === "approve"
                ? "Confirm Approve"
                : action === "reject"
                ? "Confirm Reject"
                : action === "forward"
                ? "Confirm Forward"
                : "Confirm Return"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
