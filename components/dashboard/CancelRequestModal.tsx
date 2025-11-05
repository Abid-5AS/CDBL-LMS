"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { leaveTypeLabel } from "@/lib/ui";
import useSWR from "swr";

type LeaveRequest = {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  requester: {
    id: number;
    name: string;
    email: string;
  };
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type CancelRequestModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CancelRequestModal({ open, onOpenChange }: CancelRequestModalProps) {
  const [selectedLeaveId, setSelectedLeaveId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch pending/submitted requests from team members
  const { data, isLoading, mutate } = useSWR<{ items: LeaveRequest[] }>(
    open ? "/api/approvals" : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const allLeaves: LeaveRequest[] = Array.isArray(data?.items) ? data.items : [];

  // Filter to only SUBMITTED/PENDING requests (cancellable)
  const cancellableLeaves = allLeaves.filter(
    (leave) => leave.requester && ["SUBMITTED", "PENDING"].includes(leave.status)
  );

  const selectedLeave = cancellableLeaves.find((l) => l.id.toString() === selectedLeaveId);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedLeaveId("");
      setReason("");
    }
  }, [open]);

  const handleCancel = async () => {
    if (!selectedLeaveId) {
      toast.error("Please select a leave request to cancel");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/leaves/${selectedLeaveId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(payload.message || payload.error || "Failed to cancel request");
        return;
      }

      toast.success("Leave request cancelled successfully");
      await mutate(); // Refresh the list
      onOpenChange(false);
    } catch (err) {
      toast.error("An error occurred while cancelling the request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cancel Leave Request</DialogTitle>
          <DialogDescription>
            Select a leave request from your team members to cancel. You can only cancel
            SUBMITTED or PENDING requests.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="leave-select">Select Request</Label>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : cancellableLeaves.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                No cancellable requests found. Only SUBMITTED or PENDING requests can be
                cancelled.
              </div>
            ) : (
              <Select value={selectedLeaveId} onValueChange={setSelectedLeaveId}>
                <SelectTrigger id="leave-select">
                  <SelectValue placeholder="Select a leave request..." />
                </SelectTrigger>
                <SelectContent>
                  {cancellableLeaves.map((leave) => (
                    <SelectItem key={leave.id} value={leave.id.toString()}>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {leave.requester.name} – {leaveTypeLabel[leave.type] || leave.type}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedLeave && (
            <div className="rounded-lg border border-muted/60 p-3 bg-muted/30">
              <div className="text-sm space-y-1">
                <div>
                  <span className="font-medium">Employee:</span> {selectedLeave.requester.name}
                </div>
                <div>
                  <span className="font-medium">Type:</span>{" "}
                  {leaveTypeLabel[selectedLeave.type] || selectedLeave.type}
                </div>
                <div>
                  <span className="font-medium">Dates:</span> {formatDate(selectedLeave.startDate)}{" "}
                  → {formatDate(selectedLeave.endDate)}
                </div>
                <div>
                  <span className="font-medium">Reason:</span> {selectedLeave.reason}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Cancellation Reason (Optional)</Label>
            <Textarea
              id="cancel-reason"
              placeholder="e.g., Employee resigned, project deadline changed, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              This reason will be visible to the employee and recorded in the audit log.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={!selectedLeaveId || isSubmitting || cancellableLeaves.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cancelling...
              </>
            ) : (
              "Confirm Cancel"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

