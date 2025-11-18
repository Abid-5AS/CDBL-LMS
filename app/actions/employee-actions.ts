"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditEmployee, canAssignRole, type AppRole } from "@/lib/rbac";

export async function updateEmployee(employeeId: number, updates: {
  name?: string;
  email?: string;
  department?: string;
  role?: string;
  empCode?: string;
}) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // Get the target employee to check their role
  const targetEmployee = await prisma.user.findUnique({
    where: { id: employeeId },
    select: { role: true, email: true },
  });

  if (!targetEmployee) {
    return { success: false, error: "Employee not found" };
  }

  // Check if user can edit this employee
  if (!canEditEmployee(user.role as AppRole, targetEmployee.role as AppRole)) {
    return { success: false, error: "Forbidden" };
  }

  // If role is being changed, check if user can assign that role
  if (updates.role && updates.role !== targetEmployee.role) {
    if (!canAssignRole(user.role as AppRole, updates.role as AppRole)) {
      return { success: false, error: "Cannot assign this role" };
    }
  }

  // Get original employee data for audit
  const originalEmployee = await prisma.user.findUnique({
    where: { id: employeeId },
    select: { name: true, email: true, department: true, role: true, empCode: true },
  });

  if (!originalEmployee) {
    return { success: false, error: "Employee not found" };
  }

  try {
    // Update the employee
    const updated = await prisma.user.update({
      where: { id: employeeId },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.email && { email: updates.email }),
        ...(updates.department !== undefined && { department: updates.department }),
        ...(updates.role && { role: updates.role }),
        ...(updates.empCode !== undefined && { empCode: updates.empCode }),
      },
    });

    // Calculate changed fields for audit
    const changedFieldsDetails: Record<string, { from: any; to: any }> = {};
    if (updates.name && updates.name !== originalEmployee.name) 
      changedFieldsDetails.name = { from: originalEmployee.name, to: updates.name };
    if (updates.email && updates.email !== originalEmployee.email) 
      changedFieldsDetails.email = { from: originalEmployee.email, to: updates.email };
    if (updates.department !== undefined && updates.department !== originalEmployee.department) 
      changedFieldsDetails.department = { from: originalEmployee.department, to: updates.department };
    if (updates.role && updates.role !== originalEmployee.role) 
      changedFieldsDetails.role = { from: originalEmployee.role, to: updates.role };
    if (updates.empCode !== undefined && updates.empCode !== originalEmployee.empCode) 
      changedFieldsDetails.empCode = { from: originalEmployee.empCode, to: updates.empCode };

    // Log audit trail with EMPLOYEE_EDIT action and changedFields
    await prisma.auditLog.create({
      data: {
        actorEmail: user.email,
        action: "EMPLOYEE_EDIT",
        targetEmail: updated.email,
        details: {
          changedFields: changedFieldsDetails,
          employeeId: employeeId,
        },
      },
    });

    // Automatic cache invalidation
    revalidatePath("/admin");
    revalidatePath("/employees");
    revalidatePath(`/employees/${employeeId}`);

    return {
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        empCode: updated.empCode,
        department: updated.department,
        role: updated.role,
      }
    };
  } catch (error) {
    console.error("updateEmployee error:", error);
    return { success: false, error: "Failed to update employee" };
  }
}