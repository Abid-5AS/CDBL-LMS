"use client";

import { useState } from "react";
import { toast } from "sonner";

export type PolicyRecord = {
  id: number;
  leaveType: string;
  maxDays: number | null;
  minDays: number | null;
  noticeDays: number | null;
  carryLimit: number | null;
  createdAt: string;
  updatedAt: string;
};

type PolicyPanelProps = {
  policies: PolicyRecord[];
  onUpdatePolicy: (id: number, payload: Partial<Omit<PolicyRecord, "id" | "leaveType" | "createdAt" | "updatedAt">>) => Promise<void>;
  busyPolicyId: number | null;
};

const editableFields: Array<{ key: keyof PolicyRecord; label: string }> = [
  { key: "maxDays", label: "Max Days" },
  { key: "minDays", label: "Min Days" },
  { key: "noticeDays", label: "Notice Days" },
  { key: "carryLimit", label: "Carry Limit" },
];

export function PolicyPanel({ policies, onUpdatePolicy, busyPolicyId }: PolicyPanelProps) {
  const [version, setVersion] = useState(() => new Date().toISOString());

  const handleNumericChange = async (
    id: number,
    field: "maxDays" | "minDays" | "noticeDays" | "carryLimit",
    value: string,
  ) => {
    const nextValue = value === "" ? null : Number(value);
    if (nextValue !== null && Number.isNaN(nextValue)) return;

    try {
      await onUpdatePolicy(id, { [field]: nextValue ?? null });
      setVersion(new Date().toISOString());
      toast.success("Policy updated");
    } catch (error) {
      console.error(error);
      toast.error("Unable to update policy rule.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-secondary">Leave Policy Configuration</h2>
          <p className="text-sm text-muted-foreground">Tune leave limits and notice periods for each entitlement.</p>
        </div>
        <div className="text-xs text-muted-foreground">Last updated: {new Date(version).toLocaleString()}</div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border-strong bg-bg-primary shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-bg-secondary text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
            <tr>
              <th className="px-4 py-3">Leave Type</th>
              {editableFields.map((field) => (
                <th key={field.key} className="px-4 py-3">
                  {field.label}
                </th>
              ))}
              <th className="px-4 py-3 text-right">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {policies.map((policy) => {
              const updating = busyPolicyId === policy.id;
              return (
                <tr key={policy.id} className="hover:bg-bg-secondary/60">
                  <td className="px-4 py-3 font-medium text-text-secondary">{policy.leaveType}</td>
                  {editableFields.map((field) => {
                    const fieldKey = field.key as keyof PolicyRecord;
                    const value = policy[fieldKey];
                    return (
                      <td key={fieldKey} className="px-4 py-3">
                        <input
                          type="number"
                          min={0}
                          key={`${policy.id}-${fieldKey}-${value ?? ""}`}
                          defaultValue={value ?? ""}
                          onBlur={(event) => handleNumericChange(policy.id, fieldKey as any, event.target.value)}
                          className="w-full rounded-md border border-border-strong bg-bg-primary px-2 py-1 text-sm"
                          disabled={updating}
                        />
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                    {new Date(policy.updatedAt).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
