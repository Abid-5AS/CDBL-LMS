import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const cache = "no-store";

export async function GET() {
  const user = await getCurrentUser();

  // Allow CEO and SYSTEM_ADMIN
  if (!user || !["CEO", "SYSTEM_ADMIN"].includes(user.role as string)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      employeeCode: true,
      role: true,
      isActive: true,
      department: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      createdAt: true,
    },
  });

  return NextResponse.json({
    users,
    // Legacy format for backward compatibility
    items: users.map((item) => ({
      ...item,
      empCode: item.employeeCode,
      createdAt: item.createdAt.toISOString(),
    })),
  });
}
