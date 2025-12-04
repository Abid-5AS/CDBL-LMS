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

/**
 * @swagger
 * /api/leaves:
 *   get:
 *     summary: List leave requests
 *     description: Retrieve a list of leave requests. Can be filtered by status and limited to current user's leaves.
 *     tags:
 *       - Leaves
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: status
 *         in: query
 *         description: Filter by leave status
 *         required: false
 *         schema:
 *           $ref: '#/components/schemas/LeaveStatus'
 *       - name: mine
 *         in: query
 *         description: Set to '1' to only return current user's leave requests
 *         required: false
 *         schema:
 *           type: string
 *           enum: ['0', '1']
 *           example: '1'
 *       - name: limit
 *         in: query
 *         description: Maximum number of results to return (max 100)
 *         required: false
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *     responses:
 *       200:
 *         description: Successfully retrieved leave requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LeaveRequest'
 *             example:
 *               items:
 *                 - id: 1
 *                   requesterId: 42
 *                   type: EARNED
 *                   startDate: '2025-12-10'
 *                   endDate: '2025-12-15'
 *                   workingDays: 4
 *                   reason: 'Family emergency'
 *                   status: PENDING
 *                   createdAt: '2025-12-01T10:00:00Z'
 *                   updatedAt: '2025-12-01T10:00:00Z'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Internal server error
 */
export async function GET(req: Request) {
  console.log("[GET /api/leaves] Request received");
  let traceId = "unknown";
  try {
    traceId = getTraceId(req as any);
  } catch (e) {
    console.error("[GET /api/leaves] Failed to get traceId:", e);
  }

  try {
    console.log("[GET /api/leaves] Getting current user...");
    const me = await getCurrentUser();
    console.log("[GET /api/leaves] User:", me?.id);
    
    if (!me) return NextResponse.json(error("unauthorized", undefined, traceId), { status: 401 });

    // Parse query parameters
    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status");
    const mine = url.searchParams.get("mine") === "1";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100); // Cap at 100 for performance

    let items;

    if (mine) {
      // Use repository method for user-specific queries
      console.log("[GET /api/leaves] Fetching leaves for user:", me.id, "statusFilter:", statusFilter, "limit:", limit);
      if (statusFilter && statusFilter !== "all") {
        items = await LeaveRepository.findByUserId(me.id, statusFilter as any, { limit });
      } else {
        items = await LeaveRepository.findByUserId(me.id, undefined, { limit });
      }
      console.log("[GET /api/leaves] Found items:", items?.length);
    } else {
      // Use repository method for all queries
      // Ensure status filter is passed correctly, even for CANCELLATION_REQUESTED
      console.log("[GET /api/leaves] Fetching all leaves");
      items = await LeaveRepository.findAll({
        status: statusFilter && statusFilter !== "all" ? statusFilter as any : undefined,
        limit,
      });
      console.log("[GET /api/leaves] Found items:", items?.length);
    }

    console.log("[GET /api/leaves] Attempting serialization check...");
    try {
      JSON.stringify(items);
      console.log("[GET /api/leaves] Serialization check passed");
    } catch (serErr) {
      console.error("[GET /api/leaves] Serialization failed:", serErr);
      throw new Error("Response serialization failed: " + String(serErr));
    }

    console.log("[GET /api/leaves] Returning response");
    return NextResponse.json({ items });
  } catch (err) {
    console.error("GET /api/leaves error:", err);
    console.error("Error stack:", err instanceof Error ? err.stack : "No stack trace");
    return NextResponse.json(
      error("internal_error", "Failed to fetch leave requests: " + String(err), traceId),
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/leaves:
 *   post:
 *     summary: Create a new leave request
 *     description: Submit a new leave request. Supports both JSON and multipart/form-data for file upload.
 *     tags:
 *       - Leaves
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - startDate
 *               - endDate
 *               - reason
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [EARNED, CASUAL, MEDICAL, EXTRAWITHPAY, EXTRAWITHOUTPAY, MATERNITY, PATERNITY, STUDY, SPECIAL_DISABILITY, QUARANTINE, SPECIAL]
 *                 description: Type of leave being requested
 *                 example: EARNED
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Leave start date (ISO 8601 format)
 *                 example: '2025-12-10'
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Leave end date (ISO 8601 format)
 *                 example: '2025-12-15'
 *               reason:
 *                 type: string
 *                 minLength: 3
 *                 description: Reason for leave request
 *                 example: 'Family emergency'
 *               workingDays:
 *                 type: number
 *                 minimum: 1
 *                 description: Number of working days (optional, calculated if not provided)
 *                 example: 4
 *               needsCertificate:
 *                 type: boolean
 *                 description: Whether medical certificate is required
 *                 example: false
 *               incidentDate:
 *                 type: string
 *                 format: date
 *                 description: For Special Disability Leave - when the disabling incident occurred
 *                 example: '2025-12-01'
 *           example:
 *             type: EARNED
 *             startDate: '2025-12-10'
 *             endDate: '2025-12-15'
 *             reason: 'Family emergency'
 *             workingDays: 4
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - startDate
 *               - endDate
 *               - reason
 *             properties:
 *               type:
 *                 type: string
 *               startDate:
 *                 type: string
 *               endDate:
 *                 type: string
 *               reason:
 *                 type: string
 *               workingDays:
 *                 type: number
 *               needsCertificate:
 *                 type: boolean
 *               incidentDate:
 *                 type: string
 *               certificate:
 *                 type: string
 *                 format: binary
 *                 description: Medical certificate file (PDF, JPG, PNG)
 *     responses:
 *       200:
 *         description: Leave request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 id:
 *                   type: number
 *                   description: ID of the created leave request
 *                   example: 123
 *                 warnings:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Any warnings about the leave request
 *                   example: []
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Internal server error
 */
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
        type: String((formData as any).get("type") ?? ""),
        startDate: String((formData as any).get("startDate") ?? ""),
        endDate: String((formData as any).get("endDate") ?? ""),
        reason: String((formData as any).get("reason") ?? ""),
        workingDays: (formData as any).get("workingDays")
          ? Number((formData as any).get("workingDays"))
          : undefined,
        needsCertificate: toBoolean((formData as any).get("needsCertificate")),
        incidentDate: (formData as any).get("incidentDate")
          ? String((formData as any).get("incidentDate"))
          : undefined,
      };

      const cert = (formData as any).get("certificate");
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
