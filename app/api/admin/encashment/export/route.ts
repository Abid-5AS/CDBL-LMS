import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";

export const cache = "no-store";

const ALLOWED_ROLES = ["HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN"];

/**
 * GET /api/admin/encashment/export
 * Export encashment requests as CSV
 * Query: status (optional) - filter by status
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
  const status = searchParams.get("status");

  const where: any = {};
  if (status) {
    where.status = status;
  }

  const requests = await prisma.encashmentRequest.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          email: true,
          empCode: true,
          department: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "id",
    "empCode",
    "name",
    "email",
    "department",
    "year",
    "daysRequested",
    "balanceAtRequest",
    "reason",
    "status",
    "createdAt",
    "approvedAt",
    "rejectionReason",
    "paymentDate",
    "paymentMethod",
    "paymentReference",
  ];

  const escape = (v: string | number | null | undefined) => {
    if (v == null) return "";
    const s = String(v);
    return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const rows = requests.map((r) => [
    r.id,
    r.user.empCode ?? "",
    r.user.name,
    r.user.email,
    r.user.department ?? "",
    r.year,
    r.daysRequested,
    r.balanceAtRequest,
    r.reason ?? "",
    r.status,
    r.createdAt.toISOString(),
    r.approvedAt?.toISOString() ?? "",
    r.rejectionReason ?? "",
    r.paymentDate?.toISOString().split("T")[0] ?? "",
    r.paymentMethod ?? "",
    r.paymentReference ?? "",
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="encashment_export_${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}

export const dynamic = "force-dynamic";
