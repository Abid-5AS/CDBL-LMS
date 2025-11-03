import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";
import { canReturn } from "@/lib/rbac";

export const cache = "no-store";

/**
 * Bulk return leave requests for modification
 * POST /api/leaves/bulk/return-for-modification
 * Body: { ids: number[], comment?: string }
 */
export async function POST(req: NextRequest) {
  const traceId = getTraceId(req as any);
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(error("unauthorized", undefined, traceId), { status: 401 });
  }

  if (!canReturn(user.role)) {
    return NextResponse.json(error("forbidden", "You do not have permission to return leaves for modification", traceId), { status: 403 });
  }

  try {
    const body = await req.json();
    const { ids, comment } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(error("invalid_request", "Invalid or empty IDs array", traceId), { status: 400 });
    }

    const results = {
      returned: [] as number[],
      failed: [] as Array<{ id: number; reason: string }>,
    };

    for (const id of ids) {
      const leaveId = Number(id);
      if (isNaN(leaveId)) {
        results.failed.push({ id, reason: "Invalid ID" });
        continue;
      }

      try {
        const leave = await prisma.leaveRequest.findUnique({
          where: { id: leaveId },
          include: { requester: true },
        });

        if (!leave) {
          results.failed.push({ id: leaveId, reason: "Leave not found" });
          continue;
        }

        // Check if can be returned
        if (leave.status === "APPROVED") {
          results.failed.push({ id: leaveId, reason: "Cannot return approved leave" });
          continue;
        }

        if (leave.status === "RETURNED") {
          results.failed.push({ id: leaveId, reason: "Already returned" });
          continue;
        }

        // Update status
        await prisma.leaveRequest.update({
          where: { id: leaveId },
          data: { status: "RETURNED" },
        });

        // Log audit
        await prisma.auditLog.create({
          data: {
            actorEmail: user.email,
            action: "RETURN_TO_EMPLOYEE",
            targetEmail: leave.requester.email,
            details: {
              leaveId: leave.id,
              comment: comment || "Returned for modification",
              bulk: true,
            },
          },
        });

        results.returned.push(leaveId);
      } catch (err) {
        console.error(`Failed to return leave ${leaveId}:`, err);
        results.failed.push({ id: leaveId, reason: "Internal error" });
      }
    }

    return NextResponse.json({
      success: true,
      returned: results.returned.length,
      failed: results.failed.length,
      details: results,
    });
  } catch (err) {
    console.error("Bulk return error:", err);
    return NextResponse.json(
      error("bulk_return_failed", "Failed to return leaves", traceId),
      { status: 500 }
    );
  }
}

