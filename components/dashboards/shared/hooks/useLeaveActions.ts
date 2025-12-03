/**
 * Custom hook for handling leave approval actions
 */

import { useState } from "react";
import { toast } from "sonner";
import { SUCCESS_MESSAGES, getToastMessage } from "@/lib";

type LeaveAction = "approve" | "reject" | "forward" | "return" | "cancel";

export function useLeaveActions(onMutate?: () => Promise<any>) {
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  const handleAction = async (
    leaveId: number,
    action: LeaveAction,
    comment?: string,
    ignoreWarnings: boolean = false
  ) => {
    setProcessingIds((prev) => new Set(prev).add(leaveId));

    try {
      const endpoint = `/api/leaves/${leaveId}/${action}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: comment || "",
          reason: comment || undefined,
          ignoreWarnings,
        }),
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Handle capacity conflict warning
        if (payload?.error?.code === "capacity_conflict") {
          return { warning: payload.error };
        }

        const errorMessage = getToastMessage(
          payload?.error || `Failed to ${action} request`,
          payload?.message
        );
        toast.error(errorMessage);
        return;
      }

      // Success messages
      const successMessages = {
        approve: SUCCESS_MESSAGES.leave_approved,
        reject: SUCCESS_MESSAGES.leave_rejected,
        return: SUCCESS_MESSAGES.returned_for_modification,
        cancel: "Leave request cancelled successfully",
        forward: SUCCESS_MESSAGES.leave_forwarded,
      };
      toast.success(successMessages[action]);

      // Refresh data
      if (onMutate) {
        await onMutate();
      } else if (typeof window !== "undefined") {
        window.location.reload();
      }

      return { success: true };
    } catch (err) {
      toast.error(getToastMessage("network_error", "Unable to update request"));
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(leaveId);
        return next;
      });
    }
  };

  return {
    handleAction,
    processingIds,
    isProcessing: (id: number) => processingIds.has(id),
  };
}
