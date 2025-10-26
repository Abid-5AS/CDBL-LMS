"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { submitApprovalDecision } from "@/lib/api";
import { HRApprovalItem } from "./types";

type ApprovalsResponse = { items: HRApprovalItem[] };

type ApprovalTableProps = {
  onSelect?: (item: HRApprovalItem) => void;
  onDataChange?: (items: HRApprovalItem[], refresh: () => void) => void;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function statusStyle(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === "APPROVED") return "bg-emerald-50";
  if (normalized === "REJECTED") return "bg-rose-50";
  return "hover:bg-slate-50";
}

export function ApprovalTable({ onSelect, onDataChange }: ApprovalTableProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { data, error, isLoading, mutate } = useSWR<ApprovalsResponse>("/api/approvals", fetcher, {
    revalidateOnFocus: true,
  });

  const items = useMemo(() => (Array.isArray(data?.items) ? data!.items : []), [data]);

  useEffect(() => {
    if (onDataChange) {
      onDataChange(items, () => mutate());
    }
  }, [items, mutate, onDataChange]);

  async function handleDecision(id: string, action: "approve" | "reject") {
    try {
      setProcessingId(id + action);
      await submitApprovalDecision(id, action);
      toast.success(`Request ${action === "approve" ? "approved" : "rejected"}`);
      await mutate();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update request";
      toast.error(message);
    } finally {
      setProcessingId(null);
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">Loading approvals…</CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-red-600">
          Unable to load approval queue. Please try again.
        </CardContent>
      </Card>
    );
  }

  if (!items.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No pending requests. You are all caught up!
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const start = item.start ? new Date(item.start).toLocaleDateString() : "—";
              const end = item.end ? new Date(item.end).toLocaleDateString() : "—";
              const stage = item.approvals?.[item.currentStageIndex]?.status ?? item.status;
              return (
                <TableRow
                  key={item.id}
                  className={`cursor-pointer transition ${statusStyle(item.status)}`}
                  onClick={() => onSelect?.(item)}
                >
                  <TableCell>
                    <div className="font-medium text-slate-900">{item.requestedByName ?? "Unknown"}</div>
                    <div className="text-xs text-muted-foreground">{item.requestedByEmail ?? "—"}</div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">{item.type}</TableCell>
                  <TableCell className="text-sm text-slate-600">
                    <div>{start}</div>
                    {start !== end && <div className="text-xs text-muted-foreground">to {end}</div>}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">{item.requestedDays}</TableCell>
                  <TableCell className="max-w-xs text-sm text-slate-600">
                    <p className="whitespace-pre-wrap break-words">{item.reason}</p>
                  </TableCell>
                  <TableCell className="text-sm font-medium capitalize text-slate-700">{stage.toLowerCase()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDecision(item.id, "approve");
                        }}
                        disabled={processingId !== null}
                      >
                        {processingId === item.id + "approve" ? "Approving..." : "Approve"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDecision(item.id, "reject");
                        }}
                        disabled={processingId !== null}
                      >
                        {processingId === item.id + "reject" ? "Rejecting..." : "Reject"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
