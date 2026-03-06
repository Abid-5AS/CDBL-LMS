import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ImportExportService } from "@/lib/services/import-export.service";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";

export const cache = "no-store";

const ALLOWED_ROLES = ["HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN"];

/**
 * POST /api/admin/holidays/import
 * Bulk import holidays from CSV
 * Body: FormData with 'file' field and optional 'dryRun' field
 */
export async function POST(req: NextRequest) {
  const traceId = getTraceId(req as any);
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(error("unauthorized", undefined, traceId), { status: 401 });
  }

  if (!ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json(error("forbidden", "Access denied", traceId), { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const dryRun = formData.get("dryRun") === "true";

    if (!file) {
      return NextResponse.json(
        error("file_required", "CSV file is required", traceId),
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        error("file_too_large", "File size must be less than 5MB", traceId),
        { status: 400 }
      );
    }

    const csvContent = await file.text();
    const result = await ImportExportService.importHolidays(csvContent, dryRun);

    return NextResponse.json({
      success: result.success,
      imported: result.imported,
      failed: result.failed,
      errors: result.errors,
      dryRun,
    });
  } catch (err) {
    console.error("POST /api/admin/holidays/import error:", err);
    return NextResponse.json(
      error("internal_error", "Failed to import holidays", traceId),
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
