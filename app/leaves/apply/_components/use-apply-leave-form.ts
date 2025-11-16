"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { policy } from "@/lib/policy";
import {
  totalDaysInclusive,
  rangeContainsNonWorking,
  isWeekendOrHoliday,
  normalizeToDhakaMidnight,
} from "@/lib/date-utils";
import { SUCCESS_MESSAGES, INFO_MESSAGES, getToastMessage } from "@/lib/toast-messages";
import { countWorkingDaysSync } from "@/lib/working-days";
import { useDraftAutosave } from "./use-draft-autosave";
import { useHolidays } from "./use-holidays";
import type { LeaveType } from "./leave-constants";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export type BalanceResponse = {
  year: number;
  CASUAL: number;
  EARNED: number;
  MEDICAL: number;
  MATERNITY?: number;
  PATERNITY?: number;
  STUDY?: number;
  SPECIAL?: number;
  SPECIAL_DISABILITY?: number;
  QUARANTINE?: number;
  EXTRAWITHPAY?: number;
  EXTRAWITHOUTPAY?: number;
};

export type DateRangeValue = {
  start: Date | undefined;
  end: Date | undefined;
};

type RangeValidationResult =
  | {
      valid: boolean;
      containsNonWorking?: boolean;
      message: string | null;
    }
  | null;

type FormErrors = {
  type?: string;
  start?: string;
  end?: string;
  reason?: string;
  file?: string;
  general?: string;
  incidentDate?: string; // For Special Disability Leave
};

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function useApplyLeaveForm() {
  const router = useRouter();
  const [type, setType] = useState<LeaveType>("EARNED");
  const [dateRange, setDateRange] = useState<DateRangeValue>({ start: undefined, end: undefined });
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showOptionalUpload, setShowOptionalUpload] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [showStickyButton, setShowStickyButton] = useState(false);
  const [incidentDate, setIncidentDate] = useState<Date | undefined>(undefined); // For Special Disability Leave

  const {
    data: balances,
    error: balancesError,
    isLoading: balancesLoading,
  } = useSWR<BalanceResponse>("/api/balance/mine", fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  const { holidays } = useHolidays();

  const { lastSaved, loadDraft, clearDraft } = useDraftAutosave({
    type,
    startDate: dateRange.start,
    endDate: dateRange.end,
    reason,
    fileName: file?.name || null,
  });

  useEffect(() => {
    if (draftLoaded) return;

    const draft = loadDraft();
    if (draft) {
      toast.info("Draft found. Click OK to restore your previous application.", {
        duration: 5000,
        action: {
          label: "Restore",
          onClick: () => {
            setType(draft.type as LeaveType);
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

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyButton(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const requestedDays = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return 0;
    return totalDaysInclusive(dateRange.start, dateRange.end);
  }, [dateRange]);

  const requiresCertificate = type === "MEDICAL" && requestedDays > 3;

  const minSelectableDate = useMemo(() => {
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

  const rangeValidation: RangeValidationResult = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return null;

    if (isWeekendOrHoliday(dateRange.start, holidays)) {
      return {
        valid: false,
        message: "Start date cannot be on Friday, Saturday, or a company holiday",
      };
    }

    if (isWeekendOrHoliday(dateRange.end, holidays)) {
      return {
        valid: false,
        message: "End date cannot be on Friday, Saturday, or a company holiday",
      };
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

  const warnings = useMemo(() => {
    const list: string[] = [];

    // Extraordinary Leave prerequisite check (Policy 6.26)
    if ((type === "EXTRAWITHPAY" || type === "EXTRAWITHOUTPAY") && hasBalanceData && balances) {
      const casualBalance = balances.CASUAL ?? 0;
      const earnedBalance = balances.EARNED ?? 0;
      const medicalBalance = balances.MEDICAL ?? 0;

      const THRESHOLDS = {
        CASUAL: 2,
        EARNED: 0,
        MEDICAL: 5,
      };

      const violations: string[] = [];

      if (casualBalance > THRESHOLDS.CASUAL) {
        violations.push(`Casual Leave: ${casualBalance} days remaining (threshold: ${THRESHOLDS.CASUAL})`);
      }
      if (earnedBalance > THRESHOLDS.EARNED) {
        violations.push(`Earned Leave: ${earnedBalance} days remaining (threshold: ${THRESHOLDS.EARNED})`);
      }
      if (medicalBalance > THRESHOLDS.MEDICAL) {
        violations.push(`Medical Leave: ${medicalBalance} days remaining (threshold: ${THRESHOLDS.MEDICAL})`);
      }

      if (violations.length > 0) {
        list.push(
          `Policy 6.26: Extraordinary Leave can only be taken when no other leave is due. You still have: ${violations.join(", ")}. Please use your other leaves first.`
        );
      }
    }

    if (type === "CASUAL" && requestedDays > policy.clMaxConsecutiveDays) {
      list.push(`Casual Leave cannot exceed ${policy.clMaxConsecutiveDays} consecutive days.`);
    }

    if (type === "EARNED" && dateRange.start) {
      const today = normalizeToDhakaMidnight(new Date());
      const startDate = normalizeToDhakaMidnight(dateRange.start);
      const workingDaysUntil = countWorkingDaysSync(today, startDate, holidays);
      if (workingDaysUntil < policy.elMinNoticeDays && workingDaysUntil >= 0) {
        list.push(
          `Earned Leave requires at least ${policy.elMinNoticeDays} working days advance notice (you have ${workingDaysUntil} working days).`
        );
      }
    }

    if (type === "CASUAL" && dateRange.start && dateRange.end) {
      const startTouches = isWeekendOrHoliday(dateRange.start, holidays);
      const endTouches = isWeekendOrHoliday(dateRange.end, holidays);
      if (startTouches || endTouches) {
        list.push(
          "Casual Leave cannot start or end on Friday, Saturday, or a company holiday. Please use Earned Leave instead."
        );
      }
    }

    if (requiresCertificate && !file) {
      list.push("Attach medical certificate for Sick Leave over 3 days.");
    }

    return list;
  }, [type, requestedDays, requiresCertificate, file, dateRange, holidays, hasBalanceData, balances]);

  useEffect(() => {
    if (!dateRange.start) return;
    if (minSelectableDate && dateRange.start < minSelectableDate) {
      setDateRange({ start: undefined, end: undefined });
      toast.warning("Those dates are not allowed for this leave type. Please pick a new range.");
    }
  }, [type, minSelectableDate, dateRange.start]);

  const handleFileError = (error: string) => {
    setErrors((prev) => ({ ...prev, file: error }));
    toast.error(error);
  };

  const handleTypeChange = (value: LeaveType) => {
    setType(value);
    setFile(null);
    setShowOptionalUpload(false);
    setIncidentDate(undefined); // Reset incident date when changing leave type
    setErrors((prev) => ({ ...prev, type: undefined, incidentDate: undefined }));
  };

  const clearErrors = () => {
    setErrors({});
  };

  const validateForm = () => {
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

    // Validate Extraordinary Leave prerequisite (Policy 6.26)
    if ((type === "EXTRAWITHPAY" || type === "EXTRAWITHOUTPAY") && hasBalanceData && balances) {
      const casualBalance = balances.CASUAL ?? 0;
      const earnedBalance = balances.EARNED ?? 0;
      const medicalBalance = balances.MEDICAL ?? 0;

      const THRESHOLDS = {
        CASUAL: 2,
        EARNED: 0,
        MEDICAL: 5,
      };

      const violations: string[] = [];

      if (casualBalance > THRESHOLDS.CASUAL) {
        violations.push(`Casual Leave: ${casualBalance} days`);
      }
      if (earnedBalance > THRESHOLDS.EARNED) {
        violations.push(`Earned Leave: ${earnedBalance} days`);
      }
      if (medicalBalance > THRESHOLDS.MEDICAL) {
        violations.push(`Medical Leave: ${medicalBalance} days`);
      }

      if (violations.length > 0) {
        newErrors.general = `Cannot apply for Extraordinary Leave. You still have: ${violations.join(", ")}. Please use your other leaves first (Policy 6.26).`;
      }
    }

    if (requiresCertificate && !file) {
      newErrors.file = "Medical certificate is required for sick leave over 3 days";
    }

    // Validate incident date for Special Disability Leave
    if (type === "SPECIAL_DISABILITY") {
      if (!incidentDate) {
        newErrors.incidentDate = "Incident date is required for Special Disability Leave";
      } else if (dateRange.start) {
        // Check if incident date is within 3 months before start date
        const threeMonthsAgo = new Date(dateRange.start);
        threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);

        if (incidentDate < threeMonthsAgo) {
          newErrors.incidentDate = "Incident must have occurred within 3 months of leave start date";
        } else if (incidentDate > dateRange.start) {
          newErrors.incidentDate = "Incident date cannot be after leave start date";
        } else if (incidentDate > new Date()) {
          newErrors.incidentDate = "Incident date cannot be in the future";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const initiateReview = () => {
    if (submitting) return false;

    if (!validateForm()) {
      toast.error(getToastMessage("validation_error", "Please fix the errors in the form"));
      return false;
    }

    setShowConfirmModal(true);
    return true;
  };

  const handleReviewSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    initiateReview();
  };

  const handleConfirmSubmit = async () => {
    if (!dateRange.start || !dateRange.end || submitting) return;

    // Close modal immediately to prevent multiple clicks
    setShowConfirmModal(false);
    setSubmitting(true);

    try {
      const payload: any = {
        type,
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
        reason: reason.trim(),
        needsCertificate: requiresCertificate,
      };

      // Add incident date for Special Disability Leave
      if (type === "SPECIAL_DISABILITY" && incidentDate) {
        payload.incidentDate = incidentDate.toISOString();
      }

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
        const errorMessage = getToastMessage(
          data?.error || "Unable to submit request",
          data?.message
        );
        toast.error(errorMessage);
        setSubmitting(false);
        return;
      }

      // Clear draft and show success
      clearDraft();

      // Show success message with request ID if available
      const requestId = data?.id || data?.leaveId;
      if (requestId) {
        toast.success(SUCCESS_MESSAGES.leave_submitted, {
          description: `Request ID: #${requestId}. You can track its status in your leave history.`,
          duration: 5000,
        });
        // Redirect to the specific leave request details page
        router.push(`/leaves/${requestId}`);
      } else {
        toast.success(SUCCESS_MESSAGES.leave_submitted);
        router.push("/leaves");
      }
    } catch (error) {
      console.error(error);
      toast.error(getToastMessage("network_error", "Network error. Please try again."));
      setSubmitting(false);
    }
  };

  const lastSavedTime = lastSaved
    ? lastSaved.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    : null;

  const projectedBalancePercent =
    balanceForType > 0
      ? Math.max(0, Math.min(100, (remainingBalance / balanceForType) * 100))
      : 0;

  // Calculate pay breakdown for Special Disability Leave
  const payCalculation = useMemo(() => {
    if (type !== "SPECIAL_DISABILITY" || requestedDays <= 0) return null;

    const FULL_PAY_THRESHOLD = 90;
    const HALF_PAY_THRESHOLD = 180;

    let fullPayDays = 0;
    let halfPayDays = 0;
    let unPaidDays = 0;

    if (requestedDays <= FULL_PAY_THRESHOLD) {
      fullPayDays = requestedDays;
    } else if (requestedDays <= HALF_PAY_THRESHOLD) {
      fullPayDays = FULL_PAY_THRESHOLD;
      halfPayDays = requestedDays - FULL_PAY_THRESHOLD;
    } else {
      fullPayDays = FULL_PAY_THRESHOLD;
      halfPayDays = HALF_PAY_THRESHOLD - FULL_PAY_THRESHOLD;
      unPaidDays = requestedDays - HALF_PAY_THRESHOLD;
    }

    return { fullPayDays, halfPayDays, unPaidDays, totalDays: requestedDays };
  }, [type, requestedDays]);

  return {
    type,
    dateRange,
    reason,
    file,
    submitting,
    showConfirmModal,
    showOptionalUpload,
    showStickyButton,
    errors,
    balances,
    balancesError,
    balancesLoading,
    requestedDays,
    requiresCertificate,
    minSelectableDate,
    rangeValidation,
    warnings,
    balanceForType,
    remainingBalance,
    lastSavedTime,
    projectedBalancePercent,
    holidays,
    incidentDate,
    payCalculation,
    setDateRange,
    setReason,
    setFile,
    setShowOptionalUpload,
    setShowConfirmModal,
    setIncidentDate,
    setErrors,
    handleFileError,
    handleTypeChange,
    clearErrors,
    handleReviewSubmit,
    handleConfirmSubmit,
    initiateReview,
  };
}
