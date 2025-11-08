"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  File,
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
import { Badge } from "./badge";

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
        error,
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      processFiles(selectedFiles);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = "";
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
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
      <motion.div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
          isDragOver && !disabled && "border-primary bg-primary/5 scale-[1.02]",
          !isDragOver &&
            "border-muted-foreground/25 hover:border-muted-foreground/50",
          disabled && "opacity-50 cursor-not-allowed",
          error && "border-destructive",
          "cursor-pointer"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        whileHover={!disabled ? { scale: 1.01 } : {}}
        whileTap={!disabled ? { scale: 0.99 } : {}}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedTypes.join(",")}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        <motion.div
          animate={isDragOver ? { scale: 1.1 } : { scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Upload
            className={cn(
              "mx-auto h-12 w-12 mb-4",
              isDragOver ? "text-primary" : "text-muted-foreground"
            )}
          />
        </motion.div>

        <div className="space-y-2">
          <p className="text-lg font-medium text-foreground">
            {isDragOver ? "Drop files here" : "Drag & drop files here"}
          </p>
          <p className="text-sm text-muted-foreground">
            or click to browse files
          </p>

          {(maxFiles > 1 || acceptedTypes.length > 0 || maxSize) && (
            <div className="text-xs text-muted-foreground space-y-1">
              {maxFiles > 1 && <p>Maximum {maxFiles} files</p>}
              {maxSize && <p>Maximum size: {formatFileSize(maxSize)}</p>}
              {acceptedTypes.length > 0 && (
                <p>Accepted types: {acceptedTypes.join(", ")}</p>
              )}
            </div>
          )}
        </div>
      </motion.div>

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
                  <div className="flex-shrink-0">
                    {uploadedFile.preview ? (
                      <img
                        src={uploadedFile.preview}
                        alt={uploadedFile.file.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                        <FileIcon className="w-5 h-5 text-muted-foreground" />
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
                  <div className="flex-shrink-0">
                    {uploadedFile.status === "uploading" && (
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    )}
                    {uploadedFile.status === "success" && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                    {uploadedFile.status === "error" && (
                      <AlertCircle className="w-4 h-4 text-destructive" />
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
                  >
                    <X className="w-4 h-4" />
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
          <AlertCircle className="w-4 h-4" />
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
