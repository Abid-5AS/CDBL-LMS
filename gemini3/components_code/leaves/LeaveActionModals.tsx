/**
 * Leave Action Modals Component
 *
 * Provides modals for all leave modification actions:
 * - Extension Request
 * - Shorten Leave
 * - Partial Cancellation
 * - Full Cancellation
 * - Fitness Certificate Upload
 */

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, AlertCircle, Upload, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Schema definitions
const extensionSchema = z.object({
  newEndDate: z.string().min(1, "End date is required"),
  extensionReason: z.string().min(10, "Please provide at least 10 characters explaining why you need the extension"),
});

const shortenSchema = z.object({
  newEndDate: z.string().min(1, "End date is required"),
  shortenReason: z.string().min(10, "Please provide at least 10 characters explaining why you're shortening the leave"),
});

const partialCancelSchema = z.object({
  reason: z.string().min(10, "Please provide at least 10 characters explaining the cancellation"),
});

const fitnessCertSchema = z.object({
  certificateFile: z.instanceof(File).optional(),
});

type ExtensionFormData = z.infer<typeof extensionSchema>;
type ShortenFormData = z.infer<typeof shortenSchema>;
type PartialCancelFormData = z.infer<typeof partialCancelSchema>;

interface LeaveActionModalsProps {
  leaveId: number;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  workingDays: number;
  status: string;
}

export function ExtensionRequestModal({
  leaveId,
  endDate,
  open,
  onOpenChange,
}: {
  leaveId: number;
  endDate: Date;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ExtensionFormData>({
    resolver: zodResolver(extensionSchema),
    defaultValues: {
      newEndDate: "",
      extensionReason: "",
    },
  });

  const onSubmit = async (data: ExtensionFormData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/leaves/${leaveId}/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to request extension");
      }

      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date(endDate);
  minDate.setDate(minDate.getDate() + 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Leave Extension</DialogTitle>
          <DialogDescription>
            Create a new extension request that will go through the approval chain separately.
            Your current leave will remain approved.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Extension request submitted successfully! It will appear as a linked request.
            </AlertDescription>
          </Alert>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="newEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New End Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        min={format(minDate, "yyyy-MM-dd")}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Must be after your current end date ({format(endDate, "MMM dd, yyyy")})
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="extensionReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Extension Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain why you need to extend your leave..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Submitting..." : "Submit Extension Request"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ShortenLeaveModal({
  leaveId,
  endDate,
  open,
  onOpenChange,
}: {
  leaveId: number;
  endDate: Date;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ShortenFormData>({
    resolver: zodResolver(shortenSchema),
    defaultValues: {
      newEndDate: "",
      shortenReason: "",
    },
  });

  const onSubmit = async (data: ShortenFormData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/leaves/${leaveId}/shorten`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to shorten leave");
      }

      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const maxDate = new Date(endDate);
  maxDate.setDate(maxDate.getDate() - 1);
  const today = new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Shorten Leave</DialogTitle>
          <DialogDescription>
            Reduce your leave end date. Unused days will be restored to your balance.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Leave shortened successfully! Your balance has been updated.
            </AlertDescription>
          </Alert>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="newEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New End Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        min={format(today, "yyyy-MM-dd")}
                        max={format(maxDate, "yyyy-MM-dd")}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Must be before current end date ({format(endDate, "MMM dd, yyyy")})
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shortenReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Shortening</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain why you're returning early..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Processing..." : "Shorten Leave"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function PartialCancelModal({
  leaveId,
  open,
  onOpenChange,
}: {
  leaveId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<PartialCancelFormData>({
    resolver: zodResolver(partialCancelSchema),
    defaultValues: {
      reason: "",
    },
  });

  const onSubmit = async (data: PartialCancelFormData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/leaves/${leaveId}/partial-cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to cancel leave");
      }

      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cancel Remaining Leave Days</DialogTitle>
          <DialogDescription>
            This will cancel all future days of your leave. Days you've already taken cannot be cancelled.
            Unused days will be restored to your balance.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Future leave days cancelled successfully! Your balance has been updated.
            </AlertDescription>
          </Alert>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cancellation Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain why you're cancelling the remaining days..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This action will immediately end your leave. Past days will remain as taken,
                  but all future days will be cancelled and restored to your balance.
                </AlertDescription>
              </Alert>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="destructive" disabled={loading}>
                  {loading ? "Processing..." : "Cancel Remaining Days"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
