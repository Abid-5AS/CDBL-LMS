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
import { countRequestedDays } from "@/lib/leave-days";
import { formatDate } from "@/lib/utils";

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

export function ApplyLeaveForm() {
  const router = useRouter();
  const [type, setType] = useState<LeaveType>("CASUAL");
  const [start, setStart] = useState<Date | undefined>();
  const [end, setEnd] = useState<Date | undefined>();
  const [reason, setReason] = useState("Meeting family obligations");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
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
      return;
    }
    if (!ACCEPTED_FILE_REGEX.test(selected.name)) {
      toast.error("Unsupported file type. Use PDF, JPG, or PNG.");
      event.target.value = "";
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      toast.error("File too large (max 5 MB).");
      event.target.value = "";
      return;
    }
    setFile(selected);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    if (!start || !end) {
      toast.error("Select both start and end dates.");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please provide a reason for your leave.");
      return;
    }
    if (requestedDays <= 0) {
      toast.error("End date must be on or after start date.");
      return;
    }
    if (hasBalanceData && remainingBalance < 0) {
      toast.error("Insufficient balance for this leave type.");
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
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">New Leave Application</h2>
          <p className="text-sm text-muted-foreground">
            Select leave type, duration, and add a short reason. Attach supporting documents when necessary.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="space-y-2">
            <Label className="text-sm text-slate-600">Leave Type</Label>
            <Select value={type} onValueChange={(value) => handleTypeChange(value as LeaveType)}>
              <SelectTrigger className="h-10">
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm text-slate-600">Start Date</Label>
              <DatePicker value={start} onChange={setStart} disabled={disableDate} className="w-full" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-slate-600">End Date</Label>
              <DatePicker value={end} onChange={setEnd} disabled={disableDate} className="w-full" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-slate-600">Reason</Label>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Family event, personal errand, medical follow-up..."
              className="min-h-[120px]"
            />
          </div>

          {requiresCertificate ? (
            <div className="space-y-2">
              <Label className="text-sm text-slate-600">Medical Certificate (PDF/JPG/PNG)</Label>
              <Input ref={fileInputRef} type="file" accept=".pdf,image/*" onChange={handleFileChange} />
            </div>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Leave Summary</h3>
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

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-sm text-slate-600">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Balances</h4>
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
