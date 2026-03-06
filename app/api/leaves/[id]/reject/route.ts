import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canPerformAction, getStepForRole, getStatusAfterAction, isFinalApprover, type ApprovalAction } from "@/lib/workflow";
import type { AppRole } from "@/lib/rbac";
import { LeaveStatus } from "@/src/generated/prisma/client";
import { z } from "zod";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";
import { notifyLeaveRejected } from "@/lib/webhooks/events";

export const cache = "no-store";

const RejectSchema = z.object({
  comment: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const traceId = getTraceId(request as any);
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(error("unauthorized", undefined, traceId), { status: 401 });
  }

  const { id } = await params;
  const leaveId = Number(id);
  if (Number.isNaN(leaveId)) {
    return NextResponse.json(error("invalid_id", undefined, traceId), { status: 400 });
  }

  const userRole = user.role as AppRole;

  // Get the leave request with requester (need type and requester role for per-type chain resolution)
  const leave = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
    include: { requester: { select: { email: true, role: true } } },
  });

  if (!leave) {
    return NextResponse.json(error("not_found", undefined, traceId), { status: 404 });
  }

  const requesterRole = leave.requester.role as AppRole;

  // HR_ADMIN can reject (operational role) - allow without final approver check
  // For other roles, must be final approver
  if (leave.type) {
    // HR_ADMIN can always reject (operational role)
    if (userRole !== "HR_ADMIN") {
      // For other roles, check if they can reject for this leave type (per-type chain logic)
      if (!canPerformAction(userRole, "REJECT", leave.type, requesterRole)) {
        return NextResponse.json(error("forbidden", "You cannot reject leave requests", traceId), { status: 403 });
      }
      // Must be final approver (unless HR_ADMIN)
      if (!isFinalApprover(userRole, leave.type, requesterRole)) {
        return NextResponse.json(
          error("forbidden", "Only the final approver can reject leave requests", traceId),
          { status: 403 }
        );
      }
    }
  } else {
    // Fallback: HR_ADMIN can reject, but others need to be final approvers
    if (userRole !== "HR_ADMIN" && !canPerformAction(userRole, "REJECT")) {
      return NextResponse.json(error("forbidden", "You cannot reject leave requests", traceId), { status: 403 });
    }
  }

  // Parse request body
  const body = await request.json().catch(() => ({}));
  const parsed = RejectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(error("invalid_input", undefined, traceId), { status: 400 });
  }

  // Prevent self-rejection
  if (leave.requesterId === user.id) {
    return NextResponse.json(error("self_rejection_disallowed", undefined, traceId), { status: 403 });
  }

  // Check if leave is in a rejectable state
  if (!["SUBMITTED", "PENDING", "CANCELLATION_REQUESTED"].includes(leave.status)) {
    return NextResponse.json(
      error("invalid_status", undefined, traceId, { currentStatus: leave.status }),
      { status: 400 }
    );
  }

  const step = getStepForRole(userRole, leave.type, requesterRole);
  const newStatus = getStatusAfterAction(leave.status as LeaveStatus, "REJECT");

  // Create approval record
  await prisma.approval.create({
    data: {
      leaveId,
      step,
      approverId: user.id,
      decision: "REJECTED",
      decidedAt: new Date(),
      comment: parsed.data.comment || "Leave request rejected",
    },
  });

  // Update leave status
  await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: { status: newStatus as LeaveStatus },
  });

  // No balance restoration needed for rejecting SUBMITTED/PENDING leaves
  // because balance is only deducted on approval.
  // For CANCELLATION_REQUESTED leaves (rejecting a cancellation request),
  // the leave stays approved and balance remains deducted — which is correct.

  // Create audit log
  await prisma.auditLog.create({
    data: {
      actorEmail: user.email,
      action: "LEAVE_REJECT",
      targetEmail: leave.requester.email,
      details: {
        leaveId,
        actorRole: userRole,
        step,
      },
    },
  });

  // Trigger webhook notification
  await notifyLeaveRejected({
    leaveId: leave.id,
    employeeId: leave.requesterId,
    employeeName: leave.requester.email.split('@')[0], // Fallback if name not in select
    leaveType: leave.type,
    startDate: leave.startDate,
    endDate: leave.endDate,
    rejectedBy: user.id,
    rejectorName: user.name,
    rejectorRole: userRole,
    rejectedAt: new Date(),
    reason: parsed.data.comment || "Leave request rejected",
  });

  return NextResponse.json({
    ok: true,
    status: newStatus,
  });
}

