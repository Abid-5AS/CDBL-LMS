"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { mutate } from "swr";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Calendar, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import type { Holiday } from "@/lib/date-utils";

interface LeaveRequest {
    id: number;
    type: string;
    startDate: string;
    endDate: string;
    workingDays: number;
    reason: string;
    status: string;
}

interface CancellationModalProps {
    open: boolean;
    onClose: () => void;
    leave: LeaveRequest | null;
    holidays?: Holiday[];
}

export function CancellationModal({
    open,
    onClose,
    leave,
    holidays = [],
}: CancellationModalProps) {
    const router = useRouter();
    const [reason, setReason] = useState("");
    const [isPartial, setIsPartial] = useState(false);
    const [newDates, setNewDates] = useState<{
        start: Date | undefined;
        end: Date | undefined;
    }>({ start: undefined, end: undefined });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!leave) return null;

    const originalStart = new Date(leave.startDate);
    const originalEnd = new Date(leave.endDate);

    const handleSubmit = async () => {
        if (!reason.trim() || reason.trim().length < 10) {
            setError("Please provide a reason (at least 10 characters)");
            return;
        }

        if (isPartial && (!newDates.start || !newDates.end)) {
            setError("Please select new dates for partial cancellation");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const body: {
                reason: string;
                newStartDate?: string;
                newEndDate?: string;
            } = { reason: reason.trim() };

            if (isPartial && newDates.start && newDates.end) {
                body.newStartDate = newDates.start.toISOString().split("T")[0];
                body.newEndDate = newDates.end.toISOString().split("T")[0];
            }

            const res = await fetch(`/api/leaves/${leave.id}/request-cancel`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to submit cancellation request");
            }

            toast.success(
                isPartial
                    ? "Partial cancellation request submitted"
                    : "Cancellation request submitted"
            );

            // Invalidate caches
            mutate((key) => typeof key === "string" && key.includes("/api/leaves"));
            mutate(
                (key) => typeof key === "string" && key.includes("/api/approvals")
            );

            onClose();
            router.refresh();
        } catch (err: any) {
            setError(err.message || "Failed to submit request");
            toast.error(err.message || "Failed to submit cancellation request");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!submitting) {
            setReason("");
            setIsPartial(false);
            setNewDates({ start: undefined, end: undefined });
            setError(null);
            onClose();
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <X className="h-5 w-5 text-rose-500" />
                        Request Cancellation
                    </DialogTitle>
                    <DialogDescription>
                        Submit a cancellation request for this approved leave. It will go
                        through the approval workflow.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-4">
                    {/* Leave Summary */}
                    <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Leave Type</span>
                            <Badge variant="outline">{leave.type.replace("_", " ")}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Dates</span>
                            <span className="text-sm">
                                {originalStart.toLocaleDateString()} -{" "}
                                {originalEnd.toLocaleDateString()}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Working Days</span>
                            <span className="text-sm font-medium">{leave.workingDays}</span>
                        </div>
                    </div>

                    {/* Partial Cancellation Toggle */}
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="partial">Partial Cancellation</Label>
                            <p className="text-xs text-muted-foreground">
                                Only cancel some days instead of the entire leave
                            </p>
                        </div>
                        <Switch
                            id="partial"
                            checked={isPartial}
                            onCheckedChange={setIsPartial}
                            disabled={submitting || leave.workingDays <= 1}
                        />
                    </div>

                    {/* New Dates Picker (for partial) */}
                    {isPartial && (
                        <div className="space-y-2">
                            <Label>New Leave Period</Label>
                            <p className="text-xs text-muted-foreground mb-2">
                                Select the dates you still want to keep (within original range)
                            </p>
                            <DateRangePicker
                                value={newDates}
                                onChange={setNewDates}
                                holidays={holidays}
                                minDate={originalStart}
                                disabled={submitting}
                                showQuickSelect={false}
                            />
                            {newDates.start && newDates.end && (
                                <p className="text-xs text-muted-foreground">
                                    Days to cancel:{" "}
                                    <span className="font-medium text-rose-600">
                                        {leave.workingDays -
                                            Math.ceil(
                                                (newDates.end.getTime() - newDates.start.getTime()) /
                                                (1000 * 60 * 60 * 24)
                                            ) -
                                            1}
                                    </span>
                                </p>
                            )}
                        </div>
                    )}

                    {/* Reason */}
                    <div className="space-y-2">
                        <Label htmlFor="reason">
                            Reason for Cancellation <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="reason"
                            placeholder="Please explain why you need to cancel this leave..."
                            value={reason}
                            onChange={(e) => {
                                setReason(e.target.value);
                                setError(null);
                            }}
                            disabled={submitting}
                            className="min-h-[100px]"
                        />
                        <p className="text-xs text-muted-foreground">
                            Minimum 10 characters required
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Info */}
                    <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                        <Calendar className="h-4 w-4 shrink-0 text-blue-500 mt-0.5" />
                        <p>
                            Your cancellation request will be reviewed by the same approvers
                            who approved your original leave. Balance will be restored upon
                            final approval.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleSubmit}
                        disabled={submitting || reason.trim().length < 10}
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            "Submit Request"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
