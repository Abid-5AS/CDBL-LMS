"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { UserManagement, type AdminUserRecord } from "./user-management";
import { PolicyPanel, type PolicyRecord } from "./policy-panel";
import { LogsPanel } from "./logs-panel";

export type AuditLogRecord = {
  id: number;
  actorEmail: string;
  action: string;
  targetEmail: string | null;
  details: unknown | null;
  createdAt: string;
};

type AdminDashboardProps = {
  initialUsers: AdminUserRecord[];
  initialPolicies: PolicyRecord[];
  initialLogs: AuditLogRecord[];
};

type TabId = "users" | "policies" | "logs";

const TABS: Array<{ id: TabId; label: string; description: string }> = [
  { id: "users", label: "Users", description: "Manage roles and directory access." },
  { id: "policies", label: "Policies", description: "Adjust leave thresholds and rules." },
  { id: "logs", label: "Audit Log", description: "Review recent administrative actions." },
];

export default function AdminDashboard({ initialUsers, initialPolicies, initialLogs }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>("users");
  const [users, setUsers] = useState(initialUsers);
  const [policies, setPolicies] = useState(initialPolicies);
  const [logs, setLogs] = useState(initialLogs);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  const [busyPolicyId, setBusyPolicyId] = useState<number | null>(null);

  const summary = useMemo(
    () => ({
      totalUsers: users.length,
      totalPolicies: policies.length,
      superAdmins: users.filter((user) => user.role === "CEO").length,
    }),
    [users, policies],
  );

  const appendLog = (entry: AuditLogRecord) => {
    setLogs((prev) => [entry, ...prev].slice(0, 100));
  };

  const handleUserRoleChange = async (id: number, nextRole: AdminUserRecord["role"]) => {
    setBusyUserId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
        credentials: "same-origin",
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error ?? "role_update_failed");
      }
      const payload = await res.json();
      const updated = payload?.item as AdminUserRecord | undefined;
      if (updated) {
        setUsers((prev) => prev.map((user) => (user.id === id ? { ...user, ...updated } : user)));
      }
      if (payload?.log) {
        appendLog(payload.log as AuditLogRecord);
      }
    } finally {
      setBusyUserId(null);
    }
  };

  const handlePolicyUpdate = async (
    id: number,
    patch: Partial<Omit<PolicyRecord, "id" | "leaveType" | "createdAt" | "updatedAt">>,
  ) => {
    setBusyPolicyId(id);
    try {
      const res = await fetch(`/api/admin/policies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
        credentials: "same-origin",
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error ?? "policy_update_failed");
      }
      const payload = await res.json();
      const updated = payload?.item as PolicyRecord | undefined;
      if (updated) {
        setPolicies((prev) => prev.map((policy) => (policy.id === id ? updated : policy)));
      }
      if (payload?.log) {
        appendLog(payload.log as AuditLogRecord);
      }
    } finally {
      setBusyPolicyId(null);
    }
  };

  const handleUserCreated = (user: AdminUserRecord, log?: AuditLogRecord) => {
    setUsers((prev) => [{ ...user }, ...prev]);
    if (log) appendLog(log);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Super Admin Console</h1>
          <p className="text-sm text-muted-foreground">
            Configure policies, manage user access, and monitor system activity.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Total users: {summary.totalUsers}</span>
          <span>Super admins: {summary.superAdmins}</span>
          <span>Policy rules: {summary.totalPolicies}</span>
        </div>
      </header>

      <nav className="flex flex-wrap items-center gap-2">
        {TABS.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <Button
              key={tab.id}
              type="button"
              variant={active ? "default" : "outline"}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </Button>
          );
        })}
      </nav>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="mb-6 text-sm text-muted-foreground">{TABS.find((tab) => tab.id === activeTab)?.description}</p>
        {activeTab === "users" ? (
          <UserManagement
            users={users}
            onRoleChange={handleUserRoleChange}
            onCreate={handleUserCreated}
            busyUserId={busyUserId}
          />
        ) : null}
        {activeTab === "policies" ? (
          <PolicyPanel policies={policies} onUpdatePolicy={handlePolicyUpdate} busyPolicyId={busyPolicyId} />
        ) : null}
        {activeTab === "logs" ? <LogsPanel logs={logs} /> : null}
      </section>
    </div>
  );
}
