"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, File, CheckCircle, AlertCircle, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

/**
 * Document Type
 */
export type DocumentType = "certificate" | "fitness" | "attachment" | "other";

/**
 * Upload Status
 */
export type UploadStatus = "idle" | "uploading" | "success" | "error";

/**
 * Uploaded File Info
 */
export interface UploadedFile {
  file: File;
  url?: string;
  preview?: string;
  progress?: number;
  status?: UploadStatus;
  error?: string;
}

/**
 * DocumentUploader Props
 *
 * @interface DocumentUploaderProps
 * @property {DocumentType} type - Type of document
 * @property {(file: File) => Promise<void>} onUpload - Upload callback
 * @property {number} [maxSize] - Max file size in MB (default: 5)
 * @property {string[]} [allowedTypes] - Allowed file types (default: ['pdf','jpg','png'])
 * @property {boolean} [required] - Is upload required
 * @property {string} [label] - Label text
 * @property {number} [documentId] - Associated document/leave ID
 */
export interface DocumentUploaderProps {
  type: DocumentType;
  onUpload: (file: File) => Promise<void>;
  maxSize?: number;
  allowedTypes?: string[];
  required?: boolean;
  label?: string;
  documentId?: number;
  className?: string;
  multiple?: boolean;
  onRemove?: (file: File) => void;
}

const defaultAllowedTypes = ["pdf", "jpg", "jpeg", "png", "doc", "docx"];

const typeLabels: Record<DocumentType, string> = {
  certificate: "Medical Certificate",
  fitness: "Fitness Certificate",
  attachment: "Attachment",
  other: "Document",
};

/**
 * DocumentUploader Component
 *
 * Unified file upload component with drag-and-drop support.
 * Features validation, progress tracking, and preview capabilities.
 *
 * @example
 * ```tsx
 * <DocumentUploader
 *   type="certificate"
 *   label="Upload Medical Certificate"
 *   onUpload={async (file) => {
 *     await uploadToServer(file);
 *   }}
 *   maxSize={5}
 *   allowedTypes={['pdf', 'jpg', 'png']}
 *   required
 *   documentId={leaveId}
 * />
 * ```
 */
export function DocumentUploader({
  type,
  onUpload,
  maxSize = 5,
  allowedTypes = defaultAllowedTypes,
  required = false,
  label,
  documentId,
  className,
  multiple = false,
  onRemove,
}: DocumentUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayLabel = label || typeLabels[type];

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file size
    const fileSizeMB = file.size / 1024 / 1024;
    if (fileSizeMB > maxSize) {
      return {
        valid: false,
        error: `File size exceeds ${maxSize}MB limit`,
      };
    }

    // Check file type
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    if (!fileExtension || !allowedTypes.includes(fileExtension)) {
      return {
        valid: false,
        error: `File type .${fileExtension} not allowed. Allowed types: ${allowedTypes.join(", ")}`,
      };
    }

    return { valid: true };
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const newFiles: UploadedFile[] = [];
    const filesToProcess = Array.from(fileList);

    for (const file of filesToProcess) {
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error || "Invalid file");
        continue;
      }

      // Create preview for images
      let preview: string | undefined;
      if (file.type.startsWith("image/")) {
        preview = URL.createObjectURL(file);
      }

      newFiles.push({
        file,
        preview,
        progress: 0,
        status: "idle",
      });
    }

    if (multiple) {
      setFiles((prev) => [...prev, ...newFiles]);
    } else {
      setFiles(newFiles);
    }

    // Upload files
    for (const uploadedFile of newFiles) {
      await uploadFile(uploadedFile);
    }
  };

  const uploadFile = async (uploadedFile: UploadedFile) => {
    setUploadStatus("uploading");
    setError(null);

    try {
      // Update progress
      setFiles((prev) =>
        prev.map((f) =>
          f.file === uploadedFile.file
            ? { ...f, status: "uploading" as UploadStatus, progress: 0 }
            : f
        )
      );

      // Simulate progress
      for (let i = 0; i <= 90; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        setFiles((prev) =>
          prev.map((f) =>
            f.file === uploadedFile.file ? { ...f, progress: i } : f
          )
        );
      }

      // Call upload handler
      await onUpload(uploadedFile.file);

      // Success
      setFiles((prev) =>
        prev.map((f) =>
          f.file === uploadedFile.file
            ? { ...f, status: "success" as UploadStatus, progress: 100 }
            : f
        )
      );
      setUploadStatus("success");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setFiles((prev) =>
        prev.map((f) =>
          f.file === uploadedFile.file
            ? { ...f, status: "error" as UploadStatus, error: errorMessage }
            : f
        )
      );
      setUploadStatus("error");
      setError(errorMessage);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleRemove = (fileToRemove: UploadedFile) => {
    setFiles((prev) => prev.filter((f) => f.file !== fileToRemove.file));
    if (fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    if (onRemove) {
      onRemove(fileToRemove.file);
    }
    setError(null);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {displayLabel}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Max {maxSize}MB • {allowedTypes.map((t) => `.${t}`).join(", ")}
        </span>
      </div>

      {/* Upload Area */}
      <Card
        className={cn(
          "relative border-2 border-dashed transition-all duration-200",
          isDragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
            : "border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-900",
          uploadStatus === "error" && "border-red-500 bg-red-50 dark:bg-red-950/20",
          uploadStatus === "success" && "border-green-500 bg-green-50 dark:bg-green-950/20"
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="p-6">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileInput}
            accept={allowedTypes.map((t) => `.${t}`).join(",")}
            multiple={multiple}
          />

          {files.length === 0 ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
                <Upload className="h-8 w-8 text-gray-600 dark:text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                Drag and drop your file here
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                or click to browse
              </p>
              <Button onClick={handleClick} variant="outline" size="sm">
                Select File
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {files.map((uploadedFile, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={cn(
                      "p-3 rounded-lg border",
                      uploadedFile.status === "error"
                        ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20"
                        : uploadedFile.status === "success"
                        ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20"
                        : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* File Icon/Preview */}
                      <div className="flex-shrink-0">
                        {uploadedFile.preview ? (
                          <img
                            src={uploadedFile.preview}
                            alt="Preview"
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <FileText className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {uploadedFile.file.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {(uploadedFile.file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          {uploadedFile.status === "uploading" ? (
                            <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin flex-shrink-0" />
                          ) : uploadedFile.status === "success" ? (
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                          ) : uploadedFile.status === "error" ? (
                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                          ) : null}
                          <button
                            onClick={() => handleRemove(uploadedFile)}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                            aria-label="Remove file"
                          >
                            <X className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </button>
                        </div>

                        {/* Progress Bar */}
                        {uploadedFile.status === "uploading" && (
                          <Progress
                            value={uploadedFile.progress || 0}
                            className="h-1 mt-2"
                          />
                        )}

                        {/* Error Message */}
                        {uploadedFile.error && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            {uploadedFile.error}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Add More Button */}
              {multiple && (
                <Button
                  onClick={handleClick}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Add More Files
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
        >
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </motion.div>
      )}
    </div>
  );
}
