import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canViewAllRequests } from "@/lib/rbac";

export const cache = "no-store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Only HR Admin and Super Admin can view all employees
  if (!canViewAllRequests(user.role as "EMPLOYEE" | "HR_ADMIN" | "SUPER_ADMIN")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
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

export async function POST(request: NextRequest) {

  try {
    const payload = await request.json().catch(() => ({} as Record<string, unknown>));
    const qRaw = typeof payload.q === "string" ? payload.q : "";
    const q = qRaw.trim();
    const limitRaw = typeof payload.limit === "number" || typeof payload.limit === "string" ? Number(payload.limit) : NaN;
    const take = Number.isNaN(limitRaw) ? 20 : Math.min(Math.max(limitRaw, 1), 50);

    const filters = q
      ? {
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
          ],
        }
      : {};

    const items = await prisma.user.findMany({
      where: filters,
      orderBy: { name: "asc" },
      take,
      select: { id: true, name: true, email: true, role: true },
    });

    const mapped = items.map((u) => ({
      id: String(u.id),
      name: u.name,
      email: u.email,
      role: u.role,
    }));

    return NextResponse.json({ items: mapped });
  } catch (error) {
    console.error("POST /api/auth/users failed", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
