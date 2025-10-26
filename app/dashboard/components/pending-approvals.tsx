"use client";

import useSWR from "swr";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type PendingLeave = {
  id: string;
  type: string;
  requestedDays: number;
  requestedByName?: string | null;
  start?: string | null;
  end?: string | null;
};

export function PendingApprovals({ role }: { role: string }) {
  const normalizedRole = (role ?? "").toUpperCase();
  const isHrAdmin = normalizedRole === "HR_ADMIN";
  const { data, isLoading, error, mutate } = useSWR(
    isHrAdmin ? `/api/approvals` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const act = async (id: string, action: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch(`/api/approvals/${id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: action === "APPROVED" ? "approve" : "reject" }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(payload?.error ?? `Failed to ${action.toLowerCase()} request`);
        return;
      }
      toast.success(`Leave ${action === "APPROVED" ? "approved" : "rejected"}`);
      await mutate();
    } catch {
      toast.error("Unable to update request");
    }
  };

  if (!isHrAdmin) return null;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Loading approvals…</CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-red-600">Failed to load approval queue.</CardContent>
      </Card>
    );
  }

  const rows: PendingLeave[] = Array.isArray(data?.items) ? data.items : [];
  if (!rows.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Approvals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((leave) => {
          const period =
            leave.start && leave.end ? `${formatDate(leave.start)} → ${formatDate(leave.end)}` : null;
          return (
            <div key={leave.id} className="flex flex-col gap-2 rounded border p-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="font-medium">{leave.requestedByName ?? "Unknown employee"}</div>
                <div className="text-sm text-muted-foreground">
                  {leave.type} • {leave.requestedDays} day{leave.requestedDays === 1 ? "" : "s"}
                  {period ? <> • {period}</> : null}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => act(leave.id, "APPROVED")}>
                  Approve
                </Button>
                <Button size="sm" variant="destructive" onClick={() => act(leave.id, "REJECTED")}>
                  Reject
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
