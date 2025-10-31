// This is a reference copy of the web app's leave form component
// Located at: app/leaves/apply/_components/apply-leave-form.tsx
// Use this to ensure iOS form matches web app implementation

"use client";

import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import DatePicker from "@/components/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, X, FileText, CheckCircle2 } from "lucide-react";
import { countRequestedDays } from "@/lib/leave-days";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_FILE_REGEX = /(\.pdf|\.png|\.jpe?g)$/i;

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
  CASUAL: ["Max 7 consecutive days", "Must retain 5 days balance"],
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
  const [start, setStart] = useState<Date | undefined>();
  const [end, setEnd] = useState<Date | undefined>();
  const [reason, setReason] = useState("Meeting family obligations");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    data: balances,
    error: balancesError,
    isLoading: balancesLoading,
  } = useSWR<BalanceResponse>("/api/balance/mine", fetcher);

  const requestedDays = useMemo(() => countRequestedDays(start, end), [start, end]);
  const requiresCertificate = type === "MEDICAL" && requestedDays > 3;

  const minSelectableDate = useMemo(() => {
    if (type === "MEDICAL" || type === "EARNED") {
      const today = startOfDay(new Date());
      today.setDate(today.getDate() - 30);
      return today;
    }
    return startOfDay(new Date());
  }, [type]);

  const disableDate = (date: Date) => startOfDay(date) < minSelectableDate;

  const hasBalanceData = Boolean(balances) && !balancesError;
  const balanceForType = hasBalanceData ? balances?.[type] ?? 0 : 0;
  const remainingBalance = balanceForType - (requestedDays || 0);

  const summaryItems = [
    { label: "Leave Type", value: LEAVE_OPTIONS.find((o) => o.value === type)?.label ?? "—" },
    {
      label: "Duration",
      value: requestedDays > 0 && start && end ? `${requestedDays} day(s) (${formatDate(start)} → ${formatDate(end)})` : "Select dates",
    },
    {
      label: "Projected Balance",
      value: balancesLoading ? "Loading..." : balancesError ? "Unavailable" : `${Math.max(remainingBalance, 0)} day(s)`,
    },
  ];

  const warnings: string[] = [];
  if (type === "CASUAL" && requestedDays > 7) warnings.push("Casual Leave cannot exceed 7 consecutive days.");
  if (type === "EARNED") warnings.push("Earned Leave requires 15 days' advance notice.");
  if (requiresCertificate) warnings.push("Attach medical certificate for Sick Leave over 3 days.");

  const resetFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTypeChange = (value: LeaveType) => {
    setType(value);
    if (value !== "MEDICAL") resetFile();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) {
      setFile(null);
      setErrors((prev) => ({ ...prev, file: undefined }));
      return;
    }
    let fileError: string | undefined;
    if (!ACCEPTED_FILE_REGEX.test(selected.name)) {
      fileError = "Unsupported file type. Use PDF, JPG, or PNG.";
    } else if (selected.size > MAX_FILE_SIZE) {
      fileError = "File too large (max 5 MB).";
    }
    
    if (fileError) {
      setErrors((prev) => ({ ...prev, file: fileError }));
      event.target.value = "";
      toast.error(fileError);
      return;
    }
    
    setFile(selected);
    setErrors((prev) => ({ ...prev, file: undefined }));
  };

  const clearErrors = () => {
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!start) {
      newErrors.start = "Start date is required";
    }
    
    if (!end) {
      newErrors.end = "End date is required";
    }
    
    if (start && end) {
      if (start > end) {
        newErrors.end = "End date must be on or after start date";
      } else if (requestedDays <= 0) {
        newErrors.end = "Invalid date range";
      }
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    if (!start || !end) {
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        type,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
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

      toast.success("Leave submitted for approval");
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Form JSX structure matches the web app layout
  // See full implementation for complete component structure
}

