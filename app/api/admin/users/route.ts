import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  noStore();
  const user = await getCurrentUser();
  if (!user || (user.role as string) !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
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
    items: users.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
  });
}
