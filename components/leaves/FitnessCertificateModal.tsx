"use client";

import { useState } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface FitnessCertificateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveId: number;
  onUploadSuccess: () => void;
}

export function FitnessCertificateModal({
  open,
  onOpenChange,
  leaveId,
  onUploadSuccess,
}: FitnessCertificateModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);

  const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
  const maxSize = 5 * 1024 * 1024; // 5MB

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      setError("Only PDF, JPG, and PNG files are allowed");
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      setError("File size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("certificate", selectedFile);
      formData.append("type", "fitness");

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(`/api/leaves/${leaveId}/certificate`, {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Upload failed");
      }

      const data = await response.json();

      setUploadComplete(true);
      toast.success("Fitness certificate uploaded successfully");

      // Wait a moment before closing to show success state
      setTimeout(() => {
        onUploadSuccess();
        onOpenChange(false);
        resetModal();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload certificate");
      setUploadProgress(0);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const resetModal = () => {
    setSelectedFile(null);
    setUploading(false);
    setUploadProgress(0);
    setError(null);
    setUploadComplete(false);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!uploading) {
        onOpenChange(open);
        if (!open) resetModal();
      }
    }}>
      <DialogContent className="sm:max-w-md" showCloseButton={!uploading && !uploadComplete}>
        <DialogHeader>
          <DialogTitle>
            {uploadComplete ? "Certificate Uploaded" : "Upload Fitness Certificate"}
          </DialogTitle>
          <DialogDescription>
            {uploadComplete
              ? "Your fitness certificate has been submitted for review."
              : "Medical leave exceeding 7 days requires a fitness certificate to return to work. Please upload your certificate below."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {uploadComplete ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3 mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-500" />
              </div>
              <p className="text-sm text-muted-foreground">
                Your certificate is now being reviewed by HR Admin.
              </p>
            </div>
          ) : (
            <>
              {!selectedFile ? (
                <div className="space-y-4">
                  <label
                    htmlFor="certificate-upload"
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-muted-foreground/50 transition-colors bg-muted/30"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                      <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                      <p className="mb-2 text-sm text-foreground font-medium">
                        Click to upload fitness certificate
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF, JPG, or PNG (max 5MB)
                      </p>
                    </div>
                    <input
                      id="certificate-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileSelect}
                      disabled={uploading}
                    />
                  </label>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This certificate is required before you can return to duty. It will be reviewed by HR Admin, HR Head, and CEO.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    {!uploading && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveFile}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {uploading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Uploading...</span>
                        <span className="font-medium">{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>

        {!uploadComplete && (
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
            >
              {uploading ? "Uploading..." : "Upload Certificate"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
