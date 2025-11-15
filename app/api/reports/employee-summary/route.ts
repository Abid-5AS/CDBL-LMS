/**
 * Employee-wise Leave Summary Export API
 * Endpoint: GET /api/reports/employee-summary
 *
 * Generates comprehensive employee-wise leave summary with:
 * - Employee details (name, code, department, email)
 * - Opening balance, accrued, used, closing balance
 * - Leave breakdown by type
 * - Leave history for the period
 * - Encashment requests
 *
 * Export formats: CSV, Excel-compatible CSV
 * Access: HR_ADMIN, HR_HEAD, DEPT_HEAD, SYSTEM_ADMIN
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeToDhakaMidnight } from "@/lib/date-utils";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";

export const cache = "no-store";

/**
 * GET /api/reports/employee-summary
 * Query params:
 * - year: number (required)
 * - department: string (optional)
 * - format: 'csv' | 'excel-csv' (default: 'excel-csv')
 * - includeBalances: boolean (default: true)
 */
export async function GET(req: NextRequest) {
  const traceId = getTraceId(req as any);
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(error("unauthorized", undefined, traceId), { status: 401 });
  }

  // Allow HR roles and Dept Heads
  const allowedRoles = ["HR_ADMIN", "HR_HEAD", "DEPT_HEAD", "SYSTEM_ADMIN"];
  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json(
      error("forbidden", "Only HR staff and Department Heads can export employee summaries", traceId),
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);

  // Parse parameters
  const yearParam = searchParams.get("year");
  const departmentParam = searchParams.get("department");
  const format = searchParams.get("format") || "excel-csv";
  const includeBalances = searchParams.get("includeBalances") !== "false";

  if (!yearParam) {
    return NextResponse.json(
      error("validation_error", "Year parameter is required", traceId),
      { status: 400 }
    );
  }

  const year = parseInt(yearParam);

  if (isNaN(year)) {
    return NextResponse.json(
      error("validation_error", "Invalid year", traceId),
      { status: 400 }
    );
  }

  try {
    // Build where clause for employees
    const employeeWhere: any = {
      role: "EMPLOYEE",
    };

    // Dept heads can only see their department
    if (user.role === "DEPT_HEAD") {
      employeeWhere.department = user.department;
    } else if (departmentParam && departmentParam !== "all") {
      employeeWhere.department = departmentParam;
    }

    // Get all employees
    const employees = await prisma.user.findMany({
      where: employeeWhere,
      select: {
        id: true,
        name: true,
        email: true,
        empCode: true,
        department: true,
        joinDate: true,
      },
      orderBy: [
        { department: "asc" },
        { name: "asc" },
      ],
    });

    // Get balances for the year (if requested)
    const balances = includeBalances
      ? await prisma.balance.findMany({
          where: {
            userId: { in: employees.map((e) => e.id) },
            year,
          },
        })
      : [];

    // Get approved leaves for the year
    const startOfYear = normalizeToDhakaMidnight(new Date(year, 0, 1));
    const endOfYear = normalizeToDhakaMidnight(new Date(year, 11, 31));

    const leaves = await prisma.leaveRequest.findMany({
      where: {
        requesterId: { in: employees.map((e) => e.id) },
        status: "APPROVED",
        startDate: { gte: startOfYear, lte: endOfYear },
      },
      select: {
        requesterId: true,
        type: true,
        workingDays: true,
      },
    });

    // Get encashment requests for the year
    const encashments = await prisma.encashmentRequest.findMany({
      where: {
        employeeId: { in: employees.map((e) => e.id) },
        status: "APPROVED",
        approvedAt: { gte: startOfYear, lte: endOfYear },
      },
      select: {
        employeeId: true,
        daysRequested: true,
      },
    });

    // Process data for each employee
    const employeeSummaries = employees.map((employee) => {
      // Get balances for this employee
      const empBalances = balances.filter((b) => b.userId === employee.id);

      // Calculate total balance metrics
      const totalOpening = empBalances.reduce((sum, b) => sum + (b.opening || 0), 0);
      const totalAccrued = empBalances.reduce((sum, b) => sum + (b.accrued || 0), 0);
      const totalUsed = empBalances.reduce((sum, b) => sum + (b.used || 0), 0);
      const totalClosing = empBalances.reduce((sum, b) => sum + (b.closing || 0), 0);

      // Get leaves for this employee
      const empLeaves = leaves.filter((l) => l.requesterId === employee.id);

      // Break down by leave type
      const leavesByType: Record<string, number> = {};
      for (const leave of empLeaves) {
        const type = leave.type;
        leavesByType[type] = (leavesByType[type] || 0) + (leave.workingDays || 0);
      }

      // Total leave days taken
      const totalDaysTaken = empLeaves.reduce((sum, l) => sum + (l.workingDays || 0), 0);

      // Encashment days
      const empEncashments = encashments.filter((e) => e.employeeId === employee.id);
      const totalEncashed = empEncashments.reduce((sum, e) => sum + (e.daysRequested || 0), 0);

      // Tenure in years
      const tenure = employee.joinDate
        ? Math.floor(
            (new Date(year, 11, 31).getTime() - new Date(employee.joinDate).getTime()) /
              (1000 * 60 * 60 * 24 * 365.25)
          )
        : 0;

      return {
        empCode: employee.empCode || `EMP-${employee.id}`,
        name: employee.name,
        email: employee.email,
        department: employee.department || "N/A",
        tenure,
        opening: totalOpening,
        accrued: totalAccrued,
        used: totalUsed,
        closing: totalClosing,
        daysTaken: totalDaysTaken,
        encashed: totalEncashed,
        leavesByType,
      };
    });

    // Get all leave types present in data
    const allLeaveTypes = new Set<string>();
    employeeSummaries.forEach((emp) => {
      Object.keys(emp.leavesByType).forEach((type) => allLeaveTypes.add(type));
    });
    const leaveTypeColumns = Array.from(allLeaveTypes).sort();

    // Build CSV headers
    const headers = [
      "Employee Code",
      "Employee Name",
      "Email",
      "Department",
      "Tenure (Years)",
      ...(includeBalances
        ? ["Opening Balance", "Accrued", "Used", "Closing Balance"]
        : []),
      "Days Taken",
      "Days Encashed",
      ...leaveTypeColumns.map((type) => `${type} Days`),
    ];

    // Build CSV rows
    const rows = employeeSummaries.map((emp) => [
      emp.empCode,
      emp.name,
      emp.email,
      emp.department,
      emp.tenure.toString(),
      ...(includeBalances
        ? [
            emp.opening.toString(),
            emp.accrued.toString(),
            emp.used.toString(),
            emp.closing.toString(),
          ]
        : []),
      emp.daysTaken.toString(),
      emp.encashed.toString(),
      ...leaveTypeColumns.map((type) => (emp.leavesByType[type] || 0).toString()),
    ]);

    // Add totals row
    const totalDaysTaken = employeeSummaries.reduce((sum, e) => sum + e.daysTaken, 0);
    const totalEncashed = employeeSummaries.reduce((sum, e) => sum + e.encashed, 0);
    const totalsByType = leaveTypeColumns.map((type) =>
      employeeSummaries
        .reduce((sum, emp) => sum + (emp.leavesByType[type] || 0), 0)
        .toString()
    );

    const totalOpening = employeeSummaries.reduce((sum, e) => sum + e.opening, 0);
    const totalAccrued = employeeSummaries.reduce((sum, e) => sum + e.accrued, 0);
    const totalUsed = employeeSummaries.reduce((sum, e) => sum + e.used, 0);
    const totalClosing = employeeSummaries.reduce((sum, e) => sum + e.closing, 0);

    rows.push([
      "",
      "TOTAL",
      `${employeeSummaries.length} employees`,
      "",
      "",
      ...(includeBalances
        ? [
            totalOpening.toString(),
            totalAccrued.toString(),
            totalUsed.toString(),
            totalClosing.toString(),
          ]
        : []),
      totalDaysTaken.toString(),
      totalEncashed.toString(),
      ...totalsByType,
    ]);

    // Format CSV
    let csvContent: string;

    if (format === "excel-csv") {
      const bom = "\uFEFF";
      csvContent = bom + [
        `"CDBL Leave Management System - Employee Summary Report"`,
        `"Year: ${year}"`,
        `"Department: ${departmentParam || "All Departments"}"`,
        `"Generated: ${new Date().toLocaleString()}"`,
        `"Generated By: ${user.name} (${user.email})"`,
        "",
        headers.map((h) => `"${h}"`).join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\r\n");
    } else {
      csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")),
      ].join("\n");
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorEmail: user.email,
        action: "EMPLOYEE_SUMMARY_EXPORT",
        targetEmail: user.email,
        details: {
          year,
          department: departmentParam || "All",
          format,
          employeeCount: employeeSummaries.length,
          totalDaysTaken,
          totalEncashed,
        },
      },
    });

    const filename = `employee-summary-${year}${departmentParam ? `-${departmentParam}` : ""}-${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": format === "excel-csv" ? "text/csv; charset=utf-8" : "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Employee summary export error:", err);
    return NextResponse.json(
      error("internal_error", "Failed to generate employee summary export", traceId),
      { status: 500 }
    );
  }
}
