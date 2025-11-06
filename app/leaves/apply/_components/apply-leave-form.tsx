"use client";

import { useMemo, useState, useEffect, type FormEvent } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle, FileText, Clock, Info, HelpCircle, Calendar, MessageSquare, Paperclip, ClipboardList, BookOpenText, Send, CheckCircle2 } from "lucide-react";
import { LeaveBalancePanel } from "@/components/shared/LeaveBalancePanel";
import { fromBalanceResponse } from "@/components/shared/balance-adapters";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { policy } from "@/lib/policy";
import { LeaveConfirmationModal } from "./leave-confirmation-modal";
import { FileUploadSection } from "./file-upload-section";
import { useDraftAutosave } from "./use-draft-autosave";
import { DateRangePicker } from "./date-range-picker";
import { useHolidays } from "./use-holidays";
import { totalDaysInclusive, rangeContainsNonWorking, isWeekendOrHoliday, fmtDDMMYYYY, normalizeToDhakaMidnight } from "@/lib/date-utils";
import { SUCCESS_MESSAGES, INFO_MESSAGES, getToastMessage } from "@/lib/toast-messages";
import { countWorkingDaysSync } from "@/lib/working-days";
import { leaveTypeLabel } from "@/lib/ui";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type BalanceResponse = {
  year: number;
  CASUAL: number;
  EARNED: number;
  MEDICAL: number;
  MATERNITY?: number;
  PATERNITY?: number;
  STUDY?: number;
  SPECIAL_DISABILITY?: number;
  QUARANTINE?: number;
  EXTRAWITHPAY?: number;
  EXTRAWITHOUTPAY?: number;
};

type LeaveType = "EARNED" | "CASUAL" | "MEDICAL" | "MATERNITY" | "PATERNITY" | "STUDY" | "SPECIAL_DISABILITY" | "QUARANTINE" | "EXTRAWITHPAY" | "EXTRAWITHOUTPAY";

// Use leaveTypeLabel from lib/ui.ts as source of truth for all leave types
const LEAVE_OPTIONS: { value: LeaveType; label: string }[] = [
  { value: "EARNED", label: leaveTypeLabel.EARNED },
  { value: "CASUAL", label: leaveTypeLabel.CASUAL },
  { value: "MEDICAL", label: leaveTypeLabel.MEDICAL },
  { value: "MATERNITY", label: leaveTypeLabel.MATERNITY },
  { value: "PATERNITY", label: leaveTypeLabel.PATERNITY },
  { value: "STUDY", label: leaveTypeLabel.STUDY },
  { value: "SPECIAL_DISABILITY", label: leaveTypeLabel.SPECIAL_DISABILITY },
  { value: "QUARANTINE", label: leaveTypeLabel.QUARANTINE },
  { value: "EXTRAWITHPAY", label: leaveTypeLabel.EXTRAWITHPAY },
  { value: "EXTRAWITHOUTPAY", label: leaveTypeLabel.EXTRAWITHOUTPAY },
];

// Policy tooltips for inline help
const POLICY_TOOLTIPS: Record<LeaveType, string> = {
  EARNED: "Submit ≥ 5 working days before start. Accrues 2 days per month. Balance carries forward up to 60 days.",
  CASUAL: "Max 3 consecutive days per spell. Cannot start/end on Friday, Saturday, or holidays. Must retain 5 days balance.",
  MEDICAL: "Attach certificate if > 3 days. Fitness certificate required to return if > 7 days. Backdating allowed up to 30 days.",
  MATERNITY: "Requires medical certificate. Usually 16 weeks duration. Apply well in advance.",
  PATERNITY: "Usually up to 14 days. Apply with sufficient notice. May require supporting documentation.",
  STUDY: "Requires approval from HR. Supporting documentation may be required. Apply in advance for planning.",
  SPECIAL_DISABILITY: "Medical certificate required. Subject to HR approval. Duration varies by case.",
  QUARANTINE: "Backdating allowed if applicable. Medical certificate may be required. Subject to HR verification.",
  EXTRAWITHPAY: "Requires CEO approval. Subject to company policy. May require supporting documentation.",
  EXTRAWITHOUTPAY: "Requires CEO approval. Does not affect leave balance. Subject to company policy.",
};

