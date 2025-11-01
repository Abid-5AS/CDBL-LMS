"use client";

import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AdminUserRecord } from "./user-management";
import type { AuditLogRecord } from "./admin-dashboard";

const FormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  empCode: z.string().min(2, "Employee code required"),
  department: z.string().optional(),
  role: z.enum(["EMPLOYEE", "DEPT_HEAD", "HR_ADMIN", "HR_HEAD", "CEO"] as const),
});

type CreateUserDialogProps = {
  onCreated: (user: AdminUserRecord, log?: AuditLogRecord) => void;
};

export function CreateUserDialog({ onCreated }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    empCode: "",
    department: "",
    role: "EMPLOYEE" as "EMPLOYEE" | "DEPT_HEAD" | "HR_ADMIN" | "HR_HEAD" | "CEO",
  });
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setForm({ name: "", email: "", empCode: "", department: "", role: "EMPLOYEE" });
  };

  const handleSubmit = async () => {
    const parsed = FormSchema.safeParse({
      ...form,
      department: form.department?.trim() ? form.department.trim() : undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(parsed.data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.user) {
        throw new Error(json?.error ?? "create_failed");
      }
      const createdUser = json.user as AdminUserRecord;
      const createdLog = json.log as AuditLogRecord | undefined;
      onCreated(
        {
          ...createdUser,
          department: createdUser.department ?? null,
          empCode: createdUser.empCode ?? null,
        },
        createdLog,
      );
      toast.success(`User ${json.user.email} created`);
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Unable to create user");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && setOpen(next)}>
      <DialogTrigger asChild>
        <Button type="button">Add User</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create new user</DialogTitle>
          <DialogDescription>Provision a new account and assign an initial role.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="user-name">Full name</Label>
            <Input
              id="user-name"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Mahfuz Rahman"
              disabled={submitting}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="user-email">Email</Label>
            <Input
              id="user-email"
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="mahfuz@cdbl.com"
              disabled={submitting}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="user-code">Employee code</Label>
            <Input
              id="user-code"
              value={form.empCode}
              onChange={(event) => setForm((prev) => ({ ...prev, empCode: event.target.value }))}
              placeholder="EMP123"
              disabled={submitting}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="user-department">Department</Label>
            <Input
              id="user-department"
              value={form.department}
              onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))}
              placeholder="Finance"
              disabled={submitting}
            />
          </div>
          <div className="grid gap-2">
            <Label>Role</Label>
            <Select
              value={form.role}
              onValueChange={(value) => setForm((prev) => ({ ...prev, role: value as typeof prev.role }))}
              disabled={submitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EMPLOYEE">Employee</SelectItem>
                <SelectItem value="DEPT_HEAD">Department Head</SelectItem>
                <SelectItem value="HR_ADMIN">HR Admin</SelectItem>
                <SelectItem value="HR_HEAD">HR Head</SelectItem>
                <SelectItem value="CEO">CEO</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
