"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import clsx from "clsx";

// UI Components (barrel export)
import {
  Card,
  CardContent,
  ModernTable,
  Checkbox,
} from "@/components/ui";

// Shared Components (barrel export)
import { FilterBar, ApprovalActionButtons } from "@/components/shared";
import type { ApprovalAction } from "@/components/shared";

// Lib utilities (barrel export)
import {
  formatDate,
  leaveTypeLabel,
  SUCCESS_MESSAGES,
  getToastMessage,
  useUser,
} from "@/lib";
import type { AppRole } from "@/lib/rbac";

// Local imports
import { HRApprovalItem } from "./types";
import { useSelectionContext } from "@/lib/selection-context";
import { apiFetcher, apiPost } from "@/lib/apiClient";

type ApprovalsResponse = { items: HRApprovalItem[] };

type ApprovalTableProps = {
  onSelect?: (item: HRApprovalItem) => void;
  onDataChange?: (items: HRApprovalItem[]) => void;
};

function statusStyle(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === "APPROVED") return "bg-data-success";
  if (normalized === "REJECTED") return "bg-data-error";
  return "hover:bg-bg-secondary";
}

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

export function ApprovalTable({ onSelect, onDataChange }: ApprovalTableProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { setSelection } = useSelectionContext();
  const user = useUser();
  const userRole = (user?.role as AppRole) || "EMPLOYEE";
  const isHRAdmin = userRole === "HR_ADMIN";

  // Update selection count when selectedIds changes
  useEffect(() => {
    setSelection(selectedIds);
    return () => setSelection([]);
  }, [selectedIds, setSelection]);

  const { data, error, isLoading, mutate } = useSWR<ApprovalsResponse>(
    "/api/approvals",
    apiFetcher,
    {
      revalidateOnFocus: true,
    }
  );

  const allItems = useMemo(
    () => (Array.isArray(data?.items) ? data!.items : []),
    [data]
  );

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

  async function handleDecision(
    id: string,
    action: "approve" | "reject" | "forward" | "return"
  ) {
    try {
      setProcessingId(id + action);

      if (action === "forward") {
        await apiPost(`/api/leaves/${id}/forward`, {});
        toast.success("Request forwarded successfully");
      } else if (action === "return") {
        const comment = prompt(
          "Please provide a reason for returning this request (minimum 5 characters):"
        );
        if (!comment || comment.length < 5) {
          toast.error("Comment must be at least 5 characters");
          setProcessingId(null);
          return;
        }
        await apiPost(`/api/leaves/${id}/return`, { comment });
        toast.success("Request returned for modification");
      } else {
        // approve or reject
        await apiPost<{ ok: boolean; status: string }>(
          `/api/approvals/${id}/decision`,
          { action, comment: undefined }
        );
        toast.success(
          action === "approve"
            ? SUCCESS_MESSAGES.leave_approved
            : SUCCESS_MESSAGES.leave_rejected
        );
      }

      // Remove from selection if selected
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await mutate();
    } catch (err) {
      const message =
        err instanceof Error
          ? getToastMessage(err.message, err.message)
          : getToastMessage("approval_failed", "Failed to update request");
      toast.error(message);
    } finally {
      setProcessingId(null);
    }
  }

  const handleSelectRow = (itemId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(itemId);
      } else {
        next.delete(itemId);
      }
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(items.map((item) => item.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const allSelected = items.length > 0 && selectedIds.size === items.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < items.length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Loading approvals…
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-data-error">
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
            <ModernTable>
              <ModernTable.Header>
                <ModernTable.Row>
                  <ModernTable.Head className="w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(checked) =>
                        handleSelectAll(checked === true)
                      }
                      aria-label="Select all rows"
                      className={
                        someSelected
                          ? "data-[state=checked]:bg-card-action"
                          : ""
                      }
                    />
                  </ModernTable.Head>
                  <ModernTable.Head>Employee</ModernTable.Head>
                  <ModernTable.Head>Type</ModernTable.Head>
                  <ModernTable.Head>Dates</ModernTable.Head>
                  <ModernTable.Head>Days</ModernTable.Head>
                  <ModernTable.Head>Reason</ModernTable.Head>
                  <ModernTable.Head>Stage</ModernTable.Head>
                  <ModernTable.Head className="text-right">Actions</ModernTable.Head>
                </ModernTable.Row>
              </ModernTable.Header>
              <ModernTable.Body>
                {items.map((item) => {
                  const start = formatDate(item.start);
                  const end = formatDate(item.end);
                  const stage =
                    item.approvals?.[item.currentStageIndex]?.status ??
                    item.status;
                  return (
                    <ModernTable.Row
                      key={item.id}
                      className={clsx(
                        "cursor-pointer transition",
                        statusStyle(item.status),
                        selectedIds.has(item.id) &&
                          "bg-card-action dark:bg-card-action/20"
                      )}
                      onClick={(e) => {
                        // Don't trigger onSelect if clicking on checkbox
                        if (
                          !(e.target as HTMLElement).closest(
                            'input[type="checkbox"]'
                          )
                        ) {
                          onSelect?.(item);
                        }
                      }}
                    >
                      <ModernTable.Cell>
                        <Checkbox
                          checked={selectedIds.has(item.id)}
                          onCheckedChange={(checked) =>
                            handleSelectRow(item.id, checked === true)
                          }
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Select row ${item.id}`}
                        />
                      </ModernTable.Cell>
                      <ModernTable.Cell>
                        <div className="font-medium text-text-primary">
                          {item.requestedByName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.requestedByEmail ?? "—"}
                        </div>
                      </ModernTable.Cell>
                      <ModernTable.Cell className="text-sm text-text-secondary">
                        {leaveTypeLabel[item.type] ?? item.type}
                      </ModernTable.Cell>
                      <ModernTable.Cell className="text-sm text-text-secondary">
                        <div>{start}</div>
                        {start !== end && (
                          <div className="text-xs text-muted-foreground">
                            to {end}
                          </div>
                        )}
                      </ModernTable.Cell>
                      <ModernTable.Cell className="text-sm text-text-secondary">
                        {item.requestedDays}
                      </ModernTable.Cell>
                      <ModernTable.Cell className="max-w-xs text-sm text-text-secondary">
                        <p className="whitespace-pre-wrap wrap-break-word">
                          {item.reason}
                        </p>
                      </ModernTable.Cell>
                      <ModernTable.Cell className="text-sm font-medium capitalize text-text-secondary">
                        {stage.toLowerCase()}
                      </ModernTable.Cell>
                      <ModernTable.Cell className="text-right">
                        <div
                          className="flex justify-end"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ApprovalActionButtons
                            ceoMode={userRole === "CEO" || userRole === "HR_HEAD"}
                            onForward={
                              userRole === "HR_ADMIN" || userRole === "DEPT_HEAD"
                                ? () => handleDecision(item.id, "forward")
                                : undefined
                            }
                            onReturn={
                              userRole === "HR_ADMIN" || userRole === "DEPT_HEAD"
                                ? () => handleDecision(item.id, "return")
                                : undefined
                            }
                            onCancel={() => handleDecision(item.id, "reject")}
                            onApprove={
                              userRole === "CEO" || userRole === "HR_HEAD"
                                ? () => handleDecision(item.id, "approve")
                                : undefined
                            }
                            disabled={processingId !== null}
                            loading={processingId !== null}
                            loadingAction={
                              processingId?.startsWith(item.id)
                                ? (processingId.replace(
                                    item.id,
                                    ""
                                  ) as ApprovalAction)
                                : null
                            }
                          />
                        </div>
                      </ModernTable.Cell>
                    </ModernTable.Row>
                  );
                })}
              </ModernTable.Body>
            </ModernTable>
      )}
      {items.length !== allItems.length && allItems.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {items.length} of {allItems.length} requests
        </p>
      )}
    </div>
  );
}
