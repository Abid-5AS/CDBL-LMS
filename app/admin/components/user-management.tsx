"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type AdminUserRecord = {
  id: number;
  name: string;
  email: string;
  empCode: string | null;
  role: "EMPLOYEE" | "HR_ADMIN" | "SUPER_ADMIN";
  department: string | null;
  createdAt: string;
};

const ROLE_OPTIONS: Array<AdminUserRecord["role"]> = ["EMPLOYEE", "HR_ADMIN", "SUPER_ADMIN"];

type UserManagementProps = {
  users: AdminUserRecord[];
  onRoleChange: (id: number, nextRole: AdminUserRecord["role"]) => Promise<void>;
  busyUserId: number | null;
};

export function UserManagement({ users, onRoleChange, busyUserId }: UserManagementProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((user) => {
      return (
        user.name.toLowerCase().includes(needle) ||
        user.email.toLowerCase().includes(needle) ||
        (user.empCode?.toLowerCase().includes(needle) ?? false)
      );
    });
  }, [users, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">User Management</h2>
          <p className="text-sm text-muted-foreground">Assign roles and manage departments for each account.</p>
        </div>
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search name, email, or code..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Employee Code</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((user) => {
              const updating = busyUserId === user.id;
              return (
                <tr key={user.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-slate-900">{user.name}</td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3 text-slate-600">{user.empCode ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{user.department ?? "—"}</td>
                  <td className="px-4 py-3">
                    <select
                      className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                      value={user.role}
                      onChange={async (event) => {
                        const nextRole = event.target.value as AdminUserRecord["role"];
                        if (nextRole === user.role) return;
                        try {
                          await onRoleChange(user.id, nextRole);
                          toast.success(`Updated role for ${user.name} to ${nextRole}`);
                        } catch (error) {
                          console.error(error);
                          toast.error("Unable to update role.");
                        }
                      }}
                      disabled={updating}
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {role.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" disabled>
                      Details
                    </Button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No users match your search.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
