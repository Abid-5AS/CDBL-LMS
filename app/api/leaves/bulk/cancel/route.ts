import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";
import { canCancel } from "@/lib/rbac";

export const cache = "no-store";

/**
 * Bulk cancel leave requests (employee-initiated)
 * PATCH /api/leaves/bulk/cancel
 * Body: { ids: number[] }
 */
export async function PATCH(req: NextRequest) {
  const traceId = getTraceId(req as any);
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(error("unauthorized", undefined, traceId), { status: 401 });
  }

  // Employees can only cancel their own leaves
  if (user.role === "EMPLOYEE" && !canCancel(user.role, true)) {
    return NextResponse.json(error("forbidden", "You do not have permission to cancel leaves", traceId), { status: 403 });
  }

  try {
    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(error("invalid_request", "Invalid or empty IDs array", traceId), { status: 400 });
    }

    const results = {
      cancelled: [] as number[],
      cancellationRequested: [] as number[],
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

        // Check ownership for employees
        if (user.role === "EMPLOYEE" && leave.requesterId !== user.id) {
          results.failed.push({ id: leaveId, reason: "Not your leave" });
          continue;
        }

        // Check if already cancelled
        if (leave.status === "CANCELLED") {
          results.failed.push({ id: leaveId, reason: "Already cancelled" });
          continue;
        }

        if (leave.status === "RECALLED") {
          results.failed.push({ id: leaveId, reason: "Already recalled" });
          continue;
        }

        let newStatus: string;
        let auditAction: string;

        if (leave.status === "APPROVED") {
          // Approved leaves require cancellation request
          newStatus = "CANCELLATION_REQUESTED";
          auditAction = "CANCELLATION_REQUESTED";
          results.cancellationRequested.push(leaveId);
        } else {
          // SUBMITTED/PENDING can be cancelled immediately
          newStatus = "CANCELLED";
          auditAction = "LEAVE_CANCELLED";
          results.cancelled.push(leaveId);

          // Restore balance if it was already deducted
          const year = new Date(leave.startDate).getFullYear();
          const balance = await prisma.balance.findUnique({
            where: {
              userId_type_year: {
                userId: leave.requesterId,
                type: leave.type,
                year,
              },
            },
          });

          if (balance) {
            const newUsed = Math.max((balance.used || 0) - leave.workingDays, 0);
            const newClosing = (balance.opening || 0) + (balance.accrued || 0) - newUsed;

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
          }
        }

        // Update status
        await prisma.leaveRequest.update({
          where: { id: leaveId },
          data: { status: newStatus as any },
        });

        // Log audit
        await prisma.auditLog.create({
          data: {
            actorEmail: user.email,
            action: auditAction as any,
            targetEmail: leave.requester.email,
            details: {
              leaveId: leave.id,
              previousStatus: leave.status,
              newStatus,
              bulk: true,
            },
          },
        });
      } catch (err) {
        console.error(`Failed to cancel leave ${leaveId}:`, err);
        results.failed.push({ id: leaveId, reason: "Internal error" });
      }
    }

    return NextResponse.json({
      success: true,
      cancelled: results.cancelled.length,
      cancellationRequested: results.cancellationRequested.length,
      failed: results.failed.length,
      details: results,
    });
  } catch (err) {
    console.error("Bulk cancel error:", err);
    return NextResponse.json(
      error("bulk_cancel_failed", "Failed to cancel leaves", traceId),
      { status: 500 }
    );
  }
}

