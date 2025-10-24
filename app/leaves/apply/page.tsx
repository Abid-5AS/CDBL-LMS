"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import DatePicker from "@/components/date-picker";
import { countRequestedDays } from "@/lib/leave-days";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { leaveTypeLabel } from "@/lib/ui";

type LeaveType = keyof typeof leaveTypeLabel;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_FILE_REGEX = /\.(pdf|png|jpe?g)$/i;
const MAX_BACKDATE_DAYS = 30;

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function ApplyLeavePage() {
  const router = useRouter();
  const [type, setType] = useState<LeaveType | undefined>(undefined);
  const [start, setStart] = useState<Date | undefined>();
  const [end, setEnd] = useState<Date | undefined>();
  const [reason, setReason] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const requestedDays = useMemo(() => countRequestedDays(start, end), [start, end]);
  const isMedical = type === "MEDICAL";
  const requiresCertificate = isMedical && requestedDays > 3;
  const today = useMemo(() => startOfDay(new Date()), []);

  const minAllowedDate = useMemo(() => {
    if (type === "MEDICAL" || type === "EARNED") {
      const d = new Date(today);
      d.setDate(d.getDate() - MAX_BACKDATE_DAYS);
      return startOfDay(d);
    }
    return today;
  }, [type, today]);

  const disableDate = (date: Date) => {
    const day = startOfDay(date);
    if (day < minAllowedDate) return true;
    return false;
  };

  const resetFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleTypeChange = (value: string) => {
    setType(value as LeaveType);
    if (value !== "MEDICAL") {
      resetFile();
    }
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

    if (!type) {
      toast.error("Please select a leave type.");
      return;
    }

    if (!start || !end) {
      toast.error("Please select both start and end dates.");
      return;
    }

    if (!reason.trim()) {
      toast.error("Please provide a reason.");
      return;
    }

    try {
      setSubmitting(true);

      const leaveType = type;

      const payload = {
        type: leaveType,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        reason: reason.trim(),
        needsCertificate: requiresCertificate,
      };

      let response: Response;

      if (file) {
        const formData = new FormData();
        formData.append("type", payload.type);
        formData.append("startDate", payload.startDate);
        formData.append("endDate", payload.endDate);
        formData.append("reason", payload.reason);
        formData.append("needsCertificate", String(payload.needsCertificate));
        formData.append("certificate", file, file.name);
        response = await fetch("/api/leaves", {
          method: "POST",
          body: formData,
          credentials: "same-origin",
        });
      } else {
        response = await fetch("/api/leaves", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "same-origin",
        });
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const code: string | undefined = data?.error;
        switch (code) {
          case "unauthorized":
            toast.error("You must be signed in to apply for leave.");
            break;
          case "unknown user":
          case "unknown_user":
            toast.error("We couldn't find your profile. Please sign in again.");
            break;
          case "invalid_dates":
            toast.error("Please choose valid start and end dates.");
            break;
          case "backdate_disallowed":
            toast.error("This leave type can't be backdated.");
            break;
          case "backdate_window_exceeded":
            toast.error("The backdate window has been exceeded for this leave type.");
            break;
          case "insufficient_balance":
            toast.error("You don't have enough balance for this leave type.");
            break;
          case "unsupported_file_type":
            toast.error("Unsupported file type. Use PDF, JPG, or PNG.");
            break;
          case "file_too_large":
            toast.error("File too large (max 5 MB).");
            break;
          default:
            toast.error(data?.error ?? "Failed to submit leave");
        }
        return;
      }

      if (data?.warnings?.clShortNotice) {
        toast("Short notice", {
          description:
            "Casual Leave requested with less than 5 days' notice. Recorded as a warning.",
        });
      }
      if (data?.warnings?.mlNeedsCertificate || requiresCertificate) {
        toast("Medical certificate required", {
          description: "Medical Leave over 3 days requires a certificate per policy.",
        });
      }

      toast.success("Leave submitted for approval");
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      toast.error("Network error submitting leave");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Apply Leave</h1>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">
            ← Back to Dashboard
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Leave Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <Label>Leave Type</Label>
                  <Select value={type} onValueChange={(value) => handleTypeChange(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(leaveTypeLabel).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <p className="text-sm font-medium">Dates</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start">Start Date</Label>
                      <DatePicker
                        id="start"
                        value={start}
                        onChange={setStart}
                        placeholder="Start date"
                        disabled={disableDate}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end">End Date</Label>
                      <DatePicker
                        id="end"
                        value={end}
                        onChange={setEnd}
                        placeholder="End date"
                        disabled={disableDate}
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="days">Requested Days</Label>
                  <Input
                    id="days"
                    readOnly
                    value={requestedDays ? String(requestedDays) : ""}
                    placeholder="Auto-calc"
                  />
                  <p className="text-xs text-muted-foreground">
                    Preview only — final days are calculated by HR policy on submission.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Brief reason for leave…"
                />
              </div>

              {isMedical && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Medical certificate</p>
                  <p className="text-xs text-muted-foreground">
                    Required if the requested leave spans more than 3 working days (per policy). Accepted formats: PDF, JPG, PNG.
                  </p>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                  />
                  {file ? (
                    <p className="text-xs text-muted-foreground">
                      Selected file: <span className="font-medium">{file.name}</span>
                    </p>
                  ) : null}
                </div>
              )}

              <div className="flex items-center gap-3">
                <Button type="submit" className="bg-[#2563EB] hover:bg-[#1E40AF] text-white" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Request"}
                </Button>
                <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">
                  Cancel
                </Link>
              </div>
            </form>
          </CardContent>
          <CardFooter />
        </Card>
      </div>
    </div>
  );
}
