"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ClipboardCheck } from "lucide-react";
import StatusBadge from "@/app/dashboard/components/status-badge";
import { leaveTypeLabel } from "@/lib/ui";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { FilterChips } from "@/components/leaves/FilterChips";
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
import { LeaveDetailsModal } from "@/components/dashboard/LeaveDetailsModal";
import { toast } from "sonner";
import useSWR from "swr";

type LeaveRow = {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  status: "SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "RETURNED" | "CANCELLATION_REQUESTED" | "RECALLED" | "OVERSTAY_PENDING";
  updatedAt: string;
  reason?: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const CANCELABLE_STATUSES = new Set<LeaveRow["status"]>(["SUBMITTED", "PENDING", "RETURNED", "CANCELLATION_REQUESTED"]);

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "returned", label: "Returned" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
  { value: "overstay", label: "Overstay" },
  { value: "cancellation_requested", label: "Cancelling" },
];

export function MyLeavesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedLeave, setSelectedLeave] = useState<LeaveRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Fetch data first
  const { data, isLoading, error, mutate } = useSWR("/api/leaves?mine=1", fetcher, {
    revalidateOnFocus: false,
  });

  // Get all rows from data
  const allRows: LeaveRow[] = Array.isArray(data?.items) ? data.items : [];

  // Get initial filter and highlight from URL
  const urlFilter = searchParams.get("status") || "all";
  const highlightId = searchParams.get("highlight") || searchParams.get("id");
  const [selectedFilter, setSelectedFilter] = useState(urlFilter);

  // Update filter when URL changes
  useEffect(() => {
    const urlFilter = searchParams.get("status") || "all";
    setSelectedFilter(urlFilter);
  }, [searchParams]);

  // Handle highlight ID when leaves data is loaded
  useEffect(() => {
    if (highlightId && allRows.length > 0) {
      const leaveId = parseInt(highlightId, 10);
      const leave = allRows.find((row) => row.id === leaveId);
      if (leave) {
        setSelectedLeave(leave);
        setModalOpen(true);
      }
    }
  }, [highlightId, allRows]);

  // Update URL when filter changes
  const handleFilterChange = (value: string) => {
    setSelectedFilter(value);
    if (value === "all") {
      router.push("/leaves");
    } else {
      router.push(`/leaves?status=${value}`);
    }
  };

  const filteredRows = useMemo(() => {
    if (selectedFilter === "all") return allRows;
    return allRows.filter(row => {
      const status = row.status.toLowerCase();
      switch (selectedFilter) {
        case "pending":
          return status === "submitted" || status === "pending" || status === "cancellation_requested";
        case "returned":
          return status === "returned";
        case "overstay":
          return status === "overstay_pending";
        case "cancellation_requested":
          return status === "cancellation_requested";
        default:
          return status === selectedFilter;
      }
    });
  }, [allRows, selectedFilter]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-2xl border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">My Leave Requests</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Track the status of your submitted leave applications. Pending requests can be withdrawn before approval.
        </p>
      </section>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <FilterChips options={FILTER_OPTIONS} selectedValue={selectedFilter} onChange={handleFilterChange} />
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20 backdrop-blur-sm">
          <CardTitle>Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-slate-700 dark:text-slate-200">Type</TableHead>
                  <TableHead className="hidden sm:table-cell text-slate-700 dark:text-slate-200">Dates</TableHead>
                  <TableHead className="hidden md:table-cell text-slate-700 dark:text-slate-200">Working Days</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-200">Status</TableHead>
                  <TableHead className="hidden lg:table-cell text-slate-700 dark:text-slate-200">Last Updated</TableHead>
                  <TableHead className="text-right text-slate-700 dark:text-slate-200">Actions</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-gray-600 dark:text-slate-300 py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-red-600 dark:text-red-400 py-8" role="alert">
                    Failed to load
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <EmptyState
                      icon={ClipboardCheck}
                      title="No leave requests"
                      description={selectedFilter === "all" 
                        ? "Start by applying for your first leave request."
                        : `No ${selectedFilter} requests found.`}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => (
                  <TableRow 
                    key={row.id} 
                    className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedLeave(row);
                      setModalOpen(true);
                    }}
                  >
                    <TableCell className="font-medium text-slate-900 dark:text-slate-100">{leaveTypeLabel[row.type] ?? row.type}</TableCell>
                    <TableCell className="hidden sm:table-cell text-gray-600 dark:text-slate-300">
                      {formatDate(row.startDate)} → {formatDate(row.endDate)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-gray-600 dark:text-slate-300">{row.workingDays}</TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-gray-600 dark:text-slate-300">{formatDate(row.updatedAt)}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      {CANCELABLE_STATUSES.has(row.status) ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:border-slate-500">
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
                        <span className="text-xs text-gray-500 dark:text-slate-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Leave Details Modal */}
      <LeaveDetailsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        leave={selectedLeave}
      />
    </div>
  );
}

