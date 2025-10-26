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
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Actions</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {canAct
            ? "Review the current request and choose to approve or reject it."
            : "No pending leave request requires your action right now."}
        </p>
        <div className="mt-4 flex flex-col gap-3">
          <Button variant="outline" onClick={() => router.push("/approvals")} disabled={isPending || submitting}>
            Back to Approvals
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleOpen("reject")}
            disabled={!canAct || submitting || isPending}
            className="w-full"
          >
            Reject Request
          </Button>
          <Button onClick={() => handleOpen("approve")} disabled={!canAct || submitting || isPending} className="w-full">
            Approve Request
          </Button>
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
