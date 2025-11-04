"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Inbox } from "lucide-react";
import { WelcomeHero } from "./WelcomeHero";
import { ActionItems } from "./ActionItems";
import { LeaveSummaryCardNew } from "./LeaveSummaryCardNew";
import { StatusBadgeSimple } from "./StatusBadgeSimple";
import { LiveActivityTimeline } from "./LiveActivityTimeline";
import { formatDate } from "@/lib/utils";
import { SegmentedControlGlider } from "./SegmentedControlGlider";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type LeaveStatus =
  | "SUBMITTED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "RETURNED"
  | "CANCELLATION_REQUESTED"
  | "RECALLED"
  | "OVERSTAY_PENDING";

type LeaveRow = {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  status: LeaveStatus;
  updatedAt: string;
  approvals?: Array<{
    step: number;
    decision: "PENDING" | "FORWARDED" | "APPROVED" | "REJECTED" | "RETURNED";
    approver?: { name: string | null } | null;
    toRole?: string | null;
  }>;
};

/**
 * [REDESIGNED RequestsTable]
 * Uses SegmentedControl and the new v2.0-aware StatusBadge.
 */
function RequestsTable({
  leaves,
  isLoading,
  limit,
}: {
  leaves: LeaveRow[];
  isLoading: boolean;
  limit?: number;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");

  const filteredRows = useMemo(() => {
    let filtered: LeaveRow[] = [];
    if (filter === "all") {
      filtered = leaves;
    } else {
      filtered = leaves.filter((row) => {
        switch (filter) {
          case "pending":
            return (
              row.status === "PENDING" ||
              row.status === "SUBMITTED" ||
              row.status === "CANCELLATION_REQUESTED"
            );
          case "returned":
            return row.status === "RETURNED";
          case "history":
            return (
              row.status === "APPROVED" ||
              row.status === "REJECTED" ||
              row.status === "CANCELLED" ||
              row.status === "RECALLED"
            );
          default:
            return true;
        }
      });
    }
    const sorted = [...filtered].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    return limit ? sorted.slice(0, limit) : sorted;
  }, [leaves, filter, limit]);

  const filterOptions = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "returned", label: "Returned" },
    { value: "history", label: "History" },
  ];

  return (
    <Card className="solid-card animate-fade-in-up animate-delay-300ms">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-lg">Recent Requests</CardTitle>
          <div className="w-full md:w-auto">
            <SegmentedControlGlider
              options={filterOptions}
              selected={filter}
              onChange={setFilter}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-6">
            <Inbox className="size-12 text-gray-300 dark:text-gray-600" />
            <p className="mt-2 font-semibold">No Requests Found</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              There are no requests matching your filter.
            </p>
          </div>
        ) : (
          <div className="flow-root">
            <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredRows.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between gap-4 p-4 md:p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/leaves?id=${row.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {row.type} Leave
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(row.startDate)} → {formatDate(row.endDate)}
                      <span className="hidden sm:inline">
                        {" "}
                        ({row.workingDays} days)
                      </span>
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-1">
                    <StatusBadgeSimple status={row.status} />
                    <span className="text-xs text-gray-400 dark:text-gray-500 sm:hidden">
                      {row.workingDays} days
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type EmployeeDashboardUnifiedProps = {
  username: string;
};

/**
 * [REDESIGNED EmployeeDashboardUnified]
 * This component now fetches all data and passes it down to the
 * new, redesigned presentational components.
 */
export function EmployeeDashboardUnified({
  username,
}: EmployeeDashboardUnifiedProps) {
  // Fetch all necessary data at the top level
  const { data: leavesData, isLoading: isLoadingLeaves } = useSWR(
    "/api/leaves?mine=1",
    fetcher
  );
  const { data: balanceData, isLoading: isLoadingBalance } = useSWR(
    "/api/balance/mine",
    fetcher
  );

  const leaves = leavesData?.items || [];

  return (
    <div className="space-y-6">
      {/* 1. Welcome Hero */}
      <Suspense fallback={<Skeleton className="h-36 w-full" />}>
        <WelcomeHero username={username} />
      </Suspense>

      {/* 2. Action Items (v2.0 Statuses) */}
      <Suspense fallback={<Skeleton className="h-28 w-full" />}>
        <ActionItems leaves={leaves} isLoading={isLoadingLeaves} />
      </Suspense>

      {/* 3. Live Activity Timeline - Shows active requests with approval tracking */}
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <LiveActivityTimeline leaves={leaves} isLoading={isLoadingLeaves} />
      </Suspense>

      {/* 4. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Requests Table */}
        <div className="lg:col-span-2">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <RequestsTable leaves={leaves} isLoading={isLoadingLeaves} limit={5} />
          </Suspense>
        </div>

        {/* Right Column (1/3): Summary Card */}
        <div className="lg:col-span-1">
          <Suspense fallback={<Skeleton className="h-80 w-full" />}>
            <LeaveSummaryCardNew
              balanceData={balanceData}
              isLoading={isLoadingBalance}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
