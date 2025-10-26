export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();
    const limitParam = Number(searchParams.get("limit") ?? "20");
    const take = Number.isNaN(limitParam) ? 20 : Math.min(Math.max(limitParam, 1), 50);

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
    console.error("GET /api/auth/users failed", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
