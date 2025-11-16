"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AlertCircle, RotateCcw, Edit, Calendar, FileText, User, Clock, Upload, Bell } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { leaveTypeLabel } from "@/lib/ui";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LeaveRequest, LeaveComment, Approval } from "@prisma/client";
import { FitnessCertificateModal } from "@/components/leaves/FitnessCertificateModal";
import { DutyReturnFlow } from "@/components/leaves/DutyReturnFlow";
import { ConversionDisplay, type ConversionDetails } from "@/components/leaves/ConversionDisplay";

type LeaveDetailsContentProps = {
  leave: LeaveRequest & {
    requester: {
      id: number;
      name: string;
      email: string;
    };
    comments: LeaveComment[];
    approvals: Array<Approval & {
      approver: {
        name: string | null;
        role: string;
      };
    }>;
  };
  comments: Array<{
    id: number;
    comment: string;
    authorRole: string;
    authorName: string;
    createdAt: string;
  }>;
  currentUserId: number;
  currentUserRole?: string;
  conversionDetails?: ConversionDetails | null;
};

export function LeaveDetailsContent({ leave, comments, currentUserId, currentUserRole, conversionDetails }: LeaveDetailsContentProps) {
  const isRequester = leave.requesterId === currentUserId;
  const isReturned = leave.status === "RETURNED";
  const isPending = leave.status === "PENDING" || leave.status === "SUBMITTED";

  // Fitness certificate modal state
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Nudge state
  const [isNudging, setIsNudging] = useState(false);
  const [nudgeMessage, setNudgeMessage] = useState<string | null>(null);

  // Determine if fitness certificate is required and should be shown
  const requiresFitnessCertificate =
    leave.type === "MEDICAL" &&
    leave.workingDays > 7 &&
    ["APPROVED", "RECALLED"].includes(leave.status);

  const leaveHasEnded = new Date() >= new Date(leave.endDate);
  const showFitnessCertificatePrompt =
    requiresFitnessCertificate &&
    leaveHasEnded &&
    !leave.fitnessCertificateUrl &&
    isRequester;

  // Auto-show modal if conditions are met
  useEffect(() => {
    if (showFitnessCertificatePrompt) {
      setShowCertificateModal(true);
    }
  }, [showFitnessCertificatePrompt]);

  const handleCertificateUploadSuccess = () => {
    // Trigger refresh of page data
    setRefreshKey((prev) => prev + 1);
    window.location.reload(); // Simple refresh for now
  };

  const handleNudge = async () => {
    try {
      setIsNudging(true);
      setNudgeMessage(null);

      const response = await fetch(`/api/leaves/${leave.id}/nudge`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setNudgeMessage(data.error || "Failed to send nudge");
        return;
      }

      setNudgeMessage(data.message || "Reminder sent successfully");
    } catch (error) {
      setNudgeMessage("Failed to send nudge");
    } finally {
      setIsNudging(false);
    }
  };

  // Get the most recent return comment (non-employee comment)
  const returnComment = comments
    .filter((c) => c.authorRole !== "EMPLOYEE")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Breadcrumbs */}
        <BreadcrumbList className="mb-6">
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/leaves">My Leaves</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Leave Details</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>

        {/* Returned Banner */}
        {isReturned && returnComment && (
          <Card className="mb-6 rounded-2xl border-data-warning bg-data-warning/30 dark:bg-data-warning/10 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="rounded-full bg-data-warning dark:bg-data-warning/30 p-3">
                    <RotateCcw className="h-6 w-6 text-data-warning dark:text-data-warning" />
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-data-warning dark:text-data-warning">
                      Request Returned for Modification
                    </h3>
                    {isRequester && (
                      <Button asChild size="sm" variant="default">
                        <Link href={`/leaves/${leave.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit & Resubmit
                        </Link>
                      </Button>
                    )}
                  </div>
                  <div className="rounded-lg bg-bg-primary dark:bg-card border border-data-warning dark:border-data-warning p-4">
                    <p className="text-sm font-medium text-data-warning dark:text-data-warning mb-2">
                      Returned by {returnComment.authorName} ({returnComment.authorRole})
                    </p>
                    <p className="text-sm text-data-warning dark:text-data-warning mb-2">
                      {returnComment.comment}
                    </p>
                    <p className="text-xs text-data-warning dark:text-data-warning">
                      On {formatDate(returnComment.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          {/* Left Column: Leave Details */}
          <div className="space-y-6">
            {/* Conversion Display */}
            {conversionDetails && (
              <ConversionDisplay
                leave={{
                  id: leave.id,
                  type: leave.type,
                  workingDays: leave.workingDays,
                  conversionDetails,
                }}
                showPolicy
              />
            )}

            {/* Basic Information */}
            <Card className="rounded-2xl border-muted shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Leave Request Details</span>
                  <StatusBadge status={leave.status} />
                </CardTitle>
                <CardDescription>Request #{leave.id}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Leave Type</p>
                    <Badge variant="outline" className="text-base">
                      {leaveTypeLabel[leave.type] ?? leave.type}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Duration</p>
                    <p className="text-base font-medium">{leave.workingDays} working days</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Start Date</p>
                    <p className="text-base font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(leave.startDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">End Date</p>
                    <p className="text-base font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(leave.endDate)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Reason</p>
                  <p className="text-sm whitespace-pre-wrap bg-muted/50 rounded-lg p-3">
                    {leave.reason}
                  </p>
                </div>

                {leave.certificateUrl && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Medical Certificate</p>
                    <Button asChild variant="outline" size="sm">
                      <a href={leave.certificateUrl} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4 mr-2" />
                        View Certificate
                      </a>
                    </Button>
                  </div>
                )}

                {/* Fitness Certificate Status */}
                {requiresFitnessCertificate && (
                  <div className="pt-4 border-t border-muted">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-muted-foreground">Fitness Certificate</p>
                      {leave.fitnessCertificateUrl ? (
                        <Badge variant="default" className="bg-green-600">
                          Certificate Uploaded
                        </Badge>
                      ) : leaveHasEnded ? (
                        <Badge variant="destructive">Certificate Required</Badge>
                      ) : (
                        <Badge variant="secondary">Will be required after leave ends</Badge>
                      )}
                    </div>
                    {leave.fitnessCertificateUrl ? (
                      <Button asChild variant="outline" size="sm">
                        <a href={leave.fitnessCertificateUrl} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-4 w-4 mr-2" />
                          View Fitness Certificate
                        </a>
                      </Button>
                    ) : isRequester && leaveHasEnded ? (
                      <Button
                        onClick={() => setShowCertificateModal(true)}
                        size="sm"
                        className="w-full mt-2"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Fitness Certificate
                      </Button>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">
                        Required for medical leave exceeding 7 days before returning to duty
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Employee</p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{leave.requester.name}</span>
                    <span className="text-xs text-muted-foreground">({leave.requester.email})</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Approval Timeline */}
            {leave.approvals.length > 0 && (
              <Card className="rounded-2xl border-muted shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Approval Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {leave.approvals.map((approval, index) => (
                      <div key={approval.id} className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            approval.decision === "APPROVED" ? "bg-data-success" :
                            approval.decision === "REJECTED" ? "bg-data-error" :
                            approval.decision === "FORWARDED" ? "bg-data-info" :
                            "bg-bg-secondary"
                          }`} />
                          {index < leave.approvals.length - 1 && (
                            <div className="w-0.5 h-8 bg-muted ml-1" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            Step {approval.step}: {approval.approver?.name || "Unknown"} ({approval.approver?.role})
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {approval.decision === "APPROVED" && "✓ Approved"}
                            {approval.decision === "REJECTED" && "✗ Rejected"}
                            {approval.decision === "FORWARDED" && `→ Forwarded to ${approval.toRole || "Next Approver"}`}
                            {approval.decision === "PENDING" && "⏳ Pending"}
                          </p>
                          {approval.comment && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              "{approval.comment}"
                            </p>
                          )}
                          {approval.decidedAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(approval.decidedAt.toISOString())}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comments Section */}
            {comments.length > 0 && (
              <Card className="rounded-2xl border-muted shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Comments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="border-l-2 border-muted pl-4 py-2">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium">
                            {comment.authorName} ({comment.authorRole})
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(comment.createdAt)}
                          </p>
                        </div>
                        <p className="text-sm text-foreground">{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fitness Certificate Approval Flow */}
            {requiresFitnessCertificate && leave.fitnessCertificateUrl && (
              <DutyReturnFlow
                leaveId={leave.id}
                certificateUrl={leave.fitnessCertificateUrl}
                approvals={leave.approvals.map((a) => ({
                  id: a.id,
                  step: a.step,
                  decision: a.decision,
                  comment: a.comment || undefined,
                  decidedAt: a.decidedAt?.toISOString(),
                  approver: a.approver,
                }))}
                currentUserRole={currentUserRole || "EMPLOYEE"}
                currentUserId={currentUserId}
                onStatusChange={handleCertificateUploadSuccess}
              />
            )}
          </div>

          {/* Right Column: Actions & Metadata */}
          <div className="space-y-6">
            {/* Actions Card */}
            {isRequester && (isReturned || isPending) && (
              <Card className="rounded-2xl border-muted shadow-sm sticky top-6">
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isReturned && (
                    <>
                      <Button asChild className="w-full" size="lg">
                        <Link href={`/leaves/${leave.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit & Resubmit
                        </Link>
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Make necessary changes and resubmit your request for approval.
                      </p>
                    </>
                  )}

                  {isPending && (
                    <>
                      <Button
                        onClick={handleNudge}
                        disabled={isNudging}
                        className="w-full"
                        size="lg"
                        variant="outline"
                      >
                        <Bell className="h-4 w-4 mr-2" />
                        {isNudging ? "Sending..." : "Nudge Approver"}
                      </Button>
                      {nudgeMessage && (
                        <p className={`text-xs ${nudgeMessage.includes("successfully") || nudgeMessage.includes("sent to") ? "text-green-600" : "text-destructive"}`}>
                          {nudgeMessage}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Send a reminder to the approver if your request has been pending for a while.
                        {" "}(Limited to once per 24 hours)
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Metadata Card */}
            <Card className="rounded-2xl border-muted shadow-sm">
              <CardHeader>
                <CardTitle>Request Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDate(leave.createdAt.toISOString())}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{formatDate(leave.updatedAt.toISOString())}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Policy Version</p>
                  <p className="font-medium">{leave.policyVersion}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Fitness Certificate Modal */}
      <FitnessCertificateModal
        open={showCertificateModal}
        onOpenChange={setShowCertificateModal}
        leaveId={leave.id}
        onUploadSuccess={handleCertificateUploadSuccess}
      />
    </div>
  );
}



