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
};

export function ApprovalActions({ pendingRequestId, employeeName }: ApprovalActionsProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [action, setAction] = useState<ActionType>("approve");
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);

  const canAct = Boolean(pendingRequestId);

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
      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()} disabled={isPending || submitting}>
          Back
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
