"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle, Info, RotateCcw, Calendar } from "lucide-react";
import { toast } from "sonner";
import { SUCCESS_MESSAGES, getToastMessage } from "@/lib/toast-messages";
import { DateRangePicker, FileUploadSection } from "@/components/shared";
import { LeaveRequest, LeaveComment } from "@prisma/client";
import { formatDate } from "@/lib/utils";
import { leaveTypeLabel } from "@/lib/ui";
import Link from "next/link";

type EditLeaveFormProps = {
  leave: LeaveRequest & {
    comments: LeaveComment[];
  };
  comments: Array<{
    id: number;
    comment: string;
    authorRole: string;
    authorName: string;
    createdAt: string;
  }>;
};

export function EditLeaveForm({ leave, comments }: EditLeaveFormProps) {
  const router = useRouter();
  const [type, setType] = useState<string>(leave.type);
  const [dateRange, setDateRange] = useState<{
    start: Date | undefined;
    end: Date | undefined;
  }>({
    start: new Date(leave.startDate),
    end: new Date(leave.endDate),
  });
  const [reason, setReason] = useState(leave.reason);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showStickyButton, setShowStickyButton] = useState(false);
  const [fileError, setFileError] = useState<string | undefined>();

  // Fetch holidays for date picker
  const fetcher = (url: string) => fetch(url).then((res) => res.json());
  const { data: holidaysData } = useSWR<{ items: Array<{ date: string; name: string }> }>("/api/holidays", fetcher);
  const holidays = holidaysData?.items?.map((h) => ({ 
    date: h.date.split('T')[0], // Convert ISO to YYYY-MM-DD format
    name: h.name 
  })) || [];

  // Get return comment (most recent non-employee comment)
  const returnComment = comments.find((c) => c.authorRole !== "EMPLOYEE") || comments[0];

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyButton(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!dateRange.start || !dateRange.end) {
      toast.error("Please select start and end dates");
      return;
    }

    if (reason.trim().length < 10) {
      toast.error("Reason must be at least 10 characters");
      return;
    }

    // Check if any changes were made
    const startChanged = dateRange.start.toISOString().split("T")[0] !== new Date(leave.startDate).toISOString().split("T")[0];
    const endChanged = dateRange.end.toISOString().split("T")[0] !== new Date(leave.endDate).toISOString().split("T")[0];
    const reasonChanged = reason.trim() !== leave.reason.trim();
    const fileChanged = file !== null;
    const hasChanges = startChanged || endChanged || reasonChanged || fileChanged;

    if (!hasChanges) {
      toast.error("Please make at least one change before resubmitting");
      return;
    }

    // Validate certificate requirement for medical leave > 3 days
    const requestedDays = dateRange.start && dateRange.end 
      ? Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 0;
    const requiresCertificate = type === "MEDICAL" && requestedDays > 3;
    
    if (requiresCertificate && !file && !leave.certificateUrl) {
      toast.error("Medical certificate is required for leaves longer than 3 days");
      return;
    }

    try {
      setSubmitting(true);

      // Prepare form data
      const formData = new FormData();
      formData.append("type", type);
      formData.append("startDate", dateRange.start.toISOString());
      formData.append("endDate", dateRange.end.toISOString());
      formData.append("reason", reason.trim());
      const requiresCertificate = type === "MEDICAL" && 
        (dateRange.start && dateRange.end && 
         Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1 > 3);
      
      formData.append("needsCertificate", String(requiresCertificate || false));

      // Handle file upload: new file takes precedence, otherwise keep existing URL
      if (file) {
        formData.append("certificate", file);
      } else if (leave.certificateUrl && requiresCertificate) {
        // Keep existing certificate URL if no new file is uploaded
        formData.append("certificateUrl", leave.certificateUrl);
      }

      // Call resubmit endpoint
      const res = await fetch(`/api/leaves/${leave.id}/resubmit`, {
        method: "POST",
        body: formData,
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMessage = getToastMessage(
          payload?.error || "Failed to resubmit request",
          payload?.message
        );
        toast.error(errorMessage);
        return;
      }

      toast.success(SUCCESS_MESSAGES.leave_resubmitted);
      router.push("/dashboard");
    } catch (err) {
      toast.error(getToastMessage("network_error", "Unable to resubmit request"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Breadcrumb */}
      <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/leaves">My Leaves</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit & Resubmit</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>

      {/* Return Comment Alert */}
      {returnComment && (
        <Card className="rounded-2xl border-data-warning bg-data-warning/30 dark:bg-data-warning/10 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-data-warning dark:text-data-warning">
              <AlertCircle className="h-5 w-5 text-data-warning" />
              Return Reason
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm font-medium text-data-warning dark:text-data-warning">
                Returned by {returnComment.authorName} ({returnComment.authorRole})
              </p>
              <p className="text-sm text-data-warning dark:text-data-warning">{returnComment.comment}</p>
              <p className="text-xs text-data-warning dark:text-data-warning">
                {formatDate(returnComment.createdAt)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Main Form */}
        <Card className="rounded-2xl border-muted/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Edit & Resubmit Leave Request
            </CardTitle>
            <CardDescription>
              Please fix the issues mentioned above and resubmit your leave request.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Leave Type - Read Only */}
              <div className="space-y-2">
                <Label>Leave Type</Label>
                <div className="p-3 rounded-lg bg-muted/50 border border-muted">
                  <p className="text-sm font-medium">{leaveTypeLabel[leave.type as keyof typeof leaveTypeLabel] || leave.type}</p>
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label>Date Range</Label>
                <DateRangePicker
                  value={dateRange}
                  onChange={(range) => setDateRange(range)}
                  holidays={holidays}
                  minDate={new Date()}
                />
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason">
                  Reason <span className="text-data-error">*</span>
                </Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please provide a reason for your leave request..."
                  className="min-h-[120px]"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {reason.length}/10 minimum characters
                </p>
              </div>

              {/* File Upload - Show if medical and needs certificate */}
              {leave.type === "MEDICAL" && (
                <div className="space-y-2">
                  <Label>Medical Certificate</Label>
                  {leave.certificateUrl && !file && (
                    <div className="p-3 rounded-lg bg-muted/50 border border-muted mb-2">
                      <p className="text-sm text-muted-foreground mb-2">Current certificate:</p>
                      <a
                        href={leave.certificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-data-info hover:underline"
                      >
                        View current certificate
                      </a>
                    </div>
                  )}
                  <FileUploadSection
                    value={file}
                    onChange={setFile}
                    onError={setFileError}
                    error={fileError}
                    required={type === "MEDICAL" && 
                      (dateRange.start && dateRange.end && 
                       Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1 > 3)}
                  />
                  {fileError && (
                    <p className="text-sm text-destructive">{fileError}</p>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || reason.trim().length < 10}>
                {submitting ? "Resubmitting..." : "Resubmit Request"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Sidebar - Summary */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:h-fit">
          <Card className="rounded-2xl border-muted/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Leave Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium">{leaveTypeLabel[leave.type as keyof typeof leaveTypeLabel] || leave.type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium">
                  {dateRange.start && dateRange.end
                    ? `${formatDate(dateRange.start.toISOString())} → ${formatDate(dateRange.end.toISOString())}`
                    : "Select dates"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Working Days</p>
                <p className="font-medium">{leave.workingDays} days</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-muted/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Comments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="p-3 rounded-lg bg-muted/50 border border-muted">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium">{comment.authorName}</p>
                      <p className="text-xs text-muted-foreground">{comment.authorRole}</p>
                    </div>
                    <p className="text-sm">{comment.comment}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(comment.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sticky Button */}
      {showStickyButton && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={handleSubmit}
            disabled={submitting || reason.trim().length < 10}
            size="lg"
            className="shadow-lg"
          >
            {submitting ? "Resubmitting..." : "Resubmit Request"}
          </Button>
        </div>
      )}

      {/* Footer */}
      <div className="pt-6 border-t border-muted/60 text-center text-xs text-muted-foreground">
        <p>Policy v2.0 • © Central Depository Bangladesh Ltd.</p>
      </div>
    </div>
  );
}

