import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ImportExportService } from "@/lib/services/import-export.service";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";

export const cache = "no-store";

const ALLOWED_ROLES = ["HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN"];

/**
 * GET /api/admin/users/export
 * Export employees as CSV (import-ready format)
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

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      name: true,
      email: true,
      empCode: true,
      role: true,
      department: true,
      joinDate: true,
    },
  });

  const csv = ImportExportService.exportEmployees(users);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="employees_export.csv"',
    },
  });
}

export const dynamic = "force-dynamic";
