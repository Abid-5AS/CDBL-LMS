"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getToastMessage, SUCCESS_MESSAGES } from "@/lib/toast-messages";
import { canCancel, canReturn, type AppRole } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { useSelectionContext } from "@/lib/selection-context";

type RoleAwareDockProps = {
  role: AppRole;
  selectedIds?: string[] | number[]; // selected leave IDs (from table)
  currentFilter?: Record<string, any>; // current filter state
  className?: string;
};

export function RoleAwareDock({ 
  role, 
  selectedIds = [], 
  currentFilter, 
  className 
}: RoleAwareDockProps) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const hasSelection = selectedIds.length > 0;

  // --- helpers

  async function exportCsv() {
    try {
      const qs = new URLSearchParams(Object.fromEntries(search.entries()));
      const res = await fetch(`/api/leaves/export?${qs.toString()}`, { method: "GET" });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(getToastMessage(err.error ?? "unknown_error"));
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leaves-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("CSV exported successfully");
    } catch (error) {
      toast.error("Failed to export CSV");
      console.error("Export error:", error);
    }
  }

  async function bulkApprove() {
    if (!hasSelection) return;
    
    try {
      const res = await fetch(`/api/leaves/bulk/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds.map(id => Number(id)) }),
      });

      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        toast.error(getToastMessage(data.error ?? "unknown_error"));
        return;
      }

      toast.success(SUCCESS_MESSAGES.leave_approved);
      router.refresh();
    } catch (error) {
      toast.error("Failed to approve selected leaves");
      console.error("Bulk approve error:", error);
    }
  }

  async function bulkReturnForModification() {
    if (!hasSelection) return;
    
    try {
      const res = await fetch(`/api/leaves/bulk/return-for-modification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds.map(id => Number(id)) }),
      });

      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        toast.error(getToastMessage(data.error ?? "unknown_error"));
        return;
      }

      toast.success(SUCCESS_MESSAGES.returned_for_modification);
      router.refresh();
    } catch (error) {
      toast.error("Failed to return selected leaves");
      console.error("Bulk return error:", error);
    }
  }

  async function bulkCancelAsEmployee() {
    if (!hasSelection) return;
    
    try {
      const res = await fetch(`/api/leaves/bulk/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds.map(id => Number(id)) }),
      });

      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        toast.error(getToastMessage(data.error ?? "unknown_error"));
        return;
      }

      toast.success(SUCCESS_MESSAGES.cancellation_request_submitted);
      router.refresh();
    } catch (error) {
      toast.error("Failed to cancel selected leaves");
      console.error("Bulk cancel error:", error);
    }
  }

  function saveView() {
    // Persist current path + query as a saved view for this user
    const view = { path: pathname, query: Object.fromEntries(search.entries()) };
    localStorage.setItem(`lms:view:${role}:${pathname}`, JSON.stringify(view));
    toast.success("View saved successfully");
  }

  function newFilter() {
    // Emit an event to open Filter modal (or use your existing filter system)
    window.dispatchEvent(new CustomEvent("lms:openFilterModal"));
  }

  // --- visibility logic

  const actions: Array<{ 
    id: string; 
    label: string; 
    onClick: () => void; 
    visible: boolean; 
    disabled?: boolean;
    badge?: number;
  }> = [
    // common utilities
    { id: "save-view", label: "Save View", onClick: saveView, visible: true },
    { id: "new-filter", label: "New Filter", onClick: newFilter, visible: true },
    { id: "export", label: "Export CSV", onClick: exportCsv, visible: true },

    // employee actions
    { 
      id: "employee-cancel", 
      label: `Cancel Selected (${selectedIds.length})`, 
      onClick: bulkCancelAsEmployee,
      visible: role === "EMPLOYEE" && canCancel(role, true), 
      disabled: !hasSelection,
      badge: hasSelection ? selectedIds.length : undefined,
    },

    // approver actions
    { 
      id: "approve", 
      label: `Approve Selected (${selectedIds.length})`, 
      onClick: bulkApprove,
      visible: role === "DEPT_HEAD" || role === "HR_ADMIN" || role === "HR_HEAD" || role === "CEO",
      disabled: !hasSelection,
      badge: hasSelection ? selectedIds.length : undefined,
    },

    { 
      id: "return", 
      label: `Return for Modification (${selectedIds.length})`, 
      onClick: bulkReturnForModification,
      visible: (role === "DEPT_HEAD" || role === "HR_ADMIN" || role === "HR_HEAD" || role === "CEO") && canReturn(role),
      disabled: !hasSelection,
      badge: hasSelection ? selectedIds.length : undefined,
    },
  ];

  const visibleActions = actions.filter(a => a.visible);

  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      "fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-xl border bg-card backdrop-blur px-3 py-2 shadow-lg flex gap-2 items-center",
      className
    )}>
      {visibleActions.map(a => (
        <button
          key={a.id}
          onClick={a.onClick}
          disabled={a.disabled}
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium transition-all relative",
            a.disabled 
              ? "opacity-40 cursor-not-allowed text-muted-foreground" 
              : "hover:bg-accent text-foreground hover:text-primary",
            a.badge && "pr-8"
          )}
        >
          {a.label}
          {a.badge && a.badge > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px] font-bold shadow-lg">
              {a.badge > 99 ? "99+" : a.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

