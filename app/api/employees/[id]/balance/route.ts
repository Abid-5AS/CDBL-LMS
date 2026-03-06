import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";

export const cache = "no-store";

const ADMIN_ROLES = ["HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN"];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const traceId = getTraceId(req as any);
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(error("unauthorized", undefined, traceId), { status: 401 });
  }

  const { id } = await params;
  const employeeId = parseInt(id);

  if (isNaN(employeeId)) {
    return NextResponse.json(
      error("invalid_id", "Invalid employee ID", traceId),
      { status: 400 }
    );
  }

  const isSelf = user.id === employeeId;
  if (!isSelf && !ADMIN_ROLES.includes(user.role)) {
    return NextResponse.json(error("forbidden", "Access denied", traceId), { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

  try {
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        name: true,
        email: true,
        empCode: true,
        department: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        error("not_found", "Employee not found", traceId),
        { status: 404 }
      );
    }

    const balances = await prisma.balance.findMany({
      where: { userId: employeeId, year },
      orderBy: { type: "asc" },
    });

    return NextResponse.json({ employee, balances });
  } catch (err) {
    console.error(`GET /api/employees/${id}/balance error:`, err);
    return NextResponse.json(
      error("internal_error", "Failed to fetch employee balance", traceId),
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
