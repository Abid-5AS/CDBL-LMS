import { NextRequest, NextResponse } from "next/server";
import { getEmployeeDashboardData } from "@/lib/employee";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditEmployee, canAssignRole, type AppRole } from "@/lib/rbac";

export const cache = "no-store";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const employeeId = Number(id);

  if (Number.isNaN(employeeId)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const data = await getEmployeeDashboardData(employeeId);
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const employeeId = Number(id);

  if (Number.isNaN(employeeId)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  // Get the target employee to check their role
  const targetEmployee = await prisma.user.findUnique({
    where: { id: employeeId },
    select: { role: true, email: true },
  });

  if (!targetEmployee) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Check if user can edit this employee
  if (!canEditEmployee(user.role as AppRole, targetEmployee.role as AppRole)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { name, email, department, role, empCode } = body;

  // If role is being changed, check if user can assign that role
  if (role && role !== targetEmployee.role) {
    if (!canAssignRole(user.role as AppRole, role as AppRole)) {
      return NextResponse.json({ error: "Cannot assign this role" }, { status: 403 });
    }
  }

  // Update the employee
  const updated = await prisma.user.update({
    where: { id: employeeId },
    data: {
      ...(name && { name }),
      ...(email && { email }),
      ...(department !== undefined && { department }),
      ...(role && { role }),
      ...(empCode !== undefined && { empCode }),
    },
  });

  // Log audit trail
  await prisma.auditLog.create({
    data: {
      actorEmail: user.email,
      action: "UPDATE_EMPLOYEE",
      targetEmail: updated.email,
      details: {
        changes: body,
        previousRole: targetEmployee.role,
        newRole: role || targetEmployee.role,
      },
    },
  });

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    empCode: updated.empCode,
    department: updated.department,
    role: updated.role,
  });
}
