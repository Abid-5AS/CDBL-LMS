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
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      empCode: true,
      role: true,
      department: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    users,
    // Legacy format for backward compatibility
    items: users.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
  });
}
