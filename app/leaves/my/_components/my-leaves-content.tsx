"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ClipboardCheck, Plus } from "lucide-react";
import StatusBadge from "@/app/dashboard/components/status-badge";
import { leaveTypeLabel } from "@/lib/ui";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import useSWR from "swr";
import { FilterBar } from "@/components/filters/FilterBar";

type LeaveRow = {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  status: "SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  updatedAt: string;
  reason?: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const CANCELABLE_STATUSES = new Set<LeaveRow["status"]>(["SUBMITTED", "PENDING"]);

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "CANCELLED", label: "Cancelled" },
];

const TYPE_OPTIONS = [
  { value: "EARNED", label: "Earned Leave" },
  { value: "CASUAL", label: "Casual Leave" },
  { value: "MEDICAL", label: "Medical Leave" },
  { value: "EXTRAWITHPAY", label: "Extra with Pay" },
  { value: "EXTRAWITHOUTPAY", label: "Extra without Pay" },
  { value: "MATERNITY", label: "Maternity" },
  { value: "PATERNITY", label: "Paternity" },
];

export function MyLeavesContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data, isLoading, error, mutate } = useSWR<{ items: LeaveRow[] }>("/api/leaves?mine=1", fetcher, {
    revalidateOnFocus: false,
  });

  const allRows: LeaveRow[] = Array.isArray(data?.items) ? data.items : [];

  const filteredRows = useMemo(() => {
    let filtered = allRows;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (row) =>
          leaveTypeLabel[row.type]?.toLowerCase().includes(query) ||
          row.type.toLowerCase().includes(query) ||
          row.reason?.toLowerCase().includes(query) ||
          formatDate(row.startDate).toLowerCase().includes(query) ||
          formatDate(row.endDate).toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((row) => row.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((row) => row.type === typeFilter);
    }

    return filtered;
  }, [allRows, searchQuery, statusFilter, typeFilter]);

  const cancelRequest = async (id: number) => {
    try {
      const res = await fetch(`/api/leaves/${id}`, { method: "PATCH" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error("Couldn't cancel request", {
          description: body?.error ?? "Please try again.",
        });
        return;
      }
      toast.success("Request cancelled");
      mutate();
    } catch (err) {
      console.error(err);
      toast.error("Couldn't cancel request", {
        description: "Network error. Please try again.",
      });
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">My Leave Requests</h1>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage all your leave requests
            </p>
          </div>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/leaves/apply">
              <Plus className="mr-2 h-4 w-4" />
              Apply Leave
            </Link>
          </Button>
        </div>

        <FilterBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search by type, reason, or date..."
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
      </section>

      <Card>
        <CardHeader>
          <CardTitle>
            Leave Requests {filteredRows.length !== allRows.length && `(${filteredRows.length} of ${allRows.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table aria-label="My leave requests table">
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead className="hidden sm:table-cell">Dates</TableHead>
                <TableHead className="hidden md:table-cell">Working Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8" aria-live="polite">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-red-600 py-8" role="alert">
                    Failed to load leave requests
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <EmptyState
                      icon={ClipboardCheck}
                      title={allRows.length === 0 ? "No leave requests yet" : "No matching requests"}
                      description={
                        allRows.length === 0
                          ? "Start by applying for your first leave request."
                          : "Try adjusting your search or filters."
                      }
                      action={
                        allRows.length === 0
                          ? {
                              label: "Apply Leave",
                              onClick: () => (window.location.href = "/leaves/apply"),
                            }
                          : undefined
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{leaveTypeLabel[row.type] ?? row.type}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="sr-only">Dates: </span>
                      {formatDate(row.startDate)} → {formatDate(row.endDate)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{row.workingDays}</TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{formatDate(row.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      {CANCELABLE_STATUSES.has(row.status) ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" aria-label={`Cancel leave request from ${formatDate(row.startDate)} to ${formatDate(row.endDate)}`}>
                              Cancel
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel this request?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will mark the request as cancelled. Approvers will no longer see it.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep</AlertDialogCancel>
                              <AlertDialogAction onClick={() => cancelRequest(row.id)}>
                                Cancel Request
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

