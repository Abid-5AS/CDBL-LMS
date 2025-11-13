/**
 * Leave API Route (Refactored)
 * Thin controller that delegates to service layer
 *
 * BEFORE: 727 lines with business logic mixed in
 * AFTER: ~100 lines, clean HTTP handling only
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { LeaveType } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { getTraceId } from "@/lib/trace";
import { error } from "@/lib/errors";
import { LeaveService } from "@/lib/services/leave.service";
import { LeaveRepository } from "@/lib/repositories/leave.repository";

export const cache = "no-store";

const ApplySchema = z.object({
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
  workingDays: z.number().int().positive().optional(),
  needsCertificate: z.boolean().optional(),
});

/**
 * GET - Fetch leave requests
 */
export async function GET(req: Request) {
  const me = await getCurrentUser();
  const traceId = getTraceId(req as any);

  if (!me) {
    return NextResponse.json(error("unauthorized", undefined, traceId), {
      status: 401,
    });
  }

  try {
    // Parse query parameters
    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status");
    const mine = url.searchParams.get("mine") === "1";

    // Fetch data using repository
    let items;
    if (mine) {
      items = await LeaveRepository.findByUserId(
        me.id,
        statusFilter as any
      );
    } else {
      items = await LeaveRepository.findAll({
        ...(statusFilter &&
          statusFilter !== "all" && { status: statusFilter as any }),
      });
    }

    return NextResponse.json({ items });
  } catch (err) {
    console.error("GET /api/leaves error:", err);
    return NextResponse.json(
      error("internal_error", "Failed to fetch leave requests", traceId),
      { status: 500 }
    );
  }
}

/**
 * POST - Create leave request
 */
export async function POST(req: Request) {
  const traceId = getTraceId(req as any);
  const me = await getCurrentUser();

  if (!me) {
    return NextResponse.json(error("unauthorized", undefined, traceId), {
      status: 401,
    });
  }

  try {
    // Parse request data
    const contentType = req.headers.get("content-type") ?? "";
    let certificateFile: File | null = null;
    let parsedInput: z.infer<typeof ApplySchema>;

    if (contentType.includes("multipart/form-data")) {
      // Handle file upload
      const formData = await req.formData();
      const toBoolean = (value: FormDataEntryValue | null) => {
        if (typeof value !== "string") return undefined;
        return value === "true";
      };

      const raw = {
        type: String(formData.get("type") ?? ""),
        startDate: String(formData.get("startDate") ?? ""),
        endDate: String(formData.get("endDate") ?? ""),
        reason: String(formData.get("reason") ?? ""),
        workingDays: formData.get("workingDays")
          ? Number(formData.get("workingDays"))
          : undefined,
        needsCertificate: toBoolean(formData.get("needsCertificate")),
      };

      certificateFile =
        formData.get("certificate") instanceof File
          ? (formData.get("certificate") as File)
          : null;
      parsedInput = ApplySchema.parse(raw);
    } else {
      // Handle JSON
      const json = await req.json();
      parsedInput = ApplySchema.parse(json);
    }

    // Create leave request using service
    const result = await LeaveService.createLeaveRequest(me.id, {
      type: parsedInput.type as LeaveType,
      startDate: new Date(parsedInput.startDate),
      endDate: new Date(parsedInput.endDate),
      reason: parsedInput.reason,
      workingDays: parsedInput.workingDays,
      needsCertificate: parsedInput.needsCertificate,
      certificateFile: certificateFile || undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        error(
          result.error!.code,
          result.error!.message,
          traceId,
          result.error!.details
        ),
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        error("validation_error", "Invalid request data", traceId, {
          errors: err.errors,
        }),
        { status: 400 }
      );
    }

    console.error("POST /api/leaves error:", err);
    return NextResponse.json(
      error("internal_error", "Failed to create leave request", traceId),
      { status: 500 }
    );
  }
}