const RULE_TIPS: Record<LeaveType, string[]> = {
  CASUAL: [
    "Max 3 consecutive days per spell",
    "Cannot start/end on Friday, Saturday, or holidays",
    "Must retain 5 days balance",
  ],
  EARNED: [
    "Submit at least 5 working days in advance",
    "Accrues 2 days per month",
    "Balance carries forward up to 60 days",
  ],
  MEDICAL: [
    "Certificate required if > 3 days",
    "Fitness certificate required to return if > 7 days",
    "Backdating allowed up to 30 days",
  ],
  MATERNITY: [
    "Requires medical certificate",
    "Usually 16 weeks duration",
    "Apply well in advance",
  ],
  PATERNITY: [
    "Usually up to 14 days",
    "Apply with sufficient notice",
    "May require supporting documentation",
  ],
  STUDY: [
    "Requires approval from HR",
    "Supporting documentation may be required",
    "Apply in advance for planning",
  ],
  SPECIAL_DISABILITY: [
    "Medical certificate required",
    "Subject to HR approval",
    "Duration varies by case",
  ],
  QUARANTINE: [
    "Backdating allowed if applicable",
    "Medical certificate may be required",
    "Subject to HR verification",
  ],
  EXTRAWITHPAY: [
    "Requires CEO approval",
    "Subject to company policy",
    "May require supporting documentation",
  ],
  EXTRAWITHOUTPAY: [
    "Requires CEO approval",
    "Does not affect leave balance",
    "Subject to company policy",
  ],
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
  const [type, setType] = useState<LeaveType>("EARNED");
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
  const [showStickyButton, setShowStickyButton] = useState(false);

  const {
    data: balances,
    error: balancesError,
    isLoading: balancesLoading,
  } = useSWR<BalanceResponse>("/api/balance/mine", fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

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
            toast.success(INFO_MESSAGES.draft_restored);
          },
        },
      });
    }
    setDraftLoaded(true);
  }, [loadDraft, draftLoaded]);

  // Show sticky button on scroll
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyButton(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-save happens silently via useDraftAutosave hook
  // No toast notification to avoid spam

  const requestedDays = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return 0;
    return totalDaysInclusive(dateRange.start, dateRange.end);
  }, [dateRange]);
  const requiresCertificate = type === "MEDICAL" && requestedDays > 3;

  const minSelectableDate = useMemo(() => {
    // Types that allow backdating up to 30 days
    if (type === "MEDICAL" || type === "EARNED" || type === "QUARANTINE") {
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
    // Calculate working days notice using holidays
    const today = normalizeToDhakaMidnight(new Date());
    const startDate = normalizeToDhakaMidnight(dateRange.start);
    const workingDaysUntil = countWorkingDaysSync(today, startDate, holidays);
    if (workingDaysUntil < policy.elMinNoticeDays && workingDaysUntil >= 0) {
      warnings.push(`Earned Leave requires at least ${policy.elMinNoticeDays} working days advance notice (you have ${workingDaysUntil} working days).`);
    }
  }
  // CL side-touch warning
  if (type === "CASUAL" && dateRange.start && dateRange.end) {
    const startTouches = isWeekendOrHoliday(dateRange.start, holidays);
    const endTouches = isWeekendOrHoliday(dateRange.end, holidays);
    if (startTouches || endTouches) {
      warnings.push("Casual Leave cannot start or end on Friday, Saturday, or a company holiday. Please use Earned Leave instead.");
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
      toast.error(getToastMessage("validation_error", "Please fix the errors in the form"));
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
        const errorMessage = getToastMessage(data?.error || "Unable to submit request", data?.message);
        toast.error(errorMessage);
        return;
      }

      clearDraft();
      toast.success(SUCCESS_MESSAGES.leave_submitted);
      router.push("/leaves");
    } catch (error) {
      console.error(error);
      toast.error(getToastMessage("network_error", "Network error. Please try again."));
    } finally {
      setSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  // Format last saved time
  const lastSavedTime = lastSaved
    ? lastSaved.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    : null;

  // Projected balance percentage for visual bar
  const projectedBalancePercent = balanceForType > 0
    ? Math.max(0, Math.min(100, (remainingBalance / balanceForType) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Apply for Leave</h1>
          <p className="text-sm text-muted-foreground leading-6">
            Fill out the details below and submit your request for review.
          </p>
        </div>

        {/* Two-column responsive layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: Form Section (8 columns) */}
          <div className="lg:col-span-8 space-y-8">
            <Card className="bg-white dark:bg-neutral-950/60 border border-neutral-200/60 dark:border-neutral-800/60 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl">
              <CardHeader className="p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-neutral-900 dark:text-neutral-100 leading-6">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    Leave Details
                  </CardTitle>
                  {lastSavedTime && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Saved just now
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <form onSubmit={handleReviewClick} noValidate aria-label="Leave application form">
                <CardContent className="p-6 space-y-6">
                  {/* Leave Type and Date Range in Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Leave Type */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="leave-type" className="text-sm font-medium leading-6">
                          Leave Type <span className="text-destructive">*</span>
                        </Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" className="inline-flex items-center">
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              <p className="text-xs">{POLICY_TOOLTIPS[type]}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Select
                        value={type}
                        onValueChange={(value) => {
                          handleTypeChange(value as LeaveType);
                          clearErrors();
                        }}
                      >
                        <SelectTrigger
                          id="leave-type"
                          className={cn("h-11", errors.type && "border-destructive")}
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
                        <p id="type-error" className="text-sm text-destructive flex items-center gap-1.5" role="alert">
                          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                          {errors.type}
                        </p>
                      )}
                    </div>

                    {/* Date Range Picker */}
                    <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="leave-dates" className="text-sm font-medium leading-6">
                        Leave Dates <span className="text-destructive">*</span>
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="inline-flex items-center">
                              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <p className="text-xs">
                              All days in the range count toward balance. Start/End cannot be Fri/Sat or holidays.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <DateRangePicker
                      value={dateRange}
                      onChange={setDateRange}
                      holidays={holidays}
                      disabled={submitting}
                      minDate={minSelectableDate}
                      showQuickSelect={false}
                    />

                    {/* Duration feedback */}
                    {dateRange.start && dateRange.end && (
                      <div className="mt-2 text-sm flex items-center gap-2 text-muted-foreground" aria-live="polite">
                        <span>Selected:</span>
                        <span className="font-semibold text-foreground">
                          {requestedDays} day{requestedDays !== 1 ? 's' : ''}
                        </span>
                        <span className="text-muted-foreground">
                          ({fmtDDMMYYYY(dateRange.start)} → {fmtDDMMYYYY(dateRange.end)})
                        </span>
                      </div>
                    )}

                    {/* Validation feedback */}
                    {rangeValidation && !rangeValidation.valid && (
                      <p className="text-sm text-destructive flex items-center gap-1.5 mt-2" role="alert">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                        {rangeValidation.message}
                      </p>
                    )}

                    {rangeValidation?.containsNonWorking && rangeValidation.valid && (
                      <div className="mt-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2">
                        <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                          <Info className="h-3.5 w-3.5 flex-shrink-0" />
                          {rangeValidation.message}
                        </p>
                      </div>
                    )}

                      {(errors.start || errors.end) && (
                        <p className="text-sm text-destructive flex items-center gap-1.5 mt-2" role="alert">
                          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                          {errors.start || errors.end}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Separator */}
                  <Separator className="my-4" />

                  {/* Reason Textarea */}
                  <div className="space-y-2">
                    <Label htmlFor="reason" className="flex items-center gap-2 text-sm font-medium leading-6">
                      <MessageSquare className="w-4 h-4 text-indigo-500" />
                      Reason <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="reason"
                      value={reason}
                      onChange={(event) => {
                        setReason(event.target.value);
                        setErrors((prev) => ({ ...prev, reason: undefined }));
                      }}
                      placeholder="Describe your reason for leave (min 10 characters)"
                      rows={4}
                      className={cn(
                        "min-h-[120px] resize-none leading-6 transition-all focus-visible:ring-2",
                        errors.reason 
                          ? "border-destructive focus-visible:ring-destructive" 
                          : "border-neutral-300 dark:border-neutral-700 focus-visible:ring-indigo-500/40 hover:border-indigo-400 dark:hover:border-indigo-600"
                      )}
                      aria-label="Reason for leave"
                      aria-required="true"
                      aria-invalid={!!errors.reason}
                      aria-describedby={errors.reason ? "reason-error" : "reason-help"}
                    />
                    <div className="flex items-center justify-between">
                      {errors.reason ? (
                        <p id="reason-error" className="text-sm text-destructive flex items-center gap-1.5" role="alert">
                          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                          {errors.reason}
                        </p>
                      ) : (
                        <p id="reason-help" className="text-xs text-muted-foreground">
                          {reason.trim().length} / 10 characters minimum
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Separator */}
                  <Separator className="my-4" />

                  {/* File Upload */}
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
                          Supporting Document {requiresCertificate && <span className="text-destructive">*</span>}
                        </Label>
                        <FileUploadSection
                          value={file}
                          onChange={setFile}
                          onError={handleFileError}
                          error={errors.file}
                          required={requiresCertificate}
                          disabled={submitting}
                        />
                      </>
                    )}
                  </div>

                  {/* General errors */}
                  {errors.general && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 dark:bg-destructive/20 p-3 flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-destructive">Validation Error</p>
                        <p className="text-sm text-destructive/90 dark:text-destructive/80 mt-0.5">{errors.general}</p>
                      </div>
                    </div>
                  )}
                </CardContent>

                {/* Actions inside form */}
                <div className="flex justify-end gap-4 pt-4 border-t border-muted mt-10 px-6 pb-6">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => router.back()} 
                    disabled={submitting}
                    className="transition-transform hover:scale-[1.02]"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={submitting}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white transition-all hover:scale-[1.02] hover:shadow-md"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {submitting ? "Submitting..." : "Submit Request"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* RIGHT: Unified Guidance Panel (4 columns) */}
          <aside className="lg:col-span-4">
            <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-sky-950/30 border-none shadow-md rounded-xl p-6 space-y-6 lg:sticky lg:top-24">
              {/* Leave Summary Section */}
              <div>
                <h4 className="flex items-center gap-2 text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4 leading-6">
                  <ClipboardList className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Leave Summary
                </h4>
                <div className="text-sm text-muted-foreground space-y-3 leading-6">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      {LEAVE_OPTIONS.find((o) => o.value === type)?.label ?? "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      {requestedDays > 0 && dateRange.start && dateRange.end
                        ? `${requestedDays} day(s) (${fmtDDMMYYYY(dateRange.start)} → ${fmtDDMMYYYY(dateRange.end)})`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Projected Balance:</span>
                    <span className={cn(
                      "font-medium",
                      remainingBalance < 0
                        ? "text-destructive"
                        : remainingBalance < 2
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    )}>
                      {balancesLoading ? "Loading..." : balancesError ? "Unavailable" : `${Math.max(remainingBalance, 0)} days`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <Separator className="bg-neutral-200/70 dark:bg-neutral-800/70" />

              {/* Policy Highlights Section */}
              <div>
                <h4 className="flex items-center gap-2 text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-3 leading-6">
                  <BookOpenText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Policy Highlights
                </h4>
                <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1 leading-6">
                  {RULE_TIPS[type].slice(0, 3).map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
                <Link 
                  href="/policies" 
                  className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:text-indigo-700 dark:hover:text-indigo-300 mt-4 inline-flex items-center gap-1 leading-6 transition-colors"
                >
                  View Full Policy →
                </Link>
              </div>

              {/* Warnings Section */}
              {warnings.length > 0 && (
                <>
                  <Separator className="bg-neutral-200/70 dark:bg-neutral-800/70" />
                  <div className="rounded-lg border border-amber-200/70 dark:border-amber-800/70 bg-amber-50/50 dark:bg-amber-950/20 p-4">
                    <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2 leading-6">
                      <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      Important Note
                    </h4>
                    <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1 leading-6">
                      {warnings.map((warning, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="mt-0.5">•</span>
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </Card>
          </aside>
        </div>
      </div>

      {/* Sticky Submit Button (visible on scroll for mobile) */}
      {showStickyButton && (
        <div className="fixed bottom-6 right-6 z-50 lg:hidden">
          <Button
            onClick={(e) => {
              e.preventDefault();
              if (!submitting && validateForm()) {
                setShowConfirmModal(true);
              } else if (!submitting) {
                toast.error(getToastMessage("validation_error", "Please fix the errors in the form"));
              }
            }}
            disabled={submitting}
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg transition-all hover:scale-[1.02]"
          >
            <Send className="w-4 h-4 mr-2" />
            {submitting ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      )}

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

// Leave Summary Card Component
function LeaveSummaryCard({
  type,
  requestedDays,
  remainingBalance,
  balancesLoading,
  balancesError,
  projectedBalancePercent,
  warnings,
}: {
  type: LeaveType;
  requestedDays: number;
  remainingBalance: number;
  balancesLoading: boolean;
  balancesError: boolean;
  projectedBalancePercent: number;
  warnings: string[];
}) {
  return (
    <Card className="rounded-2xl border-muted shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Leave Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Type</span>
            <span className="font-medium text-foreground">
              {LEAVE_OPTIONS.find((o) => o.value === type)?.label ?? "—"}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Duration</span>
            <span className="font-medium text-foreground">
              {requestedDays > 0 ? `${requestedDays} day(s)` : "Select dates"}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm" aria-live="polite">
            <span className="text-muted-foreground">Projected Balance</span>
            <span
              className={cn(
                "font-semibold",
                remainingBalance < 0
                  ? "text-destructive"
                  : remainingBalance < 2
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400"
              )}
            >
              {balancesLoading ? "Loading..." : balancesError ? "Unavailable" : Math.max(remainingBalance, 0)} days
            </span>
          </div>
        </div>

        {/* Visual balance bar */}
        {requestedDays > 0 && !balancesLoading && !balancesError && (
          <div className="space-y-1.5">
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  remainingBalance < 0
                    ? "bg-destructive"
                    : remainingBalance < 2
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                )}
                style={{ width: `${Math.max(0, Math.min(100, projectedBalancePercent))}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.max(remainingBalance, 0)} days remaining
            </p>
          </div>
        )}

        <hr className="border-muted" />

        {/* Policy tips */}
        <div className="space-y-2 text-sm">
          <h4 className="font-semibold text-foreground">Policy Tips</h4>
          {RULE_TIPS[type].map((tip) => (
            <p key={tip} className="flex items-start gap-2 text-muted-foreground">
              <span className="text-primary mt-0.5">•</span>
              <span>{tip}</span>
            </p>
          ))}
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="mt-4 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm">
            {warnings.map((warning, idx) => (
              <p key={idx} className="text-amber-700 dark:text-amber-200 flex items-start gap-1.5 mb-1 last:mb-0">
                <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                {warning}
              </p>
            ))}
          </div>
        )}

        <Link
          href="/policies"
          className="text-xs text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors"
        >
          View Leave Policy →
        </Link>
      </CardContent>
    </Card>
  );
}

// Current Balances Card Component - replaced with LeaveBalancePanel compact variant
function CurrentBalancesCard({
  balances,
  balancesLoading,
  balancesError,
}: {
  balances?: BalanceResponse;
  balancesLoading: boolean;
  balancesError: boolean;
}) {
  return (
    <Card className="rounded-2xl border-muted shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Leave Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <LeaveBalancePanel
          balances={balances ? fromBalanceResponse(balances) : []}
          variant="compact"
          showMeters={true}
          loading={balancesLoading}
          emptyState={
            balancesError ? (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Unable to load balances right now. You can still submit your request.
              </p>
            ) : undefined
          }
        />
      </CardContent>
    </Card>
  );
}
