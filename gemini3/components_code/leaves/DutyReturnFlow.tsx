"use client";

import { useState } from "react";
import { CheckCircle2, Clock, FileText, User, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ApprovalRecord {
  id: number;
  step: number;
  decision: string;
  comment?: string;
  decidedAt?: string;
  approver: {
    name: string | null;
    role: string;
  };
}

interface DutyReturnFlowProps {
  leaveId: number;
  certificateUrl: string | null;
  approvals: ApprovalRecord[];
  currentUserRole: string;
  currentUserId: number;
  onStatusChange: () => void;
}

const APPROVAL_CHAIN_ROLES = ["HR_ADMIN", "HR_HEAD", "CEO"];

export function DutyReturnFlow({
  leaveId,
  certificateUrl,
  approvals,
  currentUserRole,
  currentUserId,
  onStatusChange,
}: DutyReturnFlowProps) {
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);

  // Filter approvals for certificate review (action: CERTIFICATE_REVIEW)
  const certificateApprovals = approvals.filter(
    (a) => a.comment?.includes("CERTIFICATE_REVIEW") || a.step >= 10
  );

  // Determine current step in approval chain
  const getNextApproverRole = () => {
    const completedSteps = certificateApprovals.filter((a) => a.decision === "APPROVED").length;
    return APPROVAL_CHAIN_ROLES[completedSteps] || null;
  };

  const nextApproverRole = getNextApproverRole();
  const canApprove = APPROVAL_CHAIN_ROLES.includes(currentUserRole) && nextApproverRole === currentUserRole;
  const allApproved = certificateApprovals.filter((a) => a.decision === "APPROVED").length === APPROVAL_CHAIN_ROLES.length;

  const handleReviewAction = (action: "approve" | "reject") => {
    setReviewAction(action);
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewAction) return;

    setIsSubmitting(true);

    try {
      const endpoint = reviewAction === "approve"
        ? `/api/leaves/${leaveId}/fitness-certificate/approve`
        : `/api/leaves/${leaveId}/fitness-certificate/reject`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Review failed");
      }

      toast.success(
        reviewAction === "approve"
          ? "Fitness certificate approved"
          : "Fitness certificate rejected"
      );

      setReviewDialogOpen(false);
      setComment("");
      setReviewAction(null);
      onStatusChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Certificate Preview */}
      {certificateUrl && (
        <Card className="rounded-2xl border-muted shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Fitness Certificate
            </CardTitle>
            <CardDescription>
              Submitted for approval chain review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Fitness Certificate</p>
                  <p className="text-xs text-muted-foreground">View uploaded document</p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <a href={certificateUrl} target="_blank" rel="noopener noreferrer">
                  View Certificate
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval Chain Status */}
      <Card className="rounded-2xl border-muted shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Approval Chain Status
          </CardTitle>
          <CardDescription>
            Fitness certificate must be approved by HR Admin, HR Head, and CEO
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {APPROVAL_CHAIN_ROLES.map((role, index) => {
              const approval = certificateApprovals.find(
                (a) => a.approver.role === role && a.decision === "APPROVED"
              );
              const isPending = nextApproverRole === role;
              const isComplete = approval !== undefined;
              const isFuture = APPROVAL_CHAIN_ROLES.indexOf(role) > APPROVAL_CHAIN_ROLES.indexOf(nextApproverRole || "");

              return (
                <div key={role} className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isComplete
                          ? "bg-green-100 dark:bg-green-900/20"
                          : isPending
                          ? "bg-blue-100 dark:bg-blue-900/20"
                          : "bg-muted"
                      }`}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
                      ) : isPending ? (
                        <Clock className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                      ) : (
                        <User className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    {index < APPROVAL_CHAIN_ROLES.length - 1 && (
                      <div className="w-0.5 h-8 bg-muted ml-5 mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pt-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{role.replace("_", " ")}</p>
                      <Badge variant={isComplete ? "default" : isPending ? "secondary" : "outline"}>
                        {isComplete ? "Approved" : isPending ? "Pending" : "Awaiting"}
                      </Badge>
                    </div>
                    {approval && (
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Approved by {approval.approver.name}</p>
                        {approval.decidedAt && (
                          <p>{new Date(approval.decidedAt).toLocaleString()}</p>
                        )}
                        {approval.comment && <p className="italic">"{approval.comment}"</p>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Review Actions */}
      {canApprove && certificateUrl && !allApproved && (
        <Card className="rounded-2xl border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 shadow-sm">
          <CardHeader>
            <CardTitle>Review Required</CardTitle>
            <CardDescription>
              As {currentUserRole.replace("_", " ")}, you need to review this fitness certificate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please review the uploaded fitness certificate before making a decision.
              </AlertDescription>
            </Alert>
            <div className="flex gap-3">
              <Button
                onClick={() => handleReviewAction("reject")}
                variant="destructive"
                className="flex-1"
              >
                Reject Certificate
              </Button>
              <Button
                onClick={() => handleReviewAction("approve")}
                className="flex-1"
              >
                Approve Certificate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Approved Message */}
      {allApproved && (
        <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
          <AlertDescription className="text-green-900 dark:text-green-100">
            Fitness certificate has been approved by all approvers. Employee can now return to duty.
          </AlertDescription>
        </Alert>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" ? "Approve" : "Reject"} Fitness Certificate
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "approve"
                ? "Confirm that the fitness certificate is valid and the employee can return to duty."
                : "Provide a reason for rejecting the fitness certificate. The employee will need to resubmit."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="comment">
                Comment {reviewAction === "reject" && <span className="text-destructive">*</span>}
              </Label>
              <Textarea
                id="comment"
                placeholder={
                  reviewAction === "approve"
                    ? "Optional comment..."
                    : "Explain why the certificate is being rejected..."
                }
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReviewDialogOpen(false);
                setComment("");
                setReviewAction(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={isSubmitting || (reviewAction === "reject" && !comment.trim())}
              variant={reviewAction === "reject" ? "destructive" : "default"}
            >
              {isSubmitting
                ? "Submitting..."
                : reviewAction === "approve"
                ? "Approve"
                : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
