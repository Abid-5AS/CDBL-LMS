import { Label, Textarea } from "@/components/ui";
import { MessageSquare, AlertCircle } from "lucide-react";
import { cn } from "@/lib";
import React from "react";

interface ReasonFieldProps {
  reason: string;
  setReason: (reason: string) => void;
  error?: string;
  submitting: boolean;
  minLength?: number;
  clearReasonError: () => void;
}

export function ReasonField({
  reason,
  setReason,
  error,
  submitting,
  minLength = 10,
  clearReasonError,
}: ReasonFieldProps) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor="reason"
        className="flex items-center gap-2 text-sm font-medium leading-6"
      >
        <MessageSquare className="w-4 h-4 text-card-action" />
        Reason <span className="text-destructive">*</span>
      </Label>
      <Textarea
        id="reason"
        value={reason}
        onChange={(event) => {
          setReason(event.target.value);
          clearReasonError();
        }}
        placeholder={`Describe your reason for leave (min ${minLength} characters)`}
        rows={4}
        className={cn(
          "min-h-[120px] resize-none leading-6 transition-all focus-visible:ring-2",
          error
            ? "border-destructive focus-visible:ring-destructive"
            : "border-border-strong dark:border-border-strong focus-visible:ring-card-action/40 hover:border-card-action dark:hover:border-card-action"
        )}
        aria-label="Reason for leave"
        aria-required="true"
        aria-invalid={!!error}
        aria-describedby={error ? "reason-error" : "reason-help"}
        disabled={submitting}
      />
      <div className="flex items-center justify-between">
        {error ? (
          <p
            id="reason-error"
            className="text-sm text-destructive flex items-center gap-1.5"
            role="alert"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        ) : (
          <p id="reason-help" className="text-xs text-muted-foreground">
            {reason.trim().length} / {minLength} characters minimum
          </p>
        )}
      </div>
    </div>
  );
}
