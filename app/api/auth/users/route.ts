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

  const users = await prisma.user.findMany({
    where: {
      role: {
        in: visibleRoles,
      },
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      empCode: true,
      department: true,
      role: true,
    },
  });

  return NextResponse.json({ users });
}
