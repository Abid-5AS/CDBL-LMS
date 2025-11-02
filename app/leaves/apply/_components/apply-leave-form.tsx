"use client";

import { useMemo, useState, useEffect, type FormEvent } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, FileText, Clock, Info } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { policy } from "@/lib/policy";
import Link from "next/link";
import { LeaveConfirmationModal } from "./leave-confirmation-modal";
import { FileUploadSection } from "./file-upload-section";
import { useDraftAutosave } from "./use-draft-autosave";
import { DateRangePicker } from "./date-range-picker";
import { useHolidays } from "./use-holidays";
import { totalDaysInclusive, rangeContainsNonWorking, isWeekendOrHoliday, fmtDDMMYYYY } from "@/lib/date-utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type BalanceResponse = {
  year: number;
  CASUAL: number;
  EARNED: number;
  MEDICAL: number;
};

type LeaveType = "CASUAL" | "MEDICAL" | "EARNED";

const LEAVE_OPTIONS: { value: LeaveType; label: string }[] = [
  { value: "CASUAL", label: "Casual Leave" },
  { value: "MEDICAL", label: "Sick Leave" },
  { value: "EARNED", label: "Earned Leave" },
];

const RULE_TIPS: Record<LeaveType, string[]> = {
  CASUAL: ["Max 3 consecutive days", "Must retain 5 days balance"],
  MEDICAL: ["> 3 days requires certificate", "Backdating allowed up to 30 days"],
  EARNED: ["Submit at least 15 days in advance", "Balance carries forward up to 60 days"],
};

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

type FormErrors = {
  type?: string;
  start?: string;
  end?: string;
  reason?: string;
  file?: string;
  general?: string;
};

