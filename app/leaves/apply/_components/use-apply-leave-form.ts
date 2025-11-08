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
  }, [type, requestedDays, requiresCertificate, file, dateRange, holidays]);

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

    if (requiresCertificate && !file) {
      newErrors.file = "Medical certificate is required for sick leave over 3 days";
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
        const errorMessage = getToastMessage(
          data?.error || "Unable to submit request",
          data?.message
        );
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

  const lastSavedTime = lastSaved
    ? lastSaved.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    : null;

  const projectedBalancePercent =
    balanceForType > 0
      ? Math.max(0, Math.min(100, (remainingBalance / balanceForType) * 100))
      : 0;

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
    setDateRange,
    setReason,
    setFile,
    setShowOptionalUpload,
    setShowConfirmModal,
    handleFileError,
    handleTypeChange,
    clearErrors,
    handleReviewSubmit,
    handleConfirmSubmit,
    initiateReview,
  };
}
