import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";
import { canApprove } from "@/lib/rbac";

export const cache = "no-store";

/**
 * Bulk reject leave requests
 * POST /api/leaves/bulk/reject
 * Body: { ids: number[], reason: string }
 */
export async function POST(req: NextRequest) {
  const traceId = getTraceId(req as any);
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(error("unauthorized", undefined, traceId), { status: 401 });
  }

  if (!canApprove(user.role)) {
    return NextResponse.json(error("forbidden", "You do not have permission to reject leaves", traceId), { status: 403 });
  }

  try {
    const body = await req.json();
    const { ids, reason } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(error("invalid_request", "Invalid or empty IDs array", traceId), { status: 400 });
    }

    if (!reason || typeof reason !== "string" || reason.trim().length < 5) {
      return NextResponse.json(error("invalid_request", "Rejection reason is required (minimum 5 characters)", traceId), { status: 400 });
    }

    const results = {
      rejected: [] as number[],
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

        // Check if already approved/rejected
        if (leave.status === "APPROVED") {
          results.failed.push({ id: leaveId, reason: "Already approved - cannot reject" });
          continue;
        }

        if (leave.status === "REJECTED") {
          results.failed.push({ id: leaveId, reason: "Already rejected" });
          continue;
        }

        // Check if leave can be rejected (must be SUBMITTED or PENDING)
        if (!["SUBMITTED", "PENDING"].includes(leave.status)) {
          results.failed.push({ id: leaveId, reason: `Cannot reject leave with status: ${leave.status}` });
          continue;
        }

        // Reject the leave
        await prisma.leaveRequest.update({
          where: { id: leaveId },
          data: {
            status: "REJECTED",
            // Note: rejection comment is handled separately via approvals/comments
          },
        });

        // Create approval record for rejection
        await prisma.approval.create({
          data: {
            leaveId,
            step: 1, // Simple step tracking
            approverId: user.id,
            decision: "REJECTED",
            comment: reason.trim(),
            decidedAt: new Date(),
          },
        });

        // Create notification for the requester
        await prisma.notification.create({
          data: {
            userId: leave.requesterId,
            type: "LEAVE_REJECTED",
            title: "Leave Request Rejected",
            message: `Your ${leave.type} leave request from ${leave.startDate.toLocaleDateString()} to ${leave.endDate.toLocaleDateString()} has been rejected.`,
            link: `/leaves/${leave.id}`,
            leaveId: leave.id,
          },
        });

        // Log audit
        await prisma.auditLog.create({
          data: {
            actorEmail: user.email,
            action: "LEAVE_REJECTED",
            targetEmail: leave.requester.email,
            details: {
              leaveId: leave.id,
              leaveType: leave.type,
              workingDays: leave.workingDays,
              reason: reason.trim(),
              bulk: true,
            },
          },
        });

        results.rejected.push(leaveId);
      } catch (err) {
        console.error(`Failed to reject leave ${leaveId}:`, err);
        results.failed.push({ id: leaveId, reason: "Internal error" });
      }
    }

    return NextResponse.json({
      success: true,
      rejected: results.rejected.length,
      failed: results.failed.length,
      details: results,
    });
  } catch (err) {
    console.error("Bulk reject error:", err);
    return NextResponse.json(
      error("bulk_reject_failed", "Failed to reject leaves", traceId),
      { status: 500 }
    );
  }
}
