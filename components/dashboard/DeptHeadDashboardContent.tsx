"use client";

import { useState, useMemo } from "react";
import { DeptHeadSummaryCards } from "./DeptHeadSummaryCards";
import { DeptHeadPendingTable } from "./DeptHeadPendingTable";
import useSWR from "swr";

type SummaryData = {
  pending: number;
  approved: number;
  returned: number;
  cancelled: number;
};

type DeptHeadDashboardContentProps = {
  summaryData: SummaryData;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function DeptHeadDashboardContent({ summaryData }: DeptHeadDashboardContentProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // SWR key scoping for performance - only re-fetch when needed
  const swrKey = ["/api/approvals", selectedStatus] as const;
  const { data } = useSWR<{ items: Array<{ status: string; requester?: { id: number } }> }>(
    swrKey,
    ([url]) => fetcher(url),
    { revalidateOnFocus: false }
  );

  const allLeaves = Array.isArray(data?.items) ? data.items : [];

  // Calculate counts from all leaves (no filtering - summary cards show total counts)
  // When a card is clicked, it filters the table below
  // For DEPT_HEAD: "approved" means forwarded requests (has FORWARDED approval)
  const displayCounts = useMemo(() => {
    if (allLeaves.length === 0) {
      return summaryData;
    }

    const filtered = allLeaves.filter((leave) => leave.requester);
    
    // Count forwarded requests (requests with FORWARDED approvals)
    const forwardedCount = filtered.filter((l) => {
      const hasForwardedApproval = (l as any).approvals?.some(
        (approval: any) => approval.decision === "FORWARDED" && approval.toRole !== null
      );
      return hasForwardedApproval && l.status === "PENDING";
    }).length;
    
    return {
      pending: filtered.filter((l) => l.status === "PENDING" && !(l as any).approvals?.some((a: any) => a.decision === "FORWARDED")).length,
      approved: forwardedCount, // For DEPT_HEAD, this represents forwarded requests
      returned: filtered.filter((l) => l.status === "RETURNED").length,
      cancelled: filtered.filter((l) => l.status === "CANCELLED").length,
    };
  }, [allLeaves, summaryData]);

  // This component is now just a wrapper for the table
  // Summary cards are rendered in the parent page layout
  return (
    <div id="pending-requests-table">
      <DeptHeadPendingTable summaryData={summaryData} initialStatusFilter={selectedStatus} />
    </div>
  );
}

