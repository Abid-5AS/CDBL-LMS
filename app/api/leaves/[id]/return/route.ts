import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canPerformAction, getStepForRole } from "@/lib/workflow";
import type { AppRole } from "@/lib/rbac";
import { LeaveStatus } from "@prisma/client";
import { z } from "zod";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";

export const cache = "no-store";

const ReturnSchema = z.object({
  comment: z.string().min(5, "Comment must be at least 5 characters when returning a request"),
});

/**
 * Return leave request for modification
 * DEPT_HEAD can return any pending request to employee for modification
 * This sets status to RETURNED and allows employee to resubmit
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

  const { id } = await params;
  const leaveId = Number(id);
  if (Number.isNaN(leaveId)) {
    return NextResponse.json(error("invalid_id", undefined, traceId), { status: 400 });
  }

  const userRole = user.role as AppRole;

  // DEPT_HEAD, HR_ADMIN, and HR_HEAD can return requests
  if (!["DEPT_HEAD", "HR_ADMIN", "HR_HEAD"].includes(userRole)) {
    return NextResponse.json(
      error("forbidden", "You do not have permission to return leave requests", traceId),
      { status: 403 }
    );
  }

  // Get the leave request
  const leave = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
    include: { 
      requester: { select: { email: true, deptHeadId: true } },
      approvals: { orderBy: { step: "desc" }, take: 1 },
    },
  });

  if (!leave) {
    return NextResponse.json(error("not_found", undefined, traceId), { status: 404 });
  }

  // For DEPT_HEAD: verify this is a request from their team
  if (userRole === "DEPT_HEAD" && leave.requester.deptHeadId !== user.id) {
    return NextResponse.json(
      error("forbidden", "You can only return requests from your team members", traceId),
      { status: 403 }
    );
  }

  // Check if leave is in a returnable state
  if (!["SUBMITTED", "PENDING"].includes(leave.status)) {
    return NextResponse.json(
      error("invalid_status", undefined, traceId, { currentStatus: leave.status }),
      { status: 400 }
    );
  }

  // Parse request body - comment is required
  const body = await request.json().catch(() => ({}));
  const parsed = ReturnSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      error("invalid_input", parsed.error.errors[0]?.message || "Comment is required", traceId),
      { status: 400 }
    );
  }

  const step = getStepForRole(userRole, leave.type);

  // Create LeaveComment for the return reason
  await prisma.leaveComment.create({
    data: {
      leaveId,
      authorId: user.id,
      authorRole: userRole,
      comment: parsed.data.comment,
    },
  });

  // Create approval record with RETURNED decision
  await prisma.approval.create({
    data: {
      leaveId,
      step,
      approverId: user.id,
      decision: "FORWARDED", // Use FORWARDED to indicate it's being sent back
      toRole: null, // Returning to employee (no next role)
      comment: parsed.data.comment,
      decidedAt: new Date(),
    },
  });

  // Update leave status to RETURNED
  await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: { status: "RETURNED" as LeaveStatus },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      actorEmail: user.email,
      action: "LEAVE_RETURN",
      targetEmail: leave.requester.email,
      details: {
        leaveId,
        actorRole: userRole,
        step,
        comment: parsed.data.comment,
      },
    },
  });

  return NextResponse.json({
    ok: true,
    status: "RETURNED",
  });
}

