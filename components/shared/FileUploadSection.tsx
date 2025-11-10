"use client";

import { useState } from "react";
import { FileText, X, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import FileUpload from "@/components/kokonutui/file-upload";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

interface FileUploadSectionProps {
  value: File | null;
  onChange: (file: File | null) => void;
  onError: (error: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export function FileUploadSection({
  value,
  onChange,
  onError,
  error,
  required = false,
  disabled = false,
}: FileUploadSectionProps) {
  const [internalError, setInternalError] = useState<string>("");

  const validateFile = (file: File) => {
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return {
        message: "Unsupported file type. Use PDF, JPG, or PNG.",
        code: "INVALID_FILE_TYPE",
      };
    }
    if (file.size > MAX_FILE_SIZE) {
      return {
        message: "File too large (max 5 MB).",
        code: "FILE_TOO_LARGE",
      };
    }
    return null;
  };

  const handleUploadSuccess = (file: File) => {
    setInternalError("");
    onChange(file);
  };

  const handleUploadError = (fileError: { message: string; code: string }) => {
    setInternalError(fileError.message);
    onError(fileError.message);
  };

  const handleFileRemove = () => {
    onChange(null);
    setInternalError("");
  };

  const displayError = error || internalError;

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-text-secondary">
        {required ? (
          <>
            Medical Certificate <span className="text-data-error">*</span>
          </>
        ) : (
          "Supporting Document"
        )}
        <span className="text-xs font-normal text-muted-foreground ml-1">
          (PDF, JPG, PNG, max 5MB)
        </span>
      </Label>

      {!value ? (
        <div className={cn(disabled && "opacity-50 pointer-events-none")}>
          <FileUpload
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
            acceptedFileTypes={ACCEPTED_FILE_TYPES}
            maxFileSize={MAX_FILE_SIZE}
            uploadDelay={0} // No upload simulation, just file selection
            validateFile={validateFile}
            className="w-full max-w-none"
          />
        </div>
      ) : (
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl border p-4",
            "border-border-strong dark:border-border-strong",
            "bg-bg-secondary dark:bg-bg-secondary/50",
            "backdrop-blur-sm"
          )}
        >
          <div className="rounded-lg bg-data-info/10 p-2 border border-data-info/20">
            <FileText className="h-5 w-5 text-data-info" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-secondary truncate">
              {value.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {(value.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleFileRemove}
            disabled={disabled}
            className="h-8 w-8 p-0"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {displayError && (
        <p
          className="text-sm text-data-error flex items-center gap-1"
          role="alert"
        >
          <AlertCircle className="h-3 w-3" aria-hidden="true" />
          {displayError}
        </p>
      )}
    </div>
  );
}
