import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";
import { canApprove } from "@/lib/rbac";
import { isFinalApprover } from "@/lib/workflow";

export const cache = "no-store";

/**
 * Bulk approve leave requests
 * POST /api/leaves/bulk/approve
 * Body: { ids: number[] }
 */
export async function POST(req: NextRequest) {
  const traceId = getTraceId(req as any);
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(error("unauthorized", undefined, traceId), { status: 401 });
  }

  if (!canApprove(user.role)) {
    return NextResponse.json(error("forbidden", "You do not have permission to approve leaves", traceId), { status: 403 });
  }

  try {
    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(error("invalid_request", "Invalid or empty IDs array", traceId), { status: 400 });
    }

    const results = {
      approved: [] as number[],
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

        // Check if user is final approver for this leave type
        if (!isFinalApprover(user.role, leave.type)) {
          results.failed.push({ id: leaveId, reason: "Not authorized to approve this leave type" });
          continue;
        }

        // Check if already approved/rejected
        if (leave.status === "APPROVED") {
          results.failed.push({ id: leaveId, reason: "Already approved" });
          continue;
        }

        if (leave.status === "REJECTED") {
          results.failed.push({ id: leaveId, reason: "Already rejected" });
          continue;
        }

        // Approve the leave (simplified - in production, follow full approval chain)
        await prisma.leaveRequest.update({
          where: { id: leaveId },
          data: { status: "APPROVED" },
        });

        // Update balance
        const year = new Date(leave.startDate).getFullYear();
        const existingBalance = await prisma.balance.findUnique({
          where: {
            userId_type_year: {
              userId: leave.requesterId,
              type: leave.type,
              year,
            },
          },
        });

        if (existingBalance) {
          const newUsed = (existingBalance.used || 0) + leave.workingDays;
          const newClosing = Math.max(
            (existingBalance.opening || 0) + (existingBalance.accrued || 0) - newUsed,
            0
          );

          await prisma.balance.update({
            where: {
              userId_type_year: {
                userId: leave.requesterId,
                type: leave.type,
                year,
              },
            },
            data: {
              used: newUsed,
              closing: newClosing,
            },
          });
        } else {
          // Create new balance with default values
          await prisma.balance.create({
            data: {
              userId: leave.requesterId,
              type: leave.type,
              year,
              opening: 0,
              accrued: 0,
              used: leave.workingDays,
              closing: Math.max(0 + 0 - leave.workingDays, 0),
            },
          });
        }

        // Log audit
        await prisma.auditLog.create({
          data: {
            actorEmail: user.email,
            action: "LEAVE_APPROVED",
            targetEmail: leave.requester.email,
            details: {
              leaveId: leave.id,
              leaveType: leave.type,
              workingDays: leave.workingDays,
              bulk: true,
            },
          },
        });

        results.approved.push(leaveId);
      } catch (err) {
        console.error(`Failed to approve leave ${leaveId}:`, err);
        results.failed.push({ id: leaveId, reason: "Internal error" });
      }
    }

    return NextResponse.json({
      success: true,
      approved: results.approved.length,
      failed: results.failed.length,
      details: results,
    });
  } catch (err) {
    console.error("Bulk approve error:", err);
    return NextResponse.json(
      error("bulk_approve_failed", "Failed to approve leaves", traceId),
      { status: 500 }
    );
  }
}

