import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ImportExportService } from "@/lib/services/import-export.service";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";
import { LeaveType, LeaveStatus } from "@/src/generated/prisma/client";
import { z } from "zod";

export const cache = "no-store";

const ALLOWED_ROLES = ["HR_ADMIN", "HR_HEAD", "SYSTEM_ADMIN"];

/**
 * GET /api/leaves/import?template=true
 * Download CSV template for leave import
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
  if (searchParams.get("template") !== "true") {
    return NextResponse.json(error("bad_request", "Use ?template=true", traceId), { status: 400 });
  }

  const template = ImportExportService.generateLeaveTemplate();
  return new NextResponse(template, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="leaves_import_template.csv"',
    },
  });
}

const LeaveImportSchema = z.object({
  leaves: z.array(
    z.object({
      employeeEmail: z.string().email(),
      type: z.enum([
        "EARNED",
        "CASUAL",
        "MEDICAL",
        "EXTRAWITHPAY",
        "EXTRAWITHOUTPAY",
        "MATERNITY",
        "PATERNITY",
        "STUDY",
        "SPECIAL_DISABILITY",
        "QUARANTINE",
        "SPECIAL",
      ]),
      startDate: z.string(),
      endDate: z.string(),
      reason: z.string().min(3),
      workingDays: z.number().optional(),
    })
  ),
});

async function processLeaves(
  leaves: { employeeEmail: string; type: string; startDate: string; endDate: string; reason: string; workingDays?: number }[]
) {
  const results = { success: 0, failed: 0, errors: [] as Array<{ row: number; email: string; error: string }> };

  for (let i = 0; i < leaves.length; i++) {
    const leave = leaves[i];
    try {
      const employee = await prisma.user.findUnique({ where: { email: leave.employeeEmail } });
      if (!employee) {
        results.failed++;
        results.errors.push({ row: i + 1, email: leave.employeeEmail, error: "Employee not found" });
        continue;
      }
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      const workingDays =
        leave.workingDays ??
        Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      await prisma.leaveRequest.create({
        data: {
          requesterId: employee.id,
          type: leave.type as LeaveType,
          startDate,
          endDate,
          reason: leave.reason,
          workingDays,
          status: LeaveStatus.APPROVED,
          policyVersion: "v2.0-bulk-import",
        },
      });
      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push({
        row: i + 1,
        email: leave.employeeEmail,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }
  return results;
}

export async function POST(req: NextRequest) {
  const traceId = getTraceId(req as any);
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(error("unauthorized", undefined, traceId), { status: 401 });
  }

  const allowedRoles = ["HR_ADMIN", "HR_HEAD", "SYSTEM_ADMIN"];
  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json(error("forbidden", "Access denied", traceId), { status: 403 });
  }

  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const dryRun = formData.get("dryRun") === "true";

      if (!file) {
        return NextResponse.json(error("file_required", "CSV file is required", traceId), { status: 400 });
      }
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(error("file_too_large", "File size must be less than 5MB", traceId), { status: 400 });
      }

      const csvContent = await file.text();
      const result = await ImportExportService.importLeaves(csvContent, dryRun);

      if (!dryRun && (result.imported > 0 || result.failed > 0)) {
        await prisma.auditLog.create({
          data: {
            actorEmail: user.email,
            action: "BULK_LEAVE_IMPORT",
            details: { total: result.imported + result.failed, success: result.imported, failed: result.failed },
          },
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          success: result.imported,
          failed: result.failed,
          errors: result.errors.map((e) => ({ row: e.row, email: "", error: e.error })),
        },
      });
    }

    const body = await req.json();
    const parsed = LeaveImportSchema.parse(body);
    const results = await processLeaves(parsed.leaves);

    await prisma.auditLog.create({
      data: {
        actorEmail: user.email,
        action: "BULK_LEAVE_IMPORT",
        details: { total: parsed.leaves.length, success: results.success, failed: results.failed },
      },
    });

    return NextResponse.json({ success: true, data: results });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        error("validation_error", "Invalid import data", traceId, { errors: err.format() }),
        { status: 400 }
      );
    }
    console.error("Bulk import error:", err);
    return NextResponse.json(error("internal_error", "Failed to import leaves", traceId), { status: 500 });
  }
}
