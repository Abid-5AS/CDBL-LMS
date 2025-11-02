import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canForwardTo, getStepForRole, getNextRoleInChain, getStatusAfterAction, type ApprovalAction } from "@/lib/workflow";
import { canPerformAction, type AppRole } from "@/lib/rbac";
import { LeaveStatus } from "@prisma/client";

export const cache = "no-store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const leaveId = Number(id);
  if (Number.isNaN(leaveId)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const userRole = user.role as AppRole;

  // Check if user can forward
  if (!canPerformAction(userRole, "FORWARD")) {
    return NextResponse.json({ error: "forbidden", message: "You cannot forward leave requests" }, { status: 403 });
  }

  // Get the leave request
  const leave = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
    include: {
      approvals: { orderBy: { step: "desc" } },
      requester: { select: { email: true } },
    },
  });

  if (!leave) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Check if leave is in a forwardable state
  if (!["SUBMITTED", "PENDING"].includes(leave.status)) {
    return NextResponse.json(
      { error: "invalid_status", currentStatus: leave.status },
      { status: 400 }
    );
  }

  // Get next role in chain
  const nextRole = getNextRoleInChain(userRole);
  if (!nextRole) {
    return NextResponse.json(
      { error: "no_next_role", message: "No next role in approval chain" },
      { status: 400 }
    );
  }

  // Validate forward target
  if (!canForwardTo(userRole, nextRole)) {
    return NextResponse.json(
      { error: "invalid_forward_target", message: `Cannot forward to ${nextRole}` },
      { status: 400 }
    );
  }

  const step = getStepForRole(userRole);
  const newStatus = getStatusAfterAction(leave.status as LeaveStatus, "FORWARD", nextRole);

  // Create approval record with FORWARDED decision
  await prisma.approval.create({
    data: {
      leaveId,
      step,
      approverId: user.id,
      decision: "FORWARDED",
      toRole: nextRole,
      decidedAt: new Date(),
      comment: `Forwarded to ${nextRole}`,
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

