"use client";

import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CompletePagination } from "@/components/shared/pagination/Pagination";
import { CreateUserDialog } from "./create-user-dialog";
import type { AuditLogRecord } from "./admin-dashboard";

export type AdminUserRecord = {
  id: number;
  name: string;
  email: string;
  empCode: string | null;
  role: "EMPLOYEE" | "DEPT_HEAD" | "HR_ADMIN" | "HR_HEAD" | "CEO" | "SYSTEM_ADMIN";
  department: string | null;
  createdAt: string;
};

const ROLE_OPTIONS: Array<AdminUserRecord["role"]> = ["EMPLOYEE", "DEPT_HEAD", "HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN"];
const PAGE_SIZE = 20;

type UserManagementProps = {
  users: AdminUserRecord[];
  onRoleChange: (id: number, nextRole: AdminUserRecord["role"]) => Promise<void>;
  onCreate: (user: AdminUserRecord, log?: AuditLogRecord) => void;
  busyUserId: number | null;
};

export function UserManagement({ users, onRoleChange, onCreate, busyUserId }: UserManagementProps) {
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

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

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    return filtered.slice(startIndex, endIndex);
  }, [filtered, currentPage]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-secondary">User Management</h2>
          <p className="text-sm text-muted-foreground">Assign roles and manage departments for each account.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <div className="sm:w-64">
            <Input
              placeholder="Search name, email, or code..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <CreateUserDialog onCreated={onCreate} />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border-strong bg-bg-primary shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-bg-secondary text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
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
            {paginatedUsers.map((user) => {
              const updating = busyUserId === user.id;
              return (
                <tr key={user.id} className="hover:bg-bg-secondary/60">
                  <td className="px-4 py-3 font-medium text-text-secondary">{user.name}</td>
                  <td className="px-4 py-3 text-text-secondary">{user.email}</td>
                  <td className="px-4 py-3 text-text-secondary">{user.empCode ?? "—"}</td>
                  <td className="px-4 py-3 text-text-secondary">{user.department ?? "—"}</td>
                  <td className="px-4 py-3">
                    <select
                      className="w-full rounded-md border border-border-strong bg-bg-primary px-2 py-1 text-sm"
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
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No users match your search.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <CompletePagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={PAGE_SIZE}
          totalItems={filtered.length}
          onPageChange={setCurrentPage}
          showFirstLast={true}
        />
      )}
    </div>
  );
}
