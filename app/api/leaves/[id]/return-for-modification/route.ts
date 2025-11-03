import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { LeaveStatus } from "@prisma/client";
import { canReturn } from "@/lib/rbac";
import { z } from "zod";
import type { AppRole } from "@/lib/rbac";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";

export const cache = "no-store";

const ReturnSchema = z.object({
  comment: z.string().min(1, "Comment is required for returning a request"),
});

/**
 * Return leave request for modification
 * Endpoint: POST /api/leaves/[id]/return-for-modification
 * Rules:
 * - Only approvers (HR_ADMIN, HR_HEAD, CEO, DEPT_HEAD) can return requests
 * - Sets status to RETURNED so employee can modify and resubmit
 * - Valid states: SUBMITTED, PENDING
 * - Records audit log action: RETURN_TO_DUTY (for modification flow)
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  // Check if user can return requests
  if (!canReturn(userRole)) {
    return NextResponse.json(
      error("forbidden", "Only approvers can return leave requests for modification", traceId),
      { status: 403 }
    );
  }

  // Parse request body
  const body = await request.json().catch(() => ({}));
  const parsed = ReturnSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      error("invalid_input", parsed.error.issues[0]?.message, traceId),
      { status: 400 }
    );
  }

  // Get the leave request with requester
  const leave = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
    include: { requester: { select: { email: true } } },
  });

  if (!leave) {
    return NextResponse.json(error("not_found", undefined, traceId), { status: 404 });
  }

  // Check valid return states
  if (!["SUBMITTED", "PENDING"].includes(leave.status)) {
    return NextResponse.json(
      error("return_action_invalid", undefined, traceId, { currentStatus: leave.status }),
      { status: 400 }
    );
  }

  // Update leave status to RETURNED
  const updated = await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: { status: LeaveStatus.RETURNED },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      actorEmail: user.email,
      action: "RETURN_TO_DUTY",
      targetEmail: leave.requester.email,
      details: {
        leaveId: leave.id,
        previousStatus: leave.status,
        returnedAt: new Date(),
        actorRole: userRole,
        comment: parsed.data.comment,
      },
    },
  });

  return NextResponse.json({
    ok: true,
    id: updated.id,
    status: updated.status,
    message: "Leave request returned for modification",
  });
}

