"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { SUCCESS_MESSAGES, getToastMessage } from "@/lib/toast-messages";
import { useSelectionContext } from "@/lib/selection-context";
import { useLeaveDataContext, type LeaveResponse } from "@/components/providers/LeaveDataProvider";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export type LeaveRow = {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  status:
    | "SUBMITTED"
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "CANCELLED"
    | "RETURNED"
    | "CANCELLATION_REQUESTED"
    | "RECALLED";
  updatedAt: string;
  reason?: string;
  createdAt?: string;
  approvals?: Array<{
    step?: number;
    approver?: {
      name: string | null;
    } | null;
    decision: string;
    comment?: string | null;
    decidedAt?: string | null;
    toRole?: string | null;
  }>;
};

export type FilterStatus = "all" | "pending" | "approved" | "cancelled";

export const CANCELABLE_STATUSES = new Set<LeaveRow["status"]>(["SUBMITTED", "PENDING", "RETURNED", "APPROVED"]);

type UseLeaveRequestsOptions = {
  limit?: number;
  enableSelection?: boolean;
};

export type SelectionState = {
  allSelected: boolean;
  someSelected: boolean;
  isSelected: (id: number) => boolean;
  selectRow: (id: number, checked: boolean) => void;
  selectAll: (checked: boolean) => void;
};

export type LeaveModalState = {
  selectedLeave: LeaveRow | null;
  isOpen: boolean;
  openDetails: (leave: LeaveRow) => void;
  handleOpenChange: (open: boolean) => void;
};

export function useLeaveRequests({ limit, enableSelection }: UseLeaveRequestsOptions = {}) {
  const selectionEnabled = enableSelection ?? (limit === undefined || limit === null);
  const { setSelection } = useSelectionContext();
  const contextValue = useLeaveDataContext();
  const fallback = useSWR<LeaveResponse>("/api/leaves?mine=1", fetcher, {
    revalidateOnFocus: false,
  });
  const { data, isLoading, error, mutate } = contextValue ?? fallback;

  const [filter, setFilter] = useState<FilterStatus>("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedLeave, setSelectedLeave] = useState<LeaveRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!selectionEnabled) {
      setSelection([]);
      return;
    }
    setSelection(selectedIds);
    return () => {
      setSelection([]);
    };
  }, [selectionEnabled, selectedIds, setSelection]);

  const allRows: LeaveRow[] = useMemo(() => (Array.isArray(data?.items) ? data.items : []), [data]);

  const filteredRows = useMemo(() => {
    let filtered: LeaveRow[] = [];
    if (filter === "all") {
      filtered = allRows;
    } else {
      filtered = allRows.filter((row) => {
        switch (filter) {
          case "pending":
            return row.status === "PENDING" || row.status === "SUBMITTED";
          case "approved":
            return row.status === "APPROVED";
          case "cancelled":
            return row.status === "CANCELLED";
          default:
            return true;
        }
      });
    }
    const sorted = [...filtered].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    return limit ? sorted.slice(0, limit) : sorted;
  }, [allRows, filter, limit]);

  const changeFilter = useCallback(
    (next: FilterStatus) => {
      setFilter(next);
      if (selectionEnabled) {
        setSelectedIds(new Set());
      }
    },
    [selectionEnabled],
  );

  const selectRow = useCallback(
    (id: number, checked: boolean) => {
      if (!selectionEnabled) return;
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (checked) {
          next.add(id);
        } else {
          next.delete(id);
        }
        return next;
      });
    },
    [selectionEnabled],
  );

  const selectAll = useCallback(
    (checked: boolean) => {
      if (!selectionEnabled) return;
    setSelectedIds(checked ? new Set(filteredRows.map((row) => row.id)) : new Set());
  },
    [selectionEnabled, filteredRows],
  );

  const allSelected =
    selectionEnabled && filteredRows.length > 0 && selectedIds.size === filteredRows.length;
  const someSelected =
    selectionEnabled && selectedIds.size > 0 && selectedIds.size < filteredRows.length;

  const selection: SelectionState = useMemo(() => {
    if (!selectionEnabled) {
      return {
        allSelected: false,
        someSelected: false,
        isSelected: () => false,
        selectRow: () => {},
        selectAll: () => {},
      };
    }
    return {
      allSelected,
      someSelected,
      isSelected: (id: number) => selectedIds.has(id),
      selectRow,
      selectAll,
    };
  }, [selectionEnabled, allSelected, someSelected, selectedIds, selectRow, selectAll]);

  const openDetails = useCallback((leave: LeaveRow) => {
    setSelectedLeave(leave);
    setModalOpen(true);
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    setModalOpen(open);
    if (!open) {
      setSelectedLeave(null);
    }
  }, []);

  const modal: LeaveModalState = useMemo(
    () => ({
      selectedLeave,
      isOpen: modalOpen,
      openDetails,
      handleOpenChange,
    }),
    [selectedLeave, modalOpen, openDetails, handleOpenChange],
  );

  const cancelRequest = useCallback(
    async (id: number) => {
      try {
        const res = await fetch(`/api/leaves/${id}`, { method: "PATCH" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const errorMessage = getToastMessage(
            body?.error || "Unable to cancel request",
            body?.message,
          );
          toast.error(errorMessage);
          return;
        }
        const body = await res.json().catch(() => ({}));
        const isImmediate = body?.status === "CANCELLED";
        toast.success(
          isImmediate
            ? SUCCESS_MESSAGES.cancellation_success
            : SUCCESS_MESSAGES.cancellation_request_submitted,
        );
        if (selectionEnabled) {
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }
        mutate();
      } catch (err) {
        console.error(err);
        toast.error(getToastMessage("network_error", "Network error. Please try again."));
      }
    },
    [selectionEnabled, mutate],
  );

  return {
    allRows,
    rows: filteredRows,
    filter,
    changeFilter,
    isLoading,
    error,
    enableSelection: selectionEnabled,
    selection,
    modal,
    cancelRequest,
  };
}
