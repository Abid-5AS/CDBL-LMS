"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Decision = "approve" | "reject";

export default function ApproveActions({ id }: { id: string }) {
  const router = useRouter();
  const [pendingBtn, setPendingBtn] = useState<Decision | null>(null);
  const [isPending, startTransition] = useTransition();

  async function decide(action: Decision) {
    try {
      setPendingBtn(action);
      const res = await fetch(`/api/approvals/${id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || "Failed");
      }

      toast.success(`Request ${action === "approve" ? "approved" : "rejected"}`, {
        description: `Status: ${payload.status}`,
      });
      startTransition(() => router.refresh());
    } catch (e: any) {
      toast.error(`Could not ${action}`, { description: e?.message ?? "Unexpected error" });
    } finally {
      setPendingBtn(null);
    }
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => decide("approve")} disabled={isPending || pendingBtn !== null}>
        {pendingBtn === "approve" ? "Approving..." : "Approve"}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => decide("reject")}
        disabled={isPending || pendingBtn !== null}
      >
        {pendingBtn === "reject" ? "Rejecting..." : "Reject"}
      </Button>
    </div>
  );
}
