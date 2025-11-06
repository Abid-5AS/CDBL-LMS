import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canPerformAction, getStepForRole, getStatusAfterAction, isFinalApprover, type ApprovalAction } from "@/lib/workflow";
import type { AppRole } from "@/lib/rbac";
import { LeaveStatus } from "@prisma/client";
import { z } from "zod";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";

export const cache = "no-store";

const ApproveSchema = z.object({
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

  // Get the leave request with requester (need type for per-type chain resolution)
  const leave = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
    include: { requester: { select: { email: true } } },
  });

  if (!leave) {
    return NextResponse.json(error("not_found", undefined, traceId), { status: 404 });
  }

  // Explicitly exclude HR_ADMIN from approval (operational role only)
  if (userRole === "HR_ADMIN") {
    return NextResponse.json(
      error("forbidden", "HR Admin cannot approve requests. Only HR Head, CEO, or System Admin can approve.", traceId),
      { status: 403 }
    );
  }

  // Check if user can approve for this leave type (per-type chain logic)
  if (!canPerformAction(userRole, "APPROVE", leave.type)) {
    return NextResponse.json(error("forbidden", "You cannot approve leave requests", traceId), { status: 403 });
  }

  // Verify user is final approver for this leave type
  if (!isFinalApprover(userRole, leave.type)) {
    return NextResponse.json(
      error("forbidden", "Only the final approver can approve leave requests", traceId),
      { status: 403 }
    );
  }

  // Parse request body
  const body = await request.json().catch(() => ({}));
  const parsed = ApproveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(error("invalid_input", undefined, traceId), { status: 400 });
  }

  // Prevent self-approval
  if (leave.requesterId === user.id) {
    return NextResponse.json(error("self_approval_disallowed", undefined, traceId), { status: 403 });
  }

  // Check if leave is in an approvable state
  if (!["SUBMITTED", "PENDING"].includes(leave.status)) {
    return NextResponse.json(
      error("invalid_status", undefined, traceId, { currentStatus: leave.status }),
      { status: 400 }
    );
  }

  const step = getStepForRole(userRole, leave.type);
  const newStatus = getStatusAfterAction(leave.status as LeaveStatus, "APPROVE");

  // Create approval record
  await prisma.approval.create({
    data: {
      leaveId,
      step,
      approverId: user.id,
      decision: "APPROVED",
      decidedAt: new Date(),
      comment: parsed.data.comment,
    },
  });

  // Update leave status
  await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: { status: newStatus as LeaveStatus },
  });

  // Update balance when leave is approved
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
    const newUsed = (balance.used || 0) + leave.workingDays;
    const newClosing = Math.max((balance.opening || 0) + (balance.accrued || 0) - newUsed, 0);

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
      action: "LEAVE_APPROVE",
      targetEmail: leave.requester.email,
      details: {
        leaveId,
        actorRole: userRole,
        step,
      },
    },
  });

  return NextResponse.json({
    ok: true,
    status: newStatus,
  });
}