export function ApplyLeaveForm() {
  const router = useRouter();
  const [type, setType] = useState<LeaveType>("CASUAL");
  const [dateRange, setDateRange] = useState<{ start: Date | undefined; end: Date | undefined }>({
    start: undefined,
    end: undefined,
  });
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showOptionalUpload, setShowOptionalUpload] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [draftLoaded, setDraftLoaded] = useState(false);

  const {
    data: balances,
    error: balancesError,
    isLoading: balancesLoading,
  } = useSWR<BalanceResponse>("/api/balance/mine", fetcher);

  // Fetch holidays
  const { holidays } = useHolidays();

  // Draft auto-save
  const { lastSaved, hasDraft, loadDraft, clearDraft } = useDraftAutosave({
    type,
    startDate: dateRange.start,
    endDate: dateRange.end,
    reason,
    fileName: file?.name || null,
  });

  // Load draft on mount
  useEffect(() => {
    if (draftLoaded) return;
    
    const draft = loadDraft();
    if (draft) {
      toast.info("Draft found. Click OK to restore your previous application.", {
        duration: 5000,
        action: {
          label: "Restore",
          onClick: () => {
            setType(draft.type);
            setDateRange({
              start: draft.startDate ? new Date(draft.startDate) : undefined,
              end: draft.endDate ? new Date(draft.endDate) : undefined,
            });
            setReason(draft.reason);
            toast.success("Draft restored successfully");
          },
        },
      });
    }
    setDraftLoaded(true);
  }, [loadDraft, draftLoaded]);

  const requestedDays = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return 0;
    return totalDaysInclusive(dateRange.start, dateRange.end);
  }, [dateRange]);
  const requiresCertificate = type === "MEDICAL" && requestedDays > 3;

  const minSelectableDate = useMemo(() => {
    if (type === "MEDICAL" || type === "EARNED") {
      const today = startOfDay(new Date());
      today.setDate(today.getDate() - 30);
      return today;
    }
    return startOfDay(new Date());
  }, [type]);

  const hasBalanceData = Boolean(balances) && !balancesError;
  const balanceForType = hasBalanceData ? balances?.[type] ?? 0 : 0;
  const remainingBalance = balanceForType - (requestedDays || 0);

  // Range validation with CDBL policy
  const rangeValidation = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return null;

    if (isWeekendOrHoliday(dateRange.start, holidays)) {
      return { valid: false, message: "Start date cannot be on Friday, Saturday, or a company holiday" };
    }

    if (isWeekendOrHoliday(dateRange.end, holidays)) {
      return { valid: false, message: "End date cannot be on Friday, Saturday, or a company holiday" };
    }

    const containsNonWorking = rangeContainsNonWorking(dateRange.start, dateRange.end, holidays);

    return {
      valid: true,
      containsNonWorking,
      message: containsNonWorking
        ? "Note: This range includes weekends/holidays which count toward your balance"
        : null,
    };
  }, [dateRange, holidays]);

  // Real-time validation warnings
  const warnings: string[] = [];
  if (type === "CASUAL" && requestedDays > policy.clMaxConsecutiveDays) {
    warnings.push(`Casual Leave cannot exceed ${policy.clMaxConsecutiveDays} consecutive days.`);
  }
  if (type === "EARNED" && dateRange.start) {
    const daysUntil = Math.floor((dateRange.start.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntil < policy.elMinNoticeDays && daysUntil >= 0) {
      warnings.push(`Earned Leave requires ${policy.elMinNoticeDays} days' advance notice.`);
    }
  }
  if (requiresCertificate && !file) {
    warnings.push("Attach medical certificate for Sick Leave over 3 days.");
  }

  const handleFileError = (error: string) => {
    setErrors((prev) => ({ ...prev, file: error }));
    toast.error(error);
  };

  const handleTypeChange = (value: LeaveType) => {
    setType(value);
    setFile(null);
    setShowOptionalUpload(false);
    setErrors((prev) => ({ ...prev, type: undefined }));
  };

  const clearErrors = () => {
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!dateRange.start) {
      newErrors.start = "Start date is required";
    }

    if (!dateRange.end) {
      newErrors.end = "End date is required";
    }

    if (dateRange.start && dateRange.end) {
      if (dateRange.start > dateRange.end) {
        newErrors.end = "End date must be on or after start date";
      } else if (requestedDays <= 0) {
        newErrors.end = "Invalid date range";
      }
    }

    // CDBL policy validation
    if (rangeValidation && !rangeValidation.valid) {
      newErrors.general = rangeValidation.message || "Invalid date range";
    }

    if (!reason.trim()) {
      newErrors.reason = "Reason is required";
    } else if (reason.trim().length < 10) {
      newErrors.reason = "Reason must be at least 10 characters";
    }

    if (hasBalanceData && remainingBalance < 0) {
      newErrors.general = "Insufficient balance for this leave type";
    }

    if (requiresCertificate && !file) {
      newErrors.file = "Medical certificate is required for sick leave over 3 days";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReviewClick = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    if (!dateRange.start || !dateRange.end) return;

    try {
      setSubmitting(true);
      const payload = {
        type,
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
        reason: reason.trim(),
        needsCertificate: requiresCertificate,
      };

      let response: Response;

      if (file) {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => formData.append(key, String(value)));
        formData.append("certificate", file, file.name);
        response = await fetch("/api/leaves", {
          method: "POST",
          body: formData,
        });
      } else {
        response = await fetch("/api/leaves", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(data?.error ?? "Unable to submit request");
        return;
      }

      clearDraft();
      toast.success("Leave request submitted successfully");
      router.push("/leaves");
    } catch (error) {
      console.error(error);
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  // Format last saved time
  const lastSavedTime = lastSaved
    ? lastSaved.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    : null;

  return (
    <div className="max-w-7xl mx-auto px-8 lg:px-12 py-6">
      <form onSubmit={handleReviewClick} noValidate aria-label="Leave application form">
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/30 dark:border-white/10 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">New Leave Application</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Select leave type, duration, and add a short reason. Attach supporting documents when necessary.
              </p>
              {lastSavedTime && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last saved at {lastSavedTime}
                </p>
              )}
            </div>

            <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/30 dark:border-white/10 rounded-xl p-6 shadow-sm space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-900 dark:text-slate-50">
                  Leave Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={type}
                  onValueChange={(value) => {
                    handleTypeChange(value as LeaveType);
                    clearErrors();
                  }}
                >
                  <SelectTrigger
                    className={cn("h-10", errors.type && "border-red-500")}
                    aria-label="Leave type"
                    aria-required="true"
                    aria-invalid={!!errors.type}
                    aria-describedby={errors.type ? "type-error" : undefined}
                  >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAVE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p id="type-error" className="text-sm text-red-600 flex items-center gap-1" role="alert">
                    <AlertCircle className="h-3 w-3" aria-hidden="true" />
                    {errors.type}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-900 dark:text-slate-50">
                  Leave Dates <span className="text-red-500">*</span>
                </Label>

                <DateRangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  holidays={holidays}
                  disabled={submitting}
                  minDate={minSelectableDate}
                />

                {/* Duration feedback */}
                {dateRange.start && dateRange.end && (
                  <div className="mt-2 text-sm flex items-center gap-2" aria-live="polite">
                    <span className="text-slate-600 dark:text-slate-400">Selected:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {requestedDays} day{requestedDays !== 1 ? 's' : ''}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      ({fmtDDMMYYYY(dateRange.start)} → {fmtDDMMYYYY(dateRange.end)})
                    </span>
                  </div>
                )}

                {/* Validation feedback */}
                {rangeValidation && !rangeValidation.valid && (
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1 mt-2" role="alert">
                    <AlertCircle className="h-3 w-3" aria-hidden="true" />
                    {rangeValidation.message}
                  </p>
                )}

                {rangeValidation?.containsNonWorking && rangeValidation.valid && (
                  <div className="mt-2 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2">
                    <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      {rangeValidation.message}
                    </p>
                  </div>
                )}

                {/* Help text */}
                <p className="text-xs text-muted-foreground mt-2">
                  All days in the range count toward balance. Start/End cannot be Fri/Sat or holidays.
                </p>

                {(errors.start || errors.end) && (
                  <p className="text-sm text-red-600 flex items-center gap-1" role="alert">
                    <AlertCircle className="h-3 w-3" aria-hidden="true" />
                    {errors.start || errors.end}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-900 dark:text-slate-50">
                  Reason <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  value={reason}
                  onChange={(event) => {
                    setReason(event.target.value);
                    setErrors((prev) => ({ ...prev, reason: undefined }));
                  }}
                  placeholder="Family event, personal errand, medical follow-up..."
                  className={cn(
                    "min-h-[120px]",
                    errors.reason && "border-red-500 focus-visible:ring-red-500"
                  )}
                  aria-label="Reason for leave"
                  aria-required="true"
                  aria-invalid={!!errors.reason}
                  aria-describedby={errors.reason ? "reason-error" : "reason-help"}
                />
                <div className="flex items-center justify-between">
                  {errors.reason ? (
                    <p id="reason-error" className="text-sm text-red-600 flex items-center gap-1" role="alert">
                      <AlertCircle className="h-3 w-3" aria-hidden="true" />
                      {errors.reason}
                    </p>
                  ) : (
                    <p id="reason-help" className="text-xs text-muted-foreground">
                      {reason.trim().length} / 10 characters minimum
                    </p>
                  )}
                </div>
              </div>

              {/* File Upload */}
              {(requiresCertificate || showOptionalUpload) && (
                <FileUploadSection
                  value={file}
                  onChange={setFile}
                  onError={handleFileError}
                  error={errors.file}
                  required={requiresCertificate}
                  disabled={submitting}
                />
              )}

              {!requiresCertificate && !showOptionalUpload && (
                <button
                  type="button"
                  onClick={() => setShowOptionalUpload(true)}
                  className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1"
                >
                  <FileText className="h-4 w-4" />
                  Add supporting document (optional)
                </button>
              )}

              {errors.general && (
                <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900 dark:text-red-100">Validation Error</p>
                    <p className="text-sm text-red-700 dark:text-red-200 mt-0.5">{errors.general}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700">
                  {submitting ? "Submitting..." : "Review Application"}
                </Button>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/30 dark:border-white/10 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Leave Summary</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Type</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {LEAVE_OPTIONS.find((o) => o.value === type)?.label ?? "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Duration</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {requestedDays > 0 ? `${requestedDays} day(s)` : "Select dates"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm" aria-live="polite">
                  <span className="text-slate-500 dark:text-slate-400">Projected Balance</span>
                  <span
                    className={cn(
                      "font-semibold",
                      remainingBalance < 0
                        ? "text-red-600 dark:text-red-400"
                        : remainingBalance < 2
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    )}
                  >
                    {balancesLoading ? "Loading..." : balancesError ? "Unavailable" : Math.max(remainingBalance, 0)} days
                  </span>
                </div>
              </div>

              <hr className="my-4 border-slate-200 dark:border-slate-700" />
              
              <div className="space-y-2 text-sm mb-4">
                <h4 className="font-semibold text-slate-700 dark:text-slate-300">Rules</h4>
                {RULE_TIPS[type].map((tip) => (
                  <p key={tip} className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                    <span className="text-blue-600 dark:text-blue-400">•</span>
                    {tip}
                  </p>
                ))}
              </div>

              {warnings.length > 0 && (
                <div className="mt-4 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm">
                  {warnings.map((warning, idx) => (
                    <p key={idx} className="text-amber-700 dark:text-amber-200 flex items-start gap-1 mb-1">
                      <Info className="h-3 w-3 flex-shrink-0 mt-0.5" />
                      {warning}
                    </p>
                  ))}
                </div>
              )}

              <Link href="/policies" className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1 mt-4">
                View Leave Policy →
              </Link>
            </div>

            <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/30 dark:border-white/10 rounded-xl p-6 shadow-sm">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-4">
                Current Balances
              </h4>
              {balancesLoading ? (
                <div className="space-y-2">
                  <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                </div>
              ) : balancesError ? (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Unable to load balances right now. You can still submit your request.
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Casual</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{balances?.CASUAL ?? "—"} days</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Sick</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{balances?.MEDICAL ?? "—"} days</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Earned</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{balances?.EARNED ?? "—"} days</span>
                  </li>
                </ul>
              )}
            </div>
          </aside>
        </div>
      </form>

      <LeaveConfirmationModal
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        onConfirm={handleConfirmSubmit}
        submitting={submitting}
        type={type}
        startDate={dateRange.start!}
        endDate={dateRange.end!}
        duration={requestedDays}
        reason={reason}
        fileName={file?.name || null}
        currentBalance={balanceForType}
        projectedBalance={remainingBalance}
        warnings={warnings}
      />
    </div>
  );
}