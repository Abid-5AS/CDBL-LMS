import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const cache = "no-store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const allowedRoles = ["HR_ADMIN", "HR_HEAD", "CEO"];
  if (!allowedRoles.includes(user.role as string)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    items: logs.map((log) => ({
      ...log,
      createdAt: log.createdAt.toISOString(),
    })),
  });
}
