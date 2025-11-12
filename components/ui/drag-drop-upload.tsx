"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  FileVideo,
  Music,
  Archive,
  Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Progress } from "./progress";
import KokonutFileUpload from "@/components/kokonutui/file-upload";
import Image from "next/image";

export interface UploadedFile {
  file: File;
  id: string;
  progress: number;
  status: "uploading" | "success" | "error";
  error?: string;
  preview?: string;
}

interface DragDropUploadProps {
  onFilesChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
  helperText?: string;
  label?: string;
  required?: boolean;
  showPreview?: boolean;
  uploadProgress?: boolean;
  onUpload?: (file: File) => Promise<void>;
}

const fileTypeIcons = {
  image: ImageIcon,
  video: FileVideo,
  audio: Music,
  archive: Archive,
  document: FileText,
  default: File,
};

const getFileIcon = (file: File) => {
  const type = file.type.split("/")[0];
  if (type === "image") return fileTypeIcons.image;
  if (type === "video") return fileTypeIcons.video;
  if (type === "audio") return fileTypeIcons.audio;
  if (
    file.type.includes("zip") ||
    file.type.includes("rar") ||
    file.type.includes("tar")
  ) {
    return fileTypeIcons.archive;
  }
  if (
    file.type.includes("pdf") ||
    file.type.includes("document") ||
    file.type.includes("text")
  ) {
    return fileTypeIcons.document;
  }
  return fileTypeIcons.default;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const createFilePreview = (file: File): Promise<string | undefined> => {
  return new Promise((resolve) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(file);
    } else {
      resolve(undefined);
    }
  });
};

export function DragDropUpload({
  onFilesChange,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = [],
  multiple = true,
  disabled = false,
  className,
  error,
  helperText,
  label,
  required = false,
  showPreview = true,
  uploadProgress = false,
  onUpload,
}: DragDropUploadProps) {
  const [files, setFiles] = React.useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `File size must be less than ${formatFileSize(maxSize)}`;
    }

    if (
      acceptedTypes.length > 0 &&
      !acceptedTypes.some((type) => file.type.includes(type))
    ) {
      return `File type not supported. Accepted types: ${acceptedTypes.join(
        ", "
      )}`;
    }

    return null;
  };

  const processFiles = async (fileList: FileList) => {
    if (disabled) return;

    const newFiles: UploadedFile[] = [];
    const filesToProcess = Array.from(fileList).slice(
      0,
      maxFiles - files.length
    );

    for (const file of filesToProcess) {
      const error = validateFile(file);
      const preview = showPreview ? await createFilePreview(file) : undefined;

      const uploadedFile: UploadedFile = {
        file,
        id: Math.random().toString(36).substr(2, 9),
        progress: 0,
        status: error ? "error" : "uploading",
        error: error || undefined,
        preview,
      };

      newFiles.push(uploadedFile);
    }

    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);

    // Start upload process if onUpload is provided
    if (onUpload && !isUploading) {
      setIsUploading(true);

      for (const uploadedFile of newFiles) {
        if (uploadedFile.status === "uploading") {
          try {
            // Simulate progress if uploadProgress is enabled
            if (uploadProgress) {
              const progressInterval = setInterval(() => {
                setFiles((prev) =>
                  prev.map((f) =>
                    f.id === uploadedFile.id
                      ? { ...f, progress: Math.min(f.progress + 10, 90) }
                      : f
                  )
                );
              }, 200);

              await onUpload(uploadedFile.file);
              clearInterval(progressInterval);
            } else {
              await onUpload(uploadedFile.file);
            }

            // Mark as success
            setFiles((prev) =>
              prev.map((f) =>
                f.id === uploadedFile.id
                  ? { ...f, status: "success", progress: 100 }
                  : f
              )
            );
          } catch (error) {
            // Mark as error
            setFiles((prev) =>
              prev.map((f) =>
                f.id === uploadedFile.id
                  ? {
                      ...f,
                      status: "error",
                      error: "Upload failed",
                      progress: 0,
                    }
                  : f
              )
            );
          }
        }
      }

      setIsUploading(false);
    }
  };

  const removeFile = (id: string) => {
    const updatedFiles = files.filter((f) => f.id !== id);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      {/* Drop Zone */}
      {files.length === 0 && (
        <KokonutFileUpload
          onUploadSuccess={(file: File) => {
            const newFile: UploadedFile = {
              file,
              id: Math.random().toString(36).substr(2, 9),
              progress: 100,
              status: "success",
            };
            const updatedFiles = [...files, newFile];
            setFiles(updatedFiles);
            onFilesChange(updatedFiles);
          }}
          onUploadError={(error: { message: string; code: string }) => {
            console.error("Upload error:", error);
          }}
          acceptedFileTypes={acceptedTypes}
          maxFileSize={maxSize}
          uploadDelay={0} // No simulation
          className="w-full max-w-none"
        />
      )}

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {files.map((uploadedFile) => {
              const FileIcon = getFileIcon(uploadedFile.file);

              return (
                <motion.div
                  key={uploadedFile.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border"
                >
                  {/* File Preview/Icon */}
                  <div className="shrink-0">
                    {uploadedFile.preview ? (
                      <Image
                        src={uploadedFile.preview}
                        alt={uploadedFile.file.name}
                        className="w-10 h-10 object-cover rounded"
                        width={40}
                        height={40}
                      />
                    ) : (
                      <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                        <FileText className="size-5 text-muted-foreground" aria-hidden="true" />
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {uploadedFile.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(uploadedFile.file.size)}
                    </p>

                    {/* Progress Bar */}
                    {uploadProgress && uploadedFile.status === "uploading" && (
                      <Progress
                        value={uploadedFile.progress}
                        className="mt-2 h-1"
                      />
                    )}

                    {/* Error Message */}
                    {uploadedFile.error && (
                      <p className="text-xs text-destructive mt-1">
                        {uploadedFile.error}
                      </p>
                    )}
                  </div>

                  {/* Status Icon */}
                  <div className="shrink-0">
                    {uploadedFile.status === "uploading" && (
                      <Loader2 className="size-4 text-primary animate-spin" aria-hidden="true" />
                    )}
                    {uploadedFile.status === "success" && (
                      <CheckCircle2 className="size-4 text-green-500" aria-hidden="true" />
                    )}
                    {uploadedFile.status === "error" && (
                      <AlertCircle className="size-4 text-destructive" aria-hidden="true" />
                    )}
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(uploadedFile.id);
                    }}
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Remove ${uploadedFile.file.name}`}
                  >
                    <X className="size-4" aria-hidden="true" />
                  </Button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-1 text-sm text-destructive">
          <AlertCircle className="size-4" aria-hidden="true" />
          {error}
        </div>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}
