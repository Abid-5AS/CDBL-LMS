"use client";

import { useState, useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { EmployeeDashboardData } from "@/lib/employee";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui";
import { Loader2 } from "lucide-react";
import { canAssignRole, type AppRole } from "@/lib/rbac";
import { updateEmployeeFromForm } from "@/app/actions/employee-actions";

type EmployeeEditFormProps = {
  employee: EmployeeDashboardData;
  viewerRole: AppRole;
};

export function EmployeeEditForm({
  employee,
  viewerRole,
}: EmployeeEditFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const name = formData.get("name") as string;
      const email = formData.get("email") as string;
      const department = formData.get("department") as string;
      const role = formData.get("role") as string;
      const empCode = formData.get("empCode") as string;

      // Client-side validation
      if (!name || name.length < 2) {
        return { success: false, error: "Name must be at least 2 characters" };
      }
      if (!email || !email.includes("@")) {
        return { success: false, error: "Invalid email address" };
      }
      if (!department || department.length < 1) {
        return { success: false, error: "Department is required" };
      }

      // Check role assignment permissions
      if (role !== employee.role) {
        if (!canAssignRole(viewerRole, role as AppRole)) {
          return { success: false, error: "You don't have permission to assign this role" };
        }
      }

      const result = await updateEmployeeFromForm(employee.id, formData);
      return result;
    },
    { success: false, error: null }
  );

  useEffect(() => {
    if (state.success) {
      toast.success("Employee updated successfully");
      setIsDirty(false);
      router.push(`/employees/${employee.id}`);
      router.refresh();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, employee.id, router]);

  const handleDiscard = () => {
    formRef.current?.reset();
    setIsDirty(false);
    toast.success("Changes discarded");
  };

  const handleInputChange = () => {
    setIsDirty(true);
  };

  const roleOptions: { value: AppRole; label: string }[] = [
    { value: "EMPLOYEE" as AppRole, label: "Employee" },
    { value: "DEPT_HEAD" as AppRole, label: "Manager" },
    { value: "HR_ADMIN" as AppRole, label: "HR Admin" },
    { value: "HR_HEAD" as AppRole, label: "HR Head" },
    { value: "CEO" as AppRole, label: "CEO" },
  ].filter((option) => canAssignRole(viewerRole, option.value));

  return (
    <div className="space-y-6 pb-24">
      {/* Breadcrumb */}
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/employees">Employee Directory</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/employees/${employee.id}`}>{employee.name}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Employee Information</CardTitle>
          <CardDescription>
            Update employee details and role information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} action={formAction} className="space-y-6" onChange={handleInputChange}>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="John Doe"
                  defaultValue={employee.name}
                  required
                  minLength={2}
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  defaultValue={employee.email}
                  required
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  name="department"
                  placeholder="Engineering"
                  defaultValue={employee.department || ""}
                  required
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  name="role"
                  defaultValue={employee.role as AppRole}
                  disabled={isPending}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  You can only assign roles within your permission level
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="empCode">Employee Code</Label>
                <Input
                  id="empCode"
                  name="empCode"
                  placeholder="EMP001"
                  defaultValue={employee.empCode || employee.id.toString()}
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Sticky footer - only show when dirty */}
            {isDirty && (
              <div className="sticky bottom-0 z-10 border-t border-border dark:border-border/50 bg-card dark:bg-card/90 p-4 -mx-4 -mb-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground dark:text-muted-foreground/80">
                    You have unsaved changes
                  </span>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDiscard}
                      disabled={isPending}
                    >
                      Discard
                    </Button>
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="bg-card-action hover:bg-card-action"
                    >
                      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
