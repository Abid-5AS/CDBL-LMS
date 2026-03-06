import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";

export const cache = "no-store";

const ALLOWED_ROLES = ["HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN"];

/**
 * GET /api/admin/holidays/export
 * Export holidays as CSV
 * Query: year (optional) - filter by year
 */
export async function GET(req: NextRequest) {
  const traceId = getTraceId(req as any);
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(error("unauthorized", undefined, traceId), { status: 401 });
  }

  if (!ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json(error("forbidden", "Access denied", traceId), { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year")
    ? parseInt(searchParams.get("year")!, 10)
    : undefined;

  const where = year
    ? {
        date: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      }
    : {};

  const holidays = await prisma.holiday.findMany({
    where,
    orderBy: { date: "asc" },
  });

  const headers = ["date", "name", "isOptional"];
  const rows = holidays.map((h) => [
    h.date.toISOString().split("T")[0],
    h.name,
    h.isOptional ? "true" : "false",
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => (c.includes(",") ? `"${c}"` : c)).join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="holidays_${year || "all"}.csv"`,
    },
  });
}

export const dynamic = "force-dynamic";
