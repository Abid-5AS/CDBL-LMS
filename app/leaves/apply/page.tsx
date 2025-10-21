"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import DatePicker from "@/components/date-picker";
import { countRequestedDays } from "@/lib/leave-days";
import { toast } from "sonner";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function ApplyLeavePage() {
  const router = useRouter();
  const [type, setType] = useState<string>("");
  const [start, setStart] = useState<Date | undefined>();
  const [end, setEnd] = useState<Date | undefined>();
  const [reason, setReason] = useState<string>("");
  const [hasCertificate, setHasCertificate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const requestedDays = useMemo(() => countRequestedDays(start, end), [start, end]);
  const needsCertificate = type === "ML" && requestedDays > 3;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
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

      if (needsCertificate && !hasCertificate) {
        toast.error("Medical leave over 3 days requires acknowledging the medical certificate.");
        return;
      }

      const payload = {
        type,
        start: start.toISOString(),
        end: end.toISOString(),
        reason: reason.trim(),
        certificate: needsCertificate ? true : hasCertificate,
      };

      setSubmitting(true);
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to submit leave");
        return;
      }

      toast.success("Leave submitted for approval");
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      toast.error("Network error submitting leave");
    } finally {
      setSubmitting(false);
    }
  }

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
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Leave Type</Label>
                  <Select onValueChange={(value) => { setType(value); setHasCertificate(false); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EL">Earned Leave</SelectItem>
                      <SelectItem value="CL">Casual Leave</SelectItem>
                      <SelectItem value="ML">Medical Leave</SelectItem>
                      <SelectItem value="EWP">Extraordinary (with pay)</SelectItem>
                      <SelectItem value="EWO">Extraordinary (without pay)</SelectItem>
                      <SelectItem value="MAT">Maternity Leave</SelectItem>
                      <SelectItem value="PAT">Paternity Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start">Start Date</Label>
                  <DatePicker id="start" value={start} onChange={setStart} placeholder="Start date" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end">End Date</Label>
                  <DatePicker id="end" value={end} onChange={setEnd} placeholder="End date" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="days">Requested Days</Label>
                  <Input id="days" readOnly value={requestedDays ? String(requestedDays) : ""} placeholder="Auto-calc" />
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

              {type === "ML" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      id="cert"
                      type="checkbox"
                      checked={hasCertificate}
                      onChange={(e) => setHasCertificate(e.target.checked)}
                    />
                    <label htmlFor="cert" className="text-sm">
                      I’ve attached a medical certificate.
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {requestedDays > 3
                      ? "Required: Medical leave over 3 days must include a certificate."
                      : "Optional: Attach supporting documents if available."}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Button type="submit" className="bg-[#2563EB] text-white" disabled={submitting}>
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
