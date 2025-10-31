"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { submitApprovalDecision } from "@/lib/api";

type ActionType = "approve" | "reject";

type ApprovalActionsProps = {
  pendingRequestId?: number | null;
  employeeName: string;
  employeeRole: string;
  status?: string;
};

export function ApprovalActions({ pendingRequestId, employeeName, employeeRole, status }: ApprovalActionsProps) {
  // Only show approve/reject buttons for EMPLOYEE role
  const isEmployee = employeeRole === "EMPLOYEE";
  const canAct = Boolean(pendingRequestId) && isEmployee;
  const router = useRouter();
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
    setDialogOpen(true);
  }, []);

  const runAction = useCallback(async () => {
    if (!pendingRequestId) return;
    try {
      setSubmitting(true);
      await submitApprovalDecision(String(pendingRequestId), action, note.trim() ? note.trim() : undefined);
      toast.success(`Request ${action === "approve" ? "approved" : "rejected"} successfully.`);
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
            <span className="font-semibold uppercase tracking-wide text-slate-600">Status</span>
            <span>{status ?? (canAct ? "Pending HR Review" : "No pending request")}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={() => router.push("/approvals")} disabled={isPending || submitting}>
              Back to Approvals
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleOpen("reject")}
              disabled={!canAct || submitting || isPending}
            >
              Reject
            </Button>
            <Button onClick={() => handleOpen("approve")} disabled={!canAct || submitting || isPending}>
              Approve
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action === "approve" ? "Approve Leave Request" : "Reject Leave Request"}</DialogTitle>
            <DialogDescription>
              {action === "approve"
                ? `Confirm you want to approve ${employeeName}'s leave request.`
                : `Please provide a reason for rejecting ${employeeName}'s leave request.`}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Add an optional note for the employee..."
            className="min-h-[120px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={runAction} disabled={submitting}>
              {submitting ? "Processing..." : action === "approve" ? "Confirm Approve" : "Confirm Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
