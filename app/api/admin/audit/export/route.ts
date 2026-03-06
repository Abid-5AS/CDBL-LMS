import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";

export const cache = "no-store";

/**
 * GET /api/admin/audit/export
 * Export audit logs as CSV (SYSTEM_ADMIN only)
 * Query: limit (optional, default 1000), from, to (date filters)
 */
export async function GET(req: NextRequest) {
  const traceId = getTraceId(req as any);
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(error("unauthorized", undefined, traceId), { status: 401 });
  }

  const allowedRoles = ["CEO", "SYSTEM_ADMIN"];
  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json(error("forbidden", "Access denied", traceId), { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "1000", 10), 10000);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: any = {};
  if (from) {
    where.createdAt = { ...where.createdAt, gte: new Date(from) };
  }
  if (to) {
    where.createdAt = { ...where.createdAt, lt: new Date(to) };
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const headers = ["id", "actorEmail", "action", "targetEmail", "details", "createdAt"];

  const escape = (v: string | number | null | undefined) => {
    if (v == null) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const rows = logs.map((l) => [
    l.id,
    l.actorEmail,
    l.action,
    l.targetEmail ?? "",
    l.details ? JSON.stringify(l.details) : "",
    l.createdAt.toISOString(),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="audit_logs_${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}

export const dynamic = "force-dynamic";
