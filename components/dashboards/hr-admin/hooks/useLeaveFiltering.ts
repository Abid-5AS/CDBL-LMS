/**
 * Custom hook for leave request filtering and pagination
 */

import { useState, useMemo, useEffect } from "react";
import { leaveTypeLabel } from "@/lib";
import type { LeaveStatus } from "@prisma/client";

type LeaveRequest = {
  id: number;
  type: string;
  status: LeaveStatus;
  reason?: string;
  requester?: {
    name?: string;
    email?: string;
  };
  [key: string]: any;
};

export function useLeaveFiltering(
  allLeaves: LeaveRequest[],
  itemsPerPage: number = 10
) {
  const [statusTab, setStatusTab] = useState("PENDING");
  const [searchInput, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter by status tab and search
  const filteredLeaves = useMemo(() => {
    let filtered = allLeaves.filter((leave) => leave.requester);

    // Status tab filter
    if (statusTab === "PENDING") {
      filtered = filtered.filter(
        (leave) => leave.status === "PENDING" || leave.status === "SUBMITTED"
      );
    } else if (statusTab === "RETURNED") {
      filtered = filtered.filter((leave) => leave.status === "RETURNED");
    } else if (statusTab === "CANCELLED") {
      filtered = filtered.filter((leave) => leave.status === "CANCELLED");
    }

    // Search filter
    if (searchInput.trim()) {
      const query = searchInput.toLowerCase();
      filtered = filtered.filter(
        (leave) =>
          leave.requester?.name?.toLowerCase().includes(query) ||
          leave.requester?.email?.toLowerCase().includes(query) ||
          leave.type.toLowerCase().includes(query) ||
          (leaveTypeLabel[leave.type]?.toLowerCase().includes(query) ??
            false) ||
          leave.reason?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allLeaves, statusTab, searchInput]);

  // Pagination
  const totalPages = Math.ceil(filteredLeaves.length / itemsPerPage);
  const paginatedLeaves = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLeaves.slice(start, start + itemsPerPage);
  }, [filteredLeaves, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusTab, searchInput]);

  return {
    statusTab,
    setStatusTab,
    searchInput,
    setSearchInput,
    currentPage,
    setCurrentPage,
    filteredLeaves,
    paginatedLeaves,
    totalPages,
  };
}
