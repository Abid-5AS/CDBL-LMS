"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ClipboardCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { leaveTypeLabel } from "@/lib/ui";
import Link from "next/link";
import StatusBadge from "@/app/dashboard/components/status-badge";
import { FilterBar } from "@/components/filters/FilterBar";
import { FilterChips } from "@/components/filters/FilterChips";
import useSWR from "swr";
import { LeaveStatus } from "@prisma/client";

type LeaveRequest = {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  reason: string;
  status: LeaveStatus;
  requester: {
    id: number;
    name: string;
    email: string;
  };
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "SUBMITTED", label: "Submitted" },
];

const TYPE_OPTIONS = [
  { value: "EARNED", label: "Earned Leave" },
  { value: "CASUAL", label: "Casual Leave" },
  { value: "MEDICAL", label: "Medical Leave (Sick Leave)" },
  { value: "EXTRAWITHPAY", label: "Extraordinary Leave (with pay)" },
  { value: "EXTRAWITHOUTPAY", label: "Extraordinary Leave (without pay)" },
  { value: "MATERNITY", label: "Maternity Leave" },
  { value: "PATERNITY", label: "Paternity Leave" },
  { value: "STUDY", label: "Study Leave" },
  { value: "SPECIAL_DISABILITY", label: "Special Disability Leave" },
  { value: "QUARANTINE", label: "Quarantine Leave" },
];

export function PendingLeaveRequestsTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());

  const { data, isLoading, error } = useSWR<{ items: LeaveRequest[] }>("/api/approvals", fetcher, {
    revalidateOnFocus: false,
  });

  const allLeaves: LeaveRequest[] = Array.isArray(data?.items) ? data.items : [];

  const filteredLeaves = useMemo(() => {
    // Filter out leaves without requester data
    let filtered = allLeaves.filter((leave) => leave.requester).slice(0, 10); // Limit to 10 for dashboard

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (leave) =>
          leave.requester?.name?.toLowerCase().includes(query) ||
          leave.requester?.email?.toLowerCase().includes(query) ||
          leave.type.toLowerCase().includes(query) ||
          (leaveTypeLabel[leave.type]?.toLowerCase().includes(query) ?? false) ||
          leave.reason?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((leave) => leave.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((leave) => leave.type === typeFilter);
    } else if (selectedTypes.size > 0) {
      filtered = filtered.filter((leave) => selectedTypes.has(leave.type));
    }

    return filtered;
  }, [allLeaves, searchQuery, statusFilter, typeFilter, selectedTypes]);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
    setSelectedTypes(new Set());
  };

  const handleTypeToggle = (value: string) => {
    const newSet = new Set(selectedTypes);
    if (newSet.has(value)) {
      newSet.delete(value);
    } else {
      newSet.add(value);
    }
    setSelectedTypes(newSet);
    setTypeFilter("all"); // Reset dropdown when using chips
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">Loading...</CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-red-600">
          Failed to load requests
        </CardContent>
      </Card>
    );
  }

  if (allLeaves.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <EmptyState
            icon={ClipboardCheck}
            title="No pending requests"
            description="All leave requests have been processed. Check back later for new submissions."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by employee, type, or reason..."
        statusFilter={{
          value: statusFilter,
          onChange: setStatusFilter,
          options: STATUS_OPTIONS,
        }}
        typeFilter={
          selectedTypes.size === 0
            ? {
                value: typeFilter,
                onChange: setTypeFilter,
                options: TYPE_OPTIONS,
              }
            : undefined
        }
        onClear={clearFilters}
      />

      {selectedTypes.size > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Filter by type:</p>
          <FilterChips
            options={TYPE_OPTIONS}
            selected={selectedTypes}
            onChange={handleTypeToggle}
          />
        </div>
      )}

      {filteredLeaves.length === 0 && allLeaves.length > 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No requests match your filters
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              Pending Requests
              {filteredLeaves.length !== allLeaves.length && ` (${filteredLeaves.length} of ${allLeaves.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table aria-label="Pending leave requests table">
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden sm:table-cell">Dates</TableHead>
                  <TableHead className="hidden md:table-cell">Days</TableHead>
                  <TableHead className="hidden lg:table-cell">Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeaves.map((leave) => {
                  if (!leave.requester) return null;
                  return (
                    <TableRow key={leave.id}>
                      <TableCell>
                        <Link
                          href={`/employees/${leave.requester.id}`}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {leave.requester.name}
                        </Link>
                        <div className="text-xs text-muted-foreground">{leave.requester.email}</div>
                      </TableCell>
                      <TableCell className="font-medium">{leaveTypeLabel[leave.type] ?? leave.type}</TableCell>
                      <TableCell className="hidden sm:table-cell text-slate-600">
                        <span className="sr-only">Dates: </span>
                        {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-slate-600">
                        <span className="sr-only">Working days: </span>
                        {leave.workingDays}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell max-w-xs truncate text-slate-600">
                        <span className="sr-only">Reason: </span>
                        {leave.reason}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={leave.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline" aria-label={`Review leave request from ${leave.requester.name}`}>
                          <Link href={`/approvals?leave=${leave.id}`}>Review</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

