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
  const formatImportReady = searchParams.get("format") === "import";

  try {
    const userWhere: any = {};
    if (department) {
      userWhere.department = department;
    }

    const users = await prisma.user.findMany({
      where: userWhere,
      select: {
        name: true,
        email: true,
        empCode: true,
        department: true,
        balances: {
          where: { year },
          orderBy: { type: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    const headers = formatImportReady
      ? ["empCode", "leaveType", "year", "opening", "accrued", "used"]
      : [
          "empCode",
          "Employee Name",
          "Email",
          "Department",
          "Leave Type",
          "Year",
          "Opening",
          "Accrued",
          "Used",
          "Closing",
        ];

    const rows: string[][] = [];

    for (const u of users) {
      if (u.balances.length === 0) {
        if (formatImportReady) {
          // Skip users with no balances in import-ready format
          continue;
        } else {
          rows.push([
            u.empCode || "",
            u.name,
            u.email,
            u.department || "",
            "EARNED",
            String(year),
            "0",
            "0",
            "0",
            "0",
          ]);
        }
      } else {
        for (const b of u.balances) {
          if (formatImportReady) {
            rows.push([
              u.empCode || u.email,
              b.type,
              String(b.year),
              String(b.opening),
              String(b.accrued),
              String(b.used),
            ]);
          } else {
            rows.push([
              u.empCode || "",
              u.name,
              u.email,
              u.department || "",
              b.type,
              String(b.year),
              String(b.opening),
              String(b.accrued),
              String(b.used),
              String(b.closing),
            ]);
          }
        }
      }
    }

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="balance_export_${year}.csv"`,
      },
    });
  } catch (err) {
    console.error("GET /api/admin/balance/export error:", err);
    return NextResponse.json(
      error("internal_error", "Failed to export balances", traceId),
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
