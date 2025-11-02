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

    // Type guards: validateForm ensures these are defined, but TypeScript needs explicit checks
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

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" noValidate aria-label="Leave application form">
      <div className="space-y-6">
        <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/30 dark:border-white/10 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">New Leave Application</h2>
          <p className="text-sm text-muted-foreground">
            Select leave type, duration, and add a short reason. Attach supporting documents when necessary.
          </p>
        </div>

        <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/30 dark:border-white/10 rounded-xl p-6 shadow-sm space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-900">
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-900">
                Start Date <span className="text-red-500">*</span>
              </Label>
              <DatePicker 
                value={start} 
                onChange={(date) => {
                  setStart(date);
                  setErrors((prev) => ({ ...prev, start: undefined }));
                }} 
                disabled={disableDate} 
                className={cn("w-full", errors.start && "border-red-500")}
                aria-label="Start date"
                aria-required="true"
                aria-invalid={!!errors.start}
                aria-describedby={errors.start ? "start-error" : undefined}
              />
              {errors.start && (
                <p id="start-error" className="text-sm text-red-600 flex items-center gap-1" role="alert">
                  <AlertCircle className="h-3 w-3" aria-hidden="true" />
                  {errors.start}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-900">
                End Date <span className="text-red-500">*</span>
              </Label>
              <DatePicker 
                value={end} 
                onChange={(date) => {
                  setEnd(date);
                  setErrors((prev) => ({ ...prev, end: undefined }));
                }} 
                disabled={disableDate} 
                className={cn("w-full", errors.end && "border-red-500")}
                aria-label="End date"
                aria-required="true"
                aria-invalid={!!errors.end}
                aria-describedby={errors.end ? "end-error" : undefined}
              />
              {errors.end && (
                <p id="end-error" className="text-sm text-red-600 flex items-center gap-1" role="alert">
                  <AlertCircle className="h-3 w-3" aria-hidden="true" />
                  {errors.end}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-900">
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

          {requiresCertificate ? (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-900">
                Medical Certificate <span className="text-red-500">*</span>
                <span className="text-xs font-normal text-muted-foreground ml-1">(PDF, JPG, PNG, max 5MB)</span>
              </Label>
              {!file ? (
                <Input 
                  ref={fileInputRef} 
                  type="file" 
                  accept=".pdf,image/*" 
                  onChange={handleFileChange}
                  className={cn(errors.file && "border-red-500")}
                  aria-label="Medical certificate file"
                  aria-required="true"
                  aria-invalid={!!errors.file}
                  aria-describedby={errors.file ? "file-error" : undefined}
                />
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50" role="status" aria-live="polite">
                  <FileText className="h-5 w-5 text-blue-600" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      resetFile();
                      setErrors((prev) => ({ ...prev, file: undefined }));
                    }}
                    className="h-8 w-8 p-0"
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              )}
              {errors.file && (
                <p id="file-error" className="text-sm text-red-600 flex items-center gap-1" role="alert">
                  <AlertCircle className="h-3 w-3" aria-hidden="true" />
                  {errors.file}
                </p>
              )}
            </div>
          ) : null}

          {errors.general && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Validation Error</p>
                <p className="text-sm text-red-700 mt-0.5">{errors.general}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Applying..." : "Apply Leave"}
            </Button>
          </div>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/30 dark:border-white/10 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Leave Summary</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {summaryItems.map((item) => (
              <li key={item.label} className="flex items-center justify-between gap-3">
                <span className="text-slate-500">{item.label}</span>
                <span className="font-medium text-slate-900 text-right">{item.value}</span>
              </li>
            ))}
          </ul>
          <hr className="my-4" />
          <div className="space-y-2 text-sm text-slate-600">
            {RULE_TIPS[type].map((tip) => (
              <p key={tip} className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                {tip}
              </p>
            ))}
          </div>
          {warnings.length > 0 ? (
            <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700">
              {warnings.map((warning) => (
                <p key={warning}>&middot; {warning}</p>
              ))}
            </div>
          ) : null}
        </div>

        <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/30 dark:border-white/10 rounded-xl p-6 shadow-sm text-sm text-slate-600 dark:text-slate-300">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Balances</h4>
          <p className="mt-2">Current year balances</p>
          {balancesLoading ? (
            <div className="mt-3 space-y-2">
              <div className="h-3 w-3/4 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
            </div>
          ) : balancesError ? (
            <p className="mt-3 text-sm text-amber-600">
              Unable to load balances right now. You can still submit your request.
            </p>
          ) : (
            <ul className="mt-3 space-y-1">
              <li>Casual: {balances?.CASUAL ?? "—"} days</li>
              <li>Sick: {balances?.MEDICAL ?? "—"} days</li>
              <li>Earned: {balances?.EARNED ?? "—"} days</li>
            </ul>
          )}
        </div>
      </aside>
    </form>
  );
}
