import { Label } from "@/components/ui";
import { Paperclip } from "lucide-react";
import { FileUploadSection } from "../file-upload-section";
import React from "react";

interface FileUploadFieldProps {
  file: File | null;
  setFile: (file: File | null) => void;
  error?: string;
  required?: boolean;
  submitting: boolean;
  showOptionalUpload: boolean;
  setShowOptionalUpload: (show: boolean) => void;
  requiresCertificate: boolean;
  handleFileError: (error: string) => void;
}

export function FileUploadField({
  file,
  setFile,
  error,
  required,
  submitting,
  showOptionalUpload,
  setShowOptionalUpload,
  requiresCertificate,
  handleFileError,
}: FileUploadFieldProps) {
  return (
    <div className="space-y-2">
      {!requiresCertificate && !showOptionalUpload ? (
        <button
          type="button"
          onClick={() => setShowOptionalUpload(true)}
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1.5 transition-colors font-medium"
        >
          <Paperclip className="h-4 w-4" />
          Add supporting document (optional)
        </button>
      ) : (
        <>
          <Label className="flex items-center gap-2 text-sm font-medium leading-6">
            <Paperclip className="w-4 h-4 text-indigo-500" />
            Supporting Document{" "}
            {requiresCertificate && <span className="text-destructive">*</span>}
          </Label>
          <FileUploadSection
            value={file}
            onChange={setFile}
            onError={handleFileError}
            error={error}
            required={required}
            disabled={submitting}
          />
        </>
      )}
    </div>
  );
}
