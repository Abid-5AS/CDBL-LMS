import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";

export const cache = "no-store";

const ALLOWED_ROLES = ["HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN"];

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
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
  const department = searchParams.get("department");
  const search = searchParams.get("search");
  const leaveType = searchParams.get("leaveType");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  try {
    const userWhere: any = {};

    if (department) {
      userWhere.department = department;
    }

    if (search) {
      userWhere.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { empCode: { contains: search, mode: "insensitive" } },
      ];
    }

    const totalUsers = await prisma.user.count({ where: userWhere });

    const users = await prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        name: true,
        email: true,
        empCode: true,
        department: true,
        role: true,
        balances: {
          where: {
            year,
            ...(leaveType ? { type: leaveType as any } : {}),
          },
        },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const departments = await prisma.user.findMany({
      where: { department: { not: null } },
      select: { department: true },
      distinct: ["department"],
      orderBy: { department: "asc" },
    });

    return NextResponse.json({
      employees: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        empCode: u.empCode,
        department: u.department,
        role: u.role,
        balances: u.balances,
      })),
      pagination: {
        page,
        limit,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
      },
      departments: departments.map((d) => d.department).filter(Boolean),
      year,
    });
  } catch (err) {
    console.error("GET /api/admin/balance/all error:", err);
    return NextResponse.json(
      error("internal_error", "Failed to fetch balances", traceId),
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
