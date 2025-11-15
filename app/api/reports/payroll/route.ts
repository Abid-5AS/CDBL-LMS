/**
 * Payroll Export API
 * Endpoint: GET /api/reports/payroll
 *
 * Generates monthly payroll report with:
 * - LWP (Leave Without Pay) deductions
 * - EL Encashment payments
 * - Department-wise summary
 *
 * Export formats: CSV, Excel-compatible CSV
 * Access: HR_ADMIN, HR_HEAD, SYSTEM_ADMIN
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeToDhakaMidnight } from "@/lib/date-utils";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";

export const cache = "no-store";

/**
 * GET /api/reports/payroll
 * Query params:
 * - year: number (required)
 * - month: number (1-12, required)
 * - department: string (optional)
 * - format: 'csv' | 'excel-csv' (default: 'excel-csv')
 */
export async function GET(req: NextRequest) {
  const traceId = getTraceId(req as any);
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(error("unauthorized", undefined, traceId), { status: 401 });
  }

  // Only HR_ADMIN, HR_HEAD, and SYSTEM_ADMIN can export payroll data
  const allowedRoles = ["HR_ADMIN", "HR_HEAD", "SYSTEM_ADMIN"];
  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json(
      error("forbidden", "Only HR Admin, HR Head, or System Admin can export payroll data", traceId),
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);

  // Parse and validate parameters
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");
  const departmentParam = searchParams.get("department");
  const format = searchParams.get("format") || "excel-csv";

  if (!yearParam || !monthParam) {
    return NextResponse.json(
      error("validation_error", "Year and month are required parameters", traceId),
      { status: 400 }
    );
  }

  const year = parseInt(yearParam);
  const month = parseInt(monthParam);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json(
      error("validation_error", "Invalid year or month", traceId),
      { status: 400 }
    );
  }

  // Calculate date range for the month
  const startDate = normalizeToDhakaMidnight(new Date(year, month - 1, 1));
  const endDate = normalizeToDhakaMidnight(new Date(year, month, 0)); // Last day of month

  try {
    // 1. Get LWP (Leave Without Pay) data for the month
    const lwpLeaves = await prisma.leaveRequest.findMany({
      where: {
        type: "EXTRAWITHOUTPAY",
        status: "APPROVED",
        OR: [
          {
            // Leave started in this month
            startDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            // Leave ongoing during this month
            AND: [
              { startDate: { lt: startDate } },
              { endDate: { gte: startDate } },
            ],
          },
        ],
        ...(departmentParam && departmentParam !== "all" ? {
          requester: { department: departmentParam },
        } : {}),
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            empCode: true,
            department: true,
          },
        },
      },
      orderBy: [
        { requester: { department: "asc" } },
        { requester: { name: "asc" } },
      ],
    });

    // 2. Get EL Encashment data for the month
    const encashmentRequests = await prisma.encashmentRequest.findMany({
      where: {
        status: "APPROVED",
        approvedAt: {
          gte: startDate,
          lte: endDate,
        },
        ...(departmentParam && departmentParam !== "all" ? {
          employee: { department: departmentParam },
        } : {}),
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            empCode: true,
            department: true,
          },
        },
      },
      orderBy: [
        { employee: { department: "asc" } },
        { employee: { name: "asc" } },
      ],
    });

    // 3. Calculate LWP days for each employee in the month
    const lwpByEmployee = new Map<number, {
      employee: typeof lwpLeaves[0]["requester"];
      totalLWPDays: number;
      leaves: Array<{
        id: number;
        startDate: Date;
        endDate: Date;
        daysInMonth: number;
      }>;
    }>();

    for (const leave of lwpLeaves) {
      // Calculate how many days of this leave fall within the month
      const leaveStart = normalizeToDhakaMidnight(leave.startDate);
      const leaveEnd = normalizeToDhakaMidnight(leave.endDate);

      const effectiveStart = leaveStart > startDate ? leaveStart : startDate;
      const effectiveEnd = leaveEnd < endDate ? leaveEnd : endDate;

      const daysInMonth = Math.floor(
        (effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

      if (!lwpByEmployee.has(leave.requesterId)) {
        lwpByEmployee.set(leave.requesterId, {
          employee: leave.requester,
          totalLWPDays: 0,
          leaves: [],
        });
      }

      const record = lwpByEmployee.get(leave.requesterId)!;
      record.totalLWPDays += daysInMonth;
      record.leaves.push({
        id: leave.id,
        startDate: leave.startDate,
        endDate: leave.endDate,
        daysInMonth,
      });
    }

    // 4. Build combined payroll records
    const payrollRecords: Array<{
      empCode: string;
      employeeName: string;
      email: string;
      department: string;
      lwpDays: number;
      lwpDeduction: string;
      encashmentDays: number;
      encashmentPayment: string;
      netAdjustment: string;
      remarks: string;
    }> = [];

    // Add all employees with LWP
    for (const [employeeId, lwpData] of lwpByEmployee) {
      const encashment = encashmentRequests.find((e) => e.employeeId === employeeId);

      payrollRecords.push({
        empCode: lwpData.employee.empCode || `EMP-${employeeId}`,
        employeeName: lwpData.employee.name,
        email: lwpData.employee.email,
        department: lwpData.employee.department || "N/A",
        lwpDays: lwpData.totalLWPDays,
        lwpDeduction: `${lwpData.totalLWPDays} day(s)`,
        encashmentDays: encashment?.daysRequested || 0,
        encashmentPayment: encashment ? `${encashment.daysRequested} day(s)` : "0",
        netAdjustment: encashment
          ? `+${encashment.daysRequested - lwpData.totalLWPDays} day(s)`
          : `-${lwpData.totalLWPDays} day(s)`,
        remarks: lwpData.leaves.map((l) => `LWP-${l.id}: ${l.daysInMonth}d`).join("; "),
      });
    }

    // Add employees with only encashment (no LWP)
    for (const encashment of encashmentRequests) {
      if (!lwpByEmployee.has(encashment.employeeId)) {
        payrollRecords.push({
          empCode: encashment.employee.empCode || `EMP-${encashment.employeeId}`,
          employeeName: encashment.employee.name,
          email: encashment.employee.email,
          department: encashment.employee.department || "N/A",
          lwpDays: 0,
          lwpDeduction: "0",
          encashmentDays: encashment.daysRequested,
          encashmentPayment: `${encashment.daysRequested} day(s)`,
          netAdjustment: `+${encashment.daysRequested} day(s)`,
          remarks: `Encashment-${encashment.id}: ${encashment.daysRequested}d`,
        });
      }
    }

    // Sort by department, then employee name
    payrollRecords.sort((a, b) => {
      if (a.department !== b.department) {
        return a.department.localeCompare(b.department);
      }
      return a.employeeName.localeCompare(b.employeeName);
    });

    // 5. Generate CSV output
    const monthName = new Date(year, month - 1, 1).toLocaleString("default", { month: "long" });
    const headers = [
      "Employee Code",
      "Employee Name",
      "Email",
      "Department",
      "LWP Days",
      "LWP Deduction",
      "Encashment Days",
      "Encashment Payment",
      "Net Adjustment",
      "Remarks",
    ];

    const rows = payrollRecords.map((record) => [
      record.empCode,
      record.employeeName,
      record.email,
      record.department,
      record.lwpDays.toString(),
      record.lwpDeduction,
      record.encashmentDays.toString(),
      record.encashmentPayment,
      record.netAdjustment,
      record.remarks,
    ]);

    // Add summary row
    const totalLWPDays = payrollRecords.reduce((sum, r) => sum + r.lwpDays, 0);
    const totalEncashmentDays = payrollRecords.reduce((sum, r) => sum + r.encashmentDays, 0);
    rows.push([
      "",
      "",
      "",
      "TOTAL",
      totalLWPDays.toString(),
      `${totalLWPDays} day(s)`,
      totalEncashmentDays.toString(),
      `${totalEncashmentDays} day(s)`,
      `${totalEncashmentDays - totalLWPDays > 0 ? "+" : ""}${totalEncashmentDays - totalLWPDays} day(s)`,
      "",
    ]);

    // Format CSV based on export type
    let csvContent: string;

    if (format === "excel-csv") {
      // Excel-compatible CSV with BOM for UTF-8
      const bom = "\uFEFF";
      csvContent = bom + [
        `"CDBL Leave Management System - Payroll Report"`,
        `"Period: ${monthName} ${year}"`,
        `"Generated: ${new Date().toLocaleString()}"`,
        `"Generated By: ${user.name} (${user.email})"`,
        "",
        headers.map((h) => `"${h}"`).join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\r\n"); // Windows line endings for Excel
    } else {
      // Standard CSV
      csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")),
      ].join("\n");
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorEmail: user.email,
        action: "PAYROLL_EXPORT",
        targetEmail: user.email,
        details: {
          year,
          month: monthName,
          department: departmentParam || "All",
          format,
          recordCount: payrollRecords.length,
          totalLWPDays,
          totalEncashmentDays,
        },
      },
    });

    const filename = `payroll-report-${year}-${month.toString().padStart(2, "0")}-${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": format === "excel-csv" ? "text/csv; charset=utf-8" : "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Payroll export error:", err);
    return NextResponse.json(
      error("internal_error", "Failed to generate payroll export", traceId),
      { status: 500 }
    );
  }
}
