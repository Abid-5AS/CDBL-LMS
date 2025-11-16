import { NextResponse } from "next/server";
import { z } from "zod";

export const cache = "no-store";
import { LeaveType } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";
import { LeaveService } from "@/lib/services/leave.service";
import { LeaveRepository } from "@/lib/repositories/leave.repository";

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
    "SPECIAL", // Can be used for medical or rest outside Bangladesh (Policy 6.19.c)
  ]),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().min(3),
  workingDays: z.number().int().positive().optional(),
  needsCertificate: z.boolean().optional(),
  incidentDate: z.string().optional(), // For Special Disability Leave - when the disabling incident occurred
});

export async function GET(req: Request) {
  const me = await getCurrentUser();
  const traceId = getTraceId(req as any);
  if (!me) return NextResponse.json(error("unauthorized", undefined, traceId), { status: 401 });

  // Parse query parameters
  const url = new URL(req.url);
  const statusFilter = url.searchParams.get("status");
  const mine = url.searchParams.get("mine") === "1";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100); // Cap at 100 for performance

  try {
    let items;

    if (mine) {
      // Use repository method for user-specific queries
      if (statusFilter && statusFilter !== "all") {
        items = await LeaveRepository.findByUserId(me.id, statusFilter as any, { limit });
      } else {
        items = await LeaveRepository.findByUserId(me.id, undefined, { limit });
      }
    } else {
      // Use repository method for all queries
      items = await LeaveRepository.findAll({
        status: statusFilter && statusFilter !== "all" ? statusFilter as any : undefined,
        limit,
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

export async function POST(req: Request) {
  const traceId = getTraceId(req as any);
  const me = await getCurrentUser();
  if (!me) return NextResponse.json(error("unauthorized", undefined, traceId), { status: 401 });

  try {
    // Parse request data (multipart form-data or JSON)
    const contentType = req.headers.get("content-type") ?? "";
    let certificateFile: File | undefined;
    let parsedInput: z.infer<typeof ApplySchema>;

    if (contentType.includes("multipart/form-data")) {
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
        incidentDate: formData.get("incidentDate")
          ? String(formData.get("incidentDate"))
          : undefined,
      };

      const cert = formData.get("certificate");
      certificateFile = cert instanceof File ? cert : undefined;
      parsedInput = ApplySchema.parse(raw);
    } else {
      const json = await req.json();
      parsedInput = ApplySchema.parse(json);
    }

    // Delegate all business logic to LeaveService
    const result = await LeaveService.createLeaveRequest(me.id, {
      type: parsedInput.type as LeaveType,
      startDate: new Date(parsedInput.startDate),
      endDate: new Date(parsedInput.endDate),
      reason: parsedInput.reason,
      workingDays: parsedInput.workingDays,
      needsCertificate: parsedInput.needsCertificate,
      certificateFile,
      incidentDate: parsedInput.incidentDate ? new Date(parsedInput.incidentDate) : undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        error(result.error!.code, result.error!.message, traceId, result.error!.details),
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      id: result.data.id,
      warnings: result.data.warnings
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        error("validation_error", "Invalid request data", traceId, { errors: err.format() }),
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
