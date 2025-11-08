"use client";

import { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { LeaveStatus, LeaveType } from "@prisma/client";
import { useUser } from "@/lib/user-context";
import { isFinalApprover, canPerformAction } from "@/lib/workflow";
import { SUCCESS_MESSAGES, getToastMessage } from "@/lib/toast-messages";
import { useDebounce } from "@/lib/use-debounce";
import { useFilterFromUrl } from "@/lib/url-filters";
import { DEFAULT_FILTER } from "@/types/filters";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

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

type UsePendingRequestsOptions = {
  autoFetch?: boolean;
  initialFilters?: {
    status?: string;
    type?: string;
    search?: string;
  };
};

/**
 * Custom hook for managing pending leave requests
 * Handles filtering, search, pagination, and bulk actions
 */
export function usePendingRequests(options: UsePendingRequestsOptions = {}) {
  const { autoFetch = true, initialFilters } = options;
  const { user } = useUser();

  // URL filters
  const { state: urlFilters, set: setUrlFilters } = useFilterFromUrl();

  // Local state
  const [searchInput, setSearchInput] = useState(urlFilters.q || "");
  const [selectedRequests, setSelectedRequests] = useState<Set<number>>(
    new Set()
  );
  const [isProcessing, setIsProcessing] = useState(false);

  // Debounced search
  const debouncedSearch = useDebounce(searchInput, 300);

  // Sync debounced search with URL
  useEffect(() => {
    if (debouncedSearch !== urlFilters.q) {
      setUrlFilters({ q: debouncedSearch });
    }
  }, [debouncedSearch, urlFilters.q, setUrlFilters]);

  // Sync search input with URL (when URL changes externally)
  useEffect(() => {
    if (urlFilters.q !== searchInput) {
      setSearchInput(urlFilters.q);
    }
  }, [urlFilters.q]);

  // Build API query params from URL state
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (urlFilters.q) params.set("q", urlFilters.q);
    if (urlFilters.status && urlFilters.status !== "ALL")
      params.set("status", urlFilters.status);
    if (urlFilters.type && urlFilters.type !== "ALL")
      params.set("type", urlFilters.type);
    params.set("page", urlFilters.page.toString());
    params.set("pageSize", urlFilters.pageSize.toString());
    return params.toString();
  }, [
    urlFilters.q,
    urlFilters.status,
    urlFilters.type,
    urlFilters.page,
    urlFilters.pageSize,
  ]);

  // Fetch data
  const { data, error, isLoading, mutate } = useSWR(
    autoFetch && user ? `/api/approvals/pending?${queryParams}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  const requests: LeaveRequest[] = data?.requests || [];
  const totalPages = data?.totalPages || 1;
  const totalRequests = data?.total || 0;

  // Filtered and sorted requests
  const filteredRequests = useMemo(() => {
    return requests;
  }, [requests]);

  // Selection handlers
  const toggleSelection = (id: number) => {
    setSelectedRequests((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedRequests.size === filteredRequests.length) {
      setSelectedRequests(new Set());
    } else {
      setSelectedRequests(new Set(filteredRequests.map((r) => r.id)));
    }
  };

  const clearSelection = () => {
    setSelectedRequests(new Set());
  };

  // Action handlers
  const handleBulkAction = async (
    action: "approve" | "reject" | "return" | "forward",
    comment?: string
  ) => {
    if (selectedRequests.size === 0) {
      toast.error("No requests selected");
      return;
    }

    setIsProcessing(true);
    try {
      const results = await Promise.allSettled(
        Array.from(selectedRequests).map(async (requestId) => {
          const endpoint = `/api/leaves/${requestId}/${action}`;
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              comment: comment || "",
              reason: comment || undefined,
            }),
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || "Failed to process request");
          }

          return response.json();
        })
      );

      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      if (succeeded > 0) {
        const actionText =
          action === "approve"
            ? "approved"
            : action === "reject"
            ? "rejected"
            : action === "return"
            ? "returned"
            : "forwarded";
        toast.success(`${succeeded} request(s) ${actionText} successfully`);
        mutate();
        clearSelection();
      }

      if (failed > 0) {
        toast.error(`${failed} request(s) failed to process`);
      }
    } catch (error) {
      toast.error("Failed to process requests");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSingleAction = async (
    requestId: number,
    action: "approve" | "reject" | "return" | "forward" | "cancel",
    comment?: string
  ) => {
    setIsProcessing(true);
    try {
      const endpoint = `/api/leaves/${requestId}/${action}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: comment || "",
          reason: comment || undefined,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMessage = getToastMessage(
          payload?.error || `Failed to ${action} request`,
          payload?.message
        );
        toast.error(errorMessage);
        return;
      }

      toast.success(
        action === "approve"
          ? SUCCESS_MESSAGES.leave_approved
          : action === "reject"
          ? SUCCESS_MESSAGES.leave_rejected
          : action === "return"
          ? SUCCESS_MESSAGES.returned_for_modification
          : action === "cancel"
          ? "Leave request cancelled successfully"
          : SUCCESS_MESSAGES.leave_forwarded
      );

      mutate();
    } catch (error) {
      toast.error(getToastMessage("network_error", "Unable to update request"));
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter handlers
  const clearFilters = () => {
    setSearchInput("");
    setUrlFilters(DEFAULT_FILTER);
  };

  const hasActiveFilters = useMemo(() => {
    return (
      urlFilters.q !== "" ||
      urlFilters.status !== DEFAULT_FILTER.status ||
      urlFilters.type !== DEFAULT_FILTER.type
    );
  }, [urlFilters.q, urlFilters.status, urlFilters.type]);

  // Pagination handlers
  const goToNextPage = () => {
    if (urlFilters.page < totalPages) {
      setUrlFilters({ page: urlFilters.page + 1 });
    }
  };

  const goToPreviousPage = () => {
    if (urlFilters.page > 1) {
      setUrlFilters({ page: urlFilters.page - 1 });
    }
  };

  return {
    // Data
    requests: filteredRequests,
    totalPages,
    totalRequests,
    isLoading,
    error,

    // Selection
    selectedRequests,
    toggleSelection,
    toggleSelectAll,
    clearSelection,

    // Filters
    searchInput,
    setSearchInput,
    urlFilters,
    setUrlFilters,
    clearFilters,
    hasActiveFilters,

    // Pagination
    goToNextPage,
    goToPreviousPage,

    // Actions
    handleBulkAction,
    handleSingleAction,
    isProcessing,

    // Permissions (via user context)
    user,

    // Refresh
    refresh: mutate,
  };
}
