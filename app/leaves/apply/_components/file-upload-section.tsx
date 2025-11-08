"use client";

import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_REGEX = /(\.pdf|\.png|\.jpe?g)$/i;

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
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_FILE_REGEX.test(file.name)) {
      return "Unsupported file type. Use PDF, JPG, or PNG.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File too large (max 5 MB).";
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      onError(validationError);
      return;
    }
    onChange(file);
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
        <span className="text-xs font-normal text-muted-foreground ml-1">(PDF, JPG, PNG, max 5MB)</span>
      </Label>

      {!value ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative rounded-xl border-2 border-dashed p-6 text-center transition-colors",
            isDragging
              ? "border-card-action bg-card-action dark:bg-card-action/20"
              : "border-border-strong dark:border-border-strong",
            error && "border-data-error dark:border-data-error",
            disabled && "opacity-50 cursor-not-allowed",
            "backdrop-blur-sm bg-bg-primary/50 dark:bg-bg-secondary/50"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/*"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled}
          />
          <div className="flex flex-col items-center gap-2">
            <div
              className={cn(
                "rounded-full p-3",
                isDragging ? "bg-card-action dark:bg-card-action/30" : "bg-bg-secondary dark:bg-bg-secondary"
              )}
            >
              <Upload className={cn("h-5 w-5", isDragging ? "text-card-action" : "text-text-secondary")} />
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary dark:text-text-secondary">
                {isDragging ? "Drop file here" : "Drag & drop a file"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="mt-2"
            >
              <Upload className="mr-2 h-4 w-4" />
              Browse Files
            </Button>
          </div>
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
          <div className="rounded-lg bg-data-info p-2 dark:bg-data-info/30">
            <FileText className="h-5 w-5 text-data-info dark:text-data-info" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-secondary dark:text-text-secondary truncate">{value.name}</p>
            <p className="text-xs text-muted-foreground">
              {(value.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={disabled}
            className="h-8 w-8 p-0"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {error && (
        <p className="text-sm text-data-error flex items-center gap-1" role="alert">
          <AlertCircle className="h-3 w-3" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
