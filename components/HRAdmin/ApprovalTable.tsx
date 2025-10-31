"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { submitApprovalDecision } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { HRApprovalItem } from "./types";
import { FilterBar } from "@/components/filters/FilterBar";
import { leaveTypeLabel } from "@/lib/ui";

type ApprovalsResponse = { items: HRApprovalItem[] };

type ApprovalTableProps = {
  onSelect?: (item: HRApprovalItem) => void;
  onDataChange?: (items: HRApprovalItem[]) => void;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function statusStyle(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === "APPROVED") return "bg-emerald-50";
  if (normalized === "REJECTED") return "bg-rose-50";
  return "hover:bg-slate-50";
}

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "SUBMITTED", label: "Submitted" },
];

const TYPE_OPTIONS = [
  { value: "EARNED", label: "Earned Leave" },
  { value: "CASUAL", label: "Casual Leave" },
  { value: "MEDICAL", label: "Medical Leave" },
  { value: "EXTRAWITHPAY", label: "Extra with Pay" },
  { value: "EXTRAWITHOUTPAY", label: "Extra without Pay" },
];

export function ApprovalTable({ onSelect, onDataChange }: ApprovalTableProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data, error, isLoading, mutate } = useSWR<ApprovalsResponse>("/api/approvals", fetcher, {
    revalidateOnFocus: true,
  });

  const allItems = useMemo(() => (Array.isArray(data?.items) ? data!.items : []), [data]);

  const items = useMemo(() => {
    let filtered = allItems;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.requestedByName?.toLowerCase().includes(query) ||
          item.requestedByEmail?.toLowerCase().includes(query) ||
          item.type.toLowerCase().includes(query) ||
          (leaveTypeLabel[item.type]?.toLowerCase().includes(query) ?? false) ||
          item.reason?.toLowerCase().includes(query) ||
          formatDate(item.start).toLowerCase().includes(query) ||
          formatDate(item.end).toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((item) => item.type === typeFilter);
    }

    return filtered;
  }, [allItems, searchQuery, statusFilter, typeFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
  };

  useEffect(() => {
    if (onDataChange) {
      onDataChange(items);
    }
  }, [items, onDataChange]);

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
    <div className="space-y-4">
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by employee, type, reason, or date..."
        statusFilter={{
          value: statusFilter,
          onChange: setStatusFilter,
          options: STATUS_OPTIONS,
        }}
        typeFilter={{
          value: typeFilter,
          onChange: setTypeFilter,
          options: TYPE_OPTIONS,
        }}
        onClear={clearFilters}
      />

      {items.length === 0 && allItems.length > 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No requests match your filters. Try adjusting your search criteria.
          </CardContent>
        </Card>
      ) : (
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
              const start = formatDate(item.start);
              const end = formatDate(item.end);
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
                  <TableCell className="text-sm text-slate-600">{leaveTypeLabel[item.type] ?? item.type}</TableCell>
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
      )}
      {items.length !== allItems.length && allItems.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {items.length} of {allItems.length} requests
        </p>
      )}
    </div>
  );
}
