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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AlertCircle, FileText, Clock, Info, HelpCircle } from "lucide-react";
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
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/leaves">Leaves</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Apply</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Main grid: 65% form, 35% summary */}
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          {/* LEFT: Form Section (65%) */}
          <div className="space-y-6">
            <Card className="rounded-2xl border-muted shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl">New Leave Application</CardTitle>
                <CardDescription>
                  Select leave type, duration, and add a short reason. Attach supporting documents when necessary.
                </CardDescription>
                {lastSavedTime && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                    <Clock className="h-3 w-3" />
                    <span>Last saved at {lastSavedTime}</span>
                  </div>
                )}
              </CardHeader>

              <form onSubmit={handleReviewClick} noValidate aria-label="Leave application form">
                <CardContent className="space-y-6">
                  {/* Leave Type */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="leave-type" className="text-sm font-medium">
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
                      <Label htmlFor="leave-dates" className="text-sm font-medium">
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

                  {/* Reason Textarea */}
                  <div className="space-y-2">
                    <Label htmlFor="reason" className="text-sm font-medium">
                      Reason <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="reason"
                      value={reason}
                      onChange={(event) => {
                        setReason(event.target.value);
                        setErrors((prev) => ({ ...prev, reason: undefined }));
                      }}
                      placeholder="Family event, personal errand, medical follow-up..."
                      rows={6}
                      className={cn(
                        "min-h-[120px] resize-y",
                        errors.reason && "border-destructive focus-visible:ring-destructive"
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
                      className="text-sm text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      Add supporting document (optional)
                    </button>
                  )}

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

                <CardFooter className="flex justify-end gap-3 pt-6 border-t">
                  <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Submitting..." : "Review Application"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          {/* RIGHT: Summary Section (35%) - Sticky on desktop, accordion on mobile */}
          <aside className="lg:sticky lg:top-6 lg:h-fit space-y-4">
            {/* Mobile: Accordion wrapper */}
            <div className="lg:hidden">
              <Accordion type="single" collapsible defaultValue="summary">
                <AccordionItem value="summary" className="border-none">
                  <AccordionTrigger className="text-base font-semibold px-0">
                    Show Summary
                  </AccordionTrigger>
                  <AccordionContent className="px-0 space-y-4">
                    <LeaveSummaryCard
                      type={type}
                      requestedDays={requestedDays}
                      remainingBalance={remainingBalance}
                      balancesLoading={balancesLoading}
                      balancesError={balancesError}
                      projectedBalancePercent={projectedBalancePercent}
                      warnings={warnings}
                    />
                    <CurrentBalancesCard
                      balances={balances}
                      balancesLoading={balancesLoading}
                      balancesError={balancesError}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Desktop: Always visible */}
            <div className="hidden lg:block space-y-4">
              <LeaveSummaryCard
                type={type}
                requestedDays={requestedDays}
                remainingBalance={remainingBalance}
                balancesLoading={balancesLoading}
                balancesError={balancesError}
                projectedBalancePercent={projectedBalancePercent}
                warnings={warnings}
              />
              <CurrentBalancesCard
                balances={balances}
                balancesLoading={balancesLoading}
                balancesError={balancesError}
              />
            </div>
          </aside>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-muted text-center text-xs text-muted-foreground">
          <p>
            {lastSavedTime && (
              <span>Last saved at {lastSavedTime} • </span>
            )}
            Policy v2.0 • © CDBL HRD
          </p>
        </footer>
      </div>

      {/* Sticky Review Button (visible on scroll) */}
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
            className="shadow-lg"
          >
            {submitting ? "Submitting..." : "Review Application"}
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

// Current Balances Card Component
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
          Current Balances
        </CardTitle>
      </CardHeader>
      <CardContent>
        {balancesLoading ? (
          <div className="space-y-2">
            <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        ) : balancesError ? (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Unable to load balances right now. You can still submit your request.
          </p>
        ) : (
          <ul className="space-y-3 text-sm">
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Casual</span>
              <span className="font-semibold text-foreground">{balances?.CASUAL ?? "—"} days</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Medical</span>
              <span className="font-semibold text-foreground">{balances?.MEDICAL ?? "—"} days</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Earned</span>
              <span className="font-semibold text-foreground">{balances?.EARNED ?? "—"} days</span>
            </li>
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
