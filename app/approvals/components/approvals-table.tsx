"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import ApproveActions from "./approve-actions";

type ApprovalStep = {
  role: string;
  status: string;
  decidedByName?: string | null;
  decidedAt?: string | null;
  comment?: string | null;
};

type ApprovalItem = {
  id: string;
  type: string;
  start: string | null;
  end: string | null;
  requestedDays: number;
  reason: string;
  status: string;
  approvals: ApprovalStep[];
  currentStageIndex: number;
  requestedByName: string | null;
  requestedByEmail: string | null;
};

export function ApprovalsTable() {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const res = await fetch("/api/approvals");
      if (!res.ok) {
        throw new Error("Failed to fetch approvals");
      }
      const data = await res.json();
      setItems(data.items ?? []);
    } catch (err: any) {
      console.error(err);
      toast.error("Unable to load approvals");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <div className="text-sm text-slate-500">Loading approvals…</div>;
  }

  if (!items.length) {
    return <div className="text-sm text-slate-500">No approvals waiting on you right now.</div>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Employee</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Dates</th>
            <th className="px-4 py-3">Days</th>
            <th className="px-4 py-3">Reason</th>
            <th className="px-4 py-3">Stage</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => {
            const start = item.start ? new Date(item.start).toLocaleDateString() : "—";
            const end = item.end ? new Date(item.end).toLocaleDateString() : "—";
            const currentStep = item.approvals?.[item.currentStageIndex];
            return (
              <tr key={item.id} className="align-top">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{item.requestedByName ?? "Unknown"}</div>
                  {item.requestedByEmail && (
                    <div className="text-xs text-slate-500">{item.requestedByEmail}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-700">{item.type}</td>
                <td className="px-4 py-3 text-slate-700">
                  <div>{start}</div>
                  {start !== end && <div className="text-xs text-slate-500">to {end}</div>}
                </td>
                <td className="px-4 py-3 text-slate-700">{item.requestedDays}</td>
                <td className="px-4 py-3 text-slate-700 max-w-xs">
                  <div className="whitespace-pre-wrap break-words text-sm">{item.reason}</div>
                </td>
                <td className="px-4 py-3 text-slate-700">
                  <div className="font-medium capitalize">{currentStep?.role?.replace(/_/g, " ")}</div>
                  <div className="text-xs text-slate-500">{currentStep?.status?.toLowerCase()}</div>
                </td>
                <td className="px-4 py-3 text-right">
                  <ApproveActions id={item.id} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
