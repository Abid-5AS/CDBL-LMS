"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { EmployeeDashboardData } from "@/lib/employee";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
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
import { canAssignRole, type AppRole } from "@/lib/rbac";

const employeeEditSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  department: z.string().min(1, "Department is required"),
  role: z.enum(["EMPLOYEE", "DEPT_HEAD", "HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN"]),
  empCode: z.string().optional(),
});

type EmployeeEditFormProps = {
  employee: EmployeeDashboardData;
  viewerRole: AppRole;
};

export function EmployeeEditForm({
  employee,
  viewerRole,
}: EmployeeEditFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(employeeEditSchema),
    defaultValues: {
      name: employee.name,
      email: employee.email,
      department: employee.department || "",
      role: employee.role as AppRole,
      empCode: employee.id.toString(), // Using ID as empCode for now
    },
  });

  const onSubmit = async (values: z.infer<typeof employeeEditSchema>) => {
    // Check if role can be assigned
    if (values.role !== employee.role) {
      if (!canAssignRole(viewerRole, values.role)) {
        toast.error("You don't have permission to assign this role");
        return;
      }
    }

    setIsSubmitting(true);

    // Calculate changed fields for audit log
    const changedFields: Record<string, { from: any; to: any }> = {};
    if (values.name !== employee.name)
      changedFields.name = { from: employee.name, to: values.name };
    if (values.email !== employee.email)
      changedFields.email = { from: employee.email, to: values.email };
    if (values.department !== (employee.department || ""))
      changedFields.department = {
        from: employee.department,
        to: values.department,
      };
    if (values.role !== employee.role)
      changedFields.role = { from: employee.role, to: values.role };
    if (values.empCode !== employee.id.toString())
      changedFields.empCode = {
        from: employee.id.toString(),
        to: values.empCode,
      };

    try {
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          changedFields: Object.keys(changedFields),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to update employee");
        return;
      }

      toast.success("Employee updated successfully");
      router.push(`/employees/${employee.id}`);
      router.refresh();
    } catch (error) {
      console.error("Error updating employee:", error);
      toast.error("An error occurred while updating the employee");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscard = () => {
    form.reset();
    toast.success("Changes discarded");
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input placeholder="Engineering" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roleOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        You can only assign roles within your permission level
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="empCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="EMP001"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Sticky footer - only show when dirty */}
              {form.formState.isDirty && (
                <div className="sticky bottom-0 z-10 border-t border-border-strong bg-bg-primary p-4 -mx-4 -mb-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">
                      You have unsaved changes
                    </span>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleDiscard}
                        disabled={isSubmitting}
                      >
                        Discard
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-card-action hover:bg-card-action"
                      >
                        {isSubmitting ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
