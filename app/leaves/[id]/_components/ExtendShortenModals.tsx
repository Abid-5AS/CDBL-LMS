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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type ExtendModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveId: number;
  currentEndDate: Date;
  onSuccess: () => void;
};

type ShortenModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveId: number;
  currentEndDate: Date;
  currentStartDate: Date;
  onSuccess: () => void;
};

export function ExtendLeaveModal({
  open,
  onOpenChange,
  leaveId,
  currentEndDate,
  onSuccess,
}: ExtendModalProps) {
  const [newEndDate, setNewEndDate] = useState<Date | undefined>();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!newEndDate || !reason || reason.length < 10) {
      setError("Please select a date and provide a reason (min 10 characters)");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/leaves/${leaveId}/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newEndDate: newEndDate.toISOString(),
          extensionReason: reason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to extend leave");
      }

      onSuccess();
      onOpenChange(false);
      setNewEndDate(undefined);
      setReason("");
    } catch (err: any) {
      setError(err.message || "Failed to extend leave");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-[500px] bg-surface-1 border border-outline/60 dark:border-border shadow-panel")}>
        <DialogHeader>
          <DialogTitle className="text-xl">Extend Leave Request</DialogTitle>
          <DialogDescription>
            Extend your approved leave. The extension will go through the approval process.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="font-semibold">Current End Date</Label>
            <div className="text-sm font-medium text-muted-foreground bg-muted/50 p-3 rounded-lg backdrop-blur-sm">
              {format(currentEndDate, "PPP")}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">New End Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newEndDate ? format(newEndDate, "PPP") : "Select new end date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-surface-1 border border-outline/60 dark:border-border shadow-card rounded-xl">
                <Calendar
                  mode="single"
                  selected={newEndDate}
                  onSelect={setNewEndDate}
                  disabled={(date) => date <= currentEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">Reason for Extension *</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you need to extend your leave..."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Minimum 10 characters ({reason.length}/10)
            </p>
          </div>

          {error && (
            <div className={cn("text-sm text-white p-3 rounded-lg", "bg-gradient-to-br from-red-500/90 to-red-600/70 shadow-lg shadow-red-500/30")}>
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Extension Request"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ShortenLeaveModal({
  open,
  onOpenChange,
  leaveId,
  currentEndDate,
  currentStartDate,
  onSuccess,
}: ShortenModalProps) {
  const [newEndDate, setNewEndDate] = useState<Date | undefined>();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleSubmit = async () => {
    if (!newEndDate || !reason || reason.length < 10) {
      setError("Please select a date and provide a reason (min 10 characters)");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/leaves/${leaveId}/shorten`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newEndDate: newEndDate.toISOString(),
          shortenReason: reason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to shorten leave");
      }

      onSuccess();
      onOpenChange(false);
      setNewEndDate(undefined);
      setReason("");
    } catch (err: any) {
      setError(err.message || "Failed to shorten leave");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-[500px] bg-surface-1 border border-outline/60 dark:border-border shadow-panel")}>
        <DialogHeader>
          <DialogTitle className="text-xl">Shorten Leave Request</DialogTitle>
          <DialogDescription>
            Return to work earlier than planned. Days will be restored to your balance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="font-semibold">Current End Date</Label>
            <div className="text-sm font-medium text-muted-foreground bg-muted/50 p-3 rounded-lg backdrop-blur-sm">
              {format(currentEndDate, "PPP")}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">New End Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newEndDate ? format(newEndDate, "PPP") : "Select new end date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-surface-1 border border-outline/60 dark:border-border shadow-card rounded-xl">
                <Calendar
                  mode="single"
                  selected={newEndDate}
                  onSelect={setNewEndDate}
                  disabled={(date) => {
                    const dateOnly = new Date(date);
                    dateOnly.setHours(0, 0, 0, 0);
                    return dateOnly < today || dateOnly >= currentEndDate || dateOnly < currentStartDate;
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              Must be before current end date and not in the past
            </p>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">Reason for Shortening *</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you're returning earlier..."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Minimum 10 characters ({reason.length}/10)
            </p>
          </div>

          {error && (
            <div className={cn("text-sm text-white p-3 rounded-lg", "bg-gradient-to-br from-red-500/90 to-red-600/70 shadow-lg shadow-red-500/30")}>
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Shorten Leave"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
