import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeaveStatus } from "@prisma/client";
import { z } from "zod";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";
import { canCancelMaternityLeave } from "@/lib/leave-validation";

export const cache = "no-store";

const CancelSchema = z.object({
  reason: z.string().optional(),
});

/**
 * Department Head-initiated cancellation
 * Allows DEPT_HEAD to cancel subordinate leave requests
 * Rules:
 * - Can cancel SUBMITTED/PENDING requests from team members
 * - Cannot cancel already APPROVED requests (those need CANCELLATION_REQUESTED flow)
 * - Cannot cancel MATERNITY leave after it has started
 * - Creates audit log and restores balance if needed
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const traceId = getTraceId(request as any);
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(error("unauthorized", undefined, traceId), { status: 401 });
  }

  // Only DEPT_HEAD can use this endpoint
  if (user.role !== "DEPT_HEAD") {
    return NextResponse.json(
      error("forbidden", "Only Department Heads can cancel leave requests", traceId),
      { status: 403 }
    );
  }

  const { id } = await params;
  const leaveId = Number(id);
  if (Number.isNaN(leaveId)) {
    return NextResponse.json(error("invalid_id", undefined, traceId), { status: 400 });
  }

  // Get the leave request with requester info
  const leave = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
    include: {
      requester: {
        select: {
          id: true,
          email: true,
          deptHeadId: true,
          name: true,
        },
      },
    },
  });

  if (!leave) {
    return NextResponse.json(error("not_found", undefined, traceId), { status: 404 });
  }

  // Verify this is a request from the DEPT_HEAD's team
  if (leave.requester.deptHeadId !== user.id) {
    return NextResponse.json(
      error("forbidden", "You can only cancel requests from your team members", traceId),
      { status: 403 }
    );
  }

  // Check if already cancelled
  if (leave.status === LeaveStatus.CANCELLED) {
    return NextResponse.json(error("already_cancelled", undefined, traceId), { status: 400 });
  }

  // Check valid cancellation states (can only cancel SUBMITTED/PENDING, not APPROVED)
  if (!["SUBMITTED", "PENDING"].includes(leave.status)) {
    return NextResponse.json(
      error(
        "cancellation_request_invalid",
        "Can only cancel SUBMITTED or PENDING requests. Approved requests require cancellation request flow.",
        traceId,
        { currentStatus: leave.status }
      ),
      { status: 400 }
    );
  }

  // Check maternity leave cancellation policy (cannot cancel after start)
  const maternityCancelCheck = canCancelMaternityLeave(leave);
  if (!maternityCancelCheck.canCancel) {
    return NextResponse.json(
      error("maternity_cannot_cancel_after_start", maternityCancelCheck.reason, traceId, {
        leaveType: leave.type,
        startDate: leave.startDate,
      }),
      { status: 403 }
    );
  }

  // Parse request body - reason is optional
  const body = await request.json().catch(() => ({}));
  const parsed = CancelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      error("invalid_input", parsed.error.flatten().formErrors[0] || "Invalid input", traceId),
      { status: 400 }
    );
  }

  const reason = parsed.data.reason?.trim() || "Cancelled by Department Head";

  // Update leave status to CANCELLED
  const updated = await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: { status: LeaveStatus.CANCELLED },
  });

  // Restore balance if leave was pending/submitted (not yet approved)
  // This allows the employee to reapply immediately
  const currentYear = new Date().getFullYear();
  const balance = await prisma.balance.findUnique({
    where: {
      userId_type_year: {
        userId: leave.requesterId,
        type: leave.type,
        year: currentYear,
      },
    },
  });

  if (balance) {
    // Since the leave was never approved, we don't need to restore "used" balance
    // The balance was already available, this is just a cleanup/confirmation
    // However, if the balance was temporarily reserved, we restore it here
    const newUsed = Math.max((balance.used || 0) - leave.workingDays, 0);
    const newClosing = (balance.opening || 0) + (balance.accrued || 0) - newUsed;

    await prisma.balance.update({
      where: {
        userId_type_year: {
          userId: leave.requesterId,
          type: leave.type,
          year: currentYear,
        },
      },
      data: {
        used: newUsed,
        closing: newClosing,
      },
    });
  }

  // Create audit log
  await prisma.auditLog.create({
    data: {
      actorEmail: user.email,
      action: "LEAVE_CANCEL",
      targetEmail: leave.requester.email,
      details: {
        leaveId: leave.id,
        previousStatus: leave.status,
        cancelledAt: new Date(),
        cancelledBy: user.id,
        cancelledByRole: "DEPT_HEAD",
        reason: reason,
        employeeName: leave.requester.name,
      },
    },
  });

  // Create a comment for transparency
  await prisma.leaveComment.create({
    data: {
      leaveId: leave.id,
      authorId: user.id,
      authorRole: "DEPT_HEAD",
      comment: `Request cancelled by Department Head. Reason: ${reason}`,
    },
  });

  return NextResponse.json({
    ok: true,
    id: updated.id,
    status: updated.status,
    message: "Leave request cancelled successfully",
  });
}
