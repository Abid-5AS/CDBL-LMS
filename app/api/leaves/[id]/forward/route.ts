import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canForwardTo,
  getStepForRole,
  getNextRoleInChain,
  getStatusAfterAction,
  getChainFor,
  type ApprovalAction,
} from "@/lib/workflow";
import { canPerformAction } from "@/lib/workflow";
import type { AppRole } from "@/lib/rbac";
import { LeaveStatus } from "@prisma/client";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";

export const cache = "no-store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const traceId = getTraceId(request as any);
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(error("unauthorized", undefined, traceId), {
      status: 401,
    });
  }

  const { id } = await params;
  const leaveId = Number(id);
  if (Number.isNaN(leaveId)) {
    return NextResponse.json(error("invalid_id", undefined, traceId), {
      status: 400,
    });
  }

  const userRole = user.role as AppRole;

  // Get the leave request (need type and requester role for per-type chain resolution)
  const leave = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
    include: {
      approvals: { orderBy: { step: "desc" } },
      requester: { select: { email: true, role: true } },
    },
  });

  if (!leave) {
    return NextResponse.json(error("not_found", undefined, traceId), {
      status: 404,
    });
  }

  const requesterRole = leave.requester.role as AppRole;

  // HR_ADMIN can forward (operational role) - allow without strict chain check
  // For other roles, check if they can forward for this leave type (per-type chain logic)
  if (userRole !== "HR_ADMIN") {
    if (!canPerformAction(userRole, "FORWARD", leave.type, requesterRole)) {
      return NextResponse.json(
        error("forbidden", "You cannot forward leave requests", traceId),
        { status: 403 }
      );
    }
  }

  // Check if leave is in a forwardable state
  if (!["SUBMITTED", "PENDING"].includes(leave.status)) {
    return NextResponse.json(
      error("invalid_status", undefined, traceId, {
        currentStatus: leave.status,
      }),
      { status: 400 }
    );
  }

  // Get next role in chain for this leave type
  // If HR_ADMIN is not in the chain (e.g., CASUAL leave), forward to first role in chain
  let nextRole = getNextRoleInChain(userRole, leave.type, requesterRole);
  if (!nextRole && userRole === "HR_ADMIN") {
    // HR_ADMIN not in chain - forward to first role in chain
    const chain = getChainFor(leave.type, requesterRole);
    nextRole = chain.length > 0 ? chain[0] : null;
  }
  if (!nextRole) {
    return NextResponse.json(
      error("no_next_role", "No next role in approval chain", traceId),
      { status: 400 }
    );
  }

  // Validate forward target (using per-type chain)
  // HR_ADMIN can forward to any role in the chain (operational role)
  if (
    userRole !== "HR_ADMIN" &&
    !canForwardTo(userRole, nextRole, leave.type, requesterRole)
  ) {
    return NextResponse.json(
      error("invalid_forward_target", `Cannot forward to ${nextRole}`, traceId),
      { status: 400 }
    );
  }

  const step = getStepForRole(userRole, leave.type, requesterRole);
  const newStatus = getStatusAfterAction(
    leave.status as LeaveStatus,
    "FORWARD",
    nextRole
  );

  // Update current user's approval to FORWARDED
  await prisma.approval.updateMany({
    where: {
      leaveId,
      approverId: user.id,
      decision: "PENDING",
    },
    data: {
      decision: "FORWARDED",
      toRole: nextRole,
      decidedAt: new Date(),
      comment: `Forwarded to ${nextRole}`,
    },
  });

  // Get the next approver user
  const nextApprover = await prisma.user.findFirst({
    where: {
      role: nextRole,
      // For DEPT_HEAD, find the one that manages this employee
      ...(nextRole === "DEPT_HEAD"
        ? {
            teamMembers: {
              some: { id: leave.requesterId },
            },
          }
        : {}),
    },
    orderBy: { id: "asc" },
  });

  if (!nextApprover) {
    return NextResponse.json(
      error("no_approver_found", `No ${nextRole} found to forward to`, traceId),
      { status: 500 }
    );
  }

  // Create PENDING approval for next role
  const nextStep = getStepForRole(nextRole, leave.type, requesterRole);
  await prisma.approval.create({
    data: {
      leaveId,
      step: nextStep,
      approverId: nextApprover.id,
      decision: "PENDING",
      comment: null,
    },
  });

  // Update leave status if needed
  if (newStatus !== leave.status) {
    await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: { status: newStatus as LeaveStatus },
    });
  }

  // Create audit log
  await prisma.auditLog.create({
    data: {
      actorEmail: user.email,
      action: "LEAVE_FORWARD",
      targetEmail: leave.requester.email,
      details: {
        leaveId,
        fromRole: userRole,
        toRole: nextRole,
        step,
      },
    },
  });

  return NextResponse.json({
    ok: true,
    status: newStatus,
    forwardedTo: nextRole,
  });
}
