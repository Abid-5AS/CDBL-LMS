/**
 * Fitness Certificate Upload Component
 *
 * For Medical Leave >7 days, employees must upload a fitness certificate
 * before returning to duty. This component handles:
 * - Certificate upload
 * - Approval status display
 * - Approval chain visualization
 */

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle2, AlertCircle, Clock, FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface FitnessCertificateUploadProps {
  leaveId: number;
  workingDays: number;
  endDate: Date;
  fitnessCertificateUrl?: string | null;
  approvalStatus?: {
    hrAdminApproved: boolean;
    hrHeadApproved: boolean;
    ceoApproved: boolean;
  };
}

export function FitnessCertificateUpload({
  leaveId,
  workingDays,
  endDate,
  fitnessCertificateUrl,
  approvalStatus,
}: FitnessCertificateUploadProps) {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  const today = new Date();
  const leaveEnded = today > new Date(endDate);
  const requiresCertificate = workingDays > 7;

  if (!requiresCertificate) {
    return null;
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        setError("Please upload a PDF or image file (JPG, PNG)");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }

      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file to upload");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("fitnessCertificate", selectedFile);

      const response = await fetch(`/api/leaves/${leaveId}/certificate`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to upload certificate");
      }

      setSuccess(true);

      // Clear any existing timeout to prevent conflicts
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const newTimeoutId = setTimeout(() => {
        router.refresh();
      }, 1500);

      setTimeoutId(newTimeoutId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setUploading(false);
    }
  };

  // Calculate approval progress
  const approvalSteps = [
    { role: "HR Admin", approved: approvalStatus?.hrAdminApproved || false },
    { role: "HR Head", approved: approvalStatus?.hrHeadApproved || false },
    { role: "CEO", approved: approvalStatus?.ceoApproved || false },
  ];

  const approvedSteps = approvalSteps.filter((s) => s.approved).length;
  const approvalProgress = (approvedSteps / approvalSteps.length) * 100;
  const fullyApproved = approvedSteps === approvalSteps.length;

  return (
    <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-orange-600" />
          Fitness Certificate Required
        </CardTitle>
        <CardDescription>
          Your medical leave exceeded 7 days. You must upload a fitness certificate
          before returning to duty (Policy 6.14).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!leaveEnded && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertTitle>Leave Ongoing</AlertTitle>
            <AlertDescription>
              You can upload your fitness certificate now or after your leave ends.
            </AlertDescription>
          </Alert>
        )}

        {!fitnessCertificateUrl ? (
          // Upload section
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="certificate-upload">Upload Fitness Certificate</Label>
              <div className="flex gap-2">
                <Input
                  id="certificate-upload"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                >
                  {uploading ? (
                    "Uploading..."
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Accepted formats: PDF, JPG, PNG (Max 5MB)
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Certificate uploaded successfully! It will now go through the approval chain.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          // Approval status section
          <div className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-900">Certificate Uploaded</AlertTitle>
              <AlertDescription className="text-blue-800">
                Your fitness certificate is under review.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Approval Progress</span>
                <span className="text-muted-foreground">
                  {approvedSteps} of {approvalSteps.length} approvals
                </span>
              </div>
              <Progress value={approvalProgress} className="h-2" />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Approval Chain:</p>
              <div className="space-y-1">
                {approvalSteps.map((step, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 rounded-md bg-white dark:bg-card">
                    <span className="text-sm">{step.role}</span>
                    {step.approved ? (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Approved
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {fullyApproved && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-900">Fully Approved!</AlertTitle>
                <AlertDescription className="text-green-800">
                  Your fitness certificate has been approved by all reviewers.
                  You are cleared to return to duty.
                </AlertDescription>
              </Alert>
            )}

            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(fitnessCertificateUrl, "_blank")}
              >
                <FileText className="mr-2 h-4 w-4" />
                View Uploaded Certificate
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
