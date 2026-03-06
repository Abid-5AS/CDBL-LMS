import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canViewAllRequests, getVisibleRoles, type AppRole } from "@/lib/rbac";

export const cache = "no-store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userRole = user.role as AppRole;

  // Only HR roles and managers can view all employees
  if (!canViewAllRequests(userRole)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Get visible roles for this user
  const visibleRoles = getVisibleRoles(userRole);

  // Build where clause with role and department filtering
  const where: any = {
    role: {
      in: visibleRoles,
    },
  };

  // DEPT_HEAD can only see employees in their own department
  if (userRole === "DEPT_HEAD" && user.department) {
    where.department = user.department;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const users = await prisma.user.findMany({
    where,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      empCode: true,
      department: true,
      role: true,
      // Fetch profile for phone/avatar info if we add it later
      profile: {
        select: {
          phone: true,
        }
      },
      // Fetch active leaves to determine status
      leaves: {
        where: {
          status: "APPROVED",
          startDate: { lte: today },
          endDate: { gte: today },
        },
        select: {
          id: true,
          type: true,
          endDate: true,
        },
        take: 1, // We only need to know if there IS one
      },
    },
  });

  return NextResponse.json({ users });
}

export const dynamic = "force-dynamic";
