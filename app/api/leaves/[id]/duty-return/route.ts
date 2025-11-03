import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { LeaveStatus } from "@prisma/client";
import { canReturn } from "@/lib/rbac";
import { z } from "zod";
import type { AppRole } from "@/lib/rbac";

export const cache = "no-store";

const DutyReturnSchema = z.object({
  fitnessCertificateUrl: z.string().url().optional(),
  comment: z.string().optional(),
});

/**
 * Return to duty after medical leave
 * Endpoint: PATCH /api/leaves/[id]/duty-return
 * Rules:
 * - Only for MEDICAL leave type
 * - Requires fitnessCertificateUrl when workingDays > 7
 * - Updates leave status and records audit
 * - Valid states: APPROVED, RECALLED (ongoing or completed medical leave)
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  // Parse request body
  const body = await request.json().catch(() => ({}));
  const parsed = DutyReturnSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", message: parsed.error.issues[0]?.message },
      { status: 400 }
    );
  }

  // Get the leave request with requester
  const leave = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
    include: { requester: { select: { email: true } } },
  });

  if (!leave) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Only MEDICAL leave type requires duty return
  if (leave.type !== "MEDICAL") {
    return NextResponse.json(
      { error: "invalid_leave_type", message: "Duty return is only applicable for Medical Leave" },
      { status: 400 }
    );
  }

  // Check if user can perform duty return (employee for own leave, or approvers)
  const isOwnLeave = leave.requesterId === user.id;
  if (!isOwnLeave && !canReturn(userRole)) {
    return NextResponse.json(
      { error: "forbidden", message: "Only the employee or approvers can record duty return" },
      { status: 403 }
    );
  }

  // Check valid states
  if (!["APPROVED", "RECALLED"].includes(leave.status)) {
    return NextResponse.json(
      { error: "cannot_return_to_duty", currentStatus: leave.status },
      { status: 400 }
    );
  }

  // Policy 6.14: Fitness certificate required if ML > 7 days
  if (leave.workingDays > 7) {
    if (!parsed.data.fitnessCertificateUrl) {
      return NextResponse.json(
        {
          error: "fitness_certificate_required",
          message: "Fitness certificate is required for Medical Leave exceeding 7 days",
        },
        { status: 400 }
      );
    }

    // Update leave with fitness certificate URL
    await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        fitnessCertificateUrl: parsed.data.fitnessCertificateUrl,
      },
    });
  }

  // Create audit log for duty return
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
        fitnessCertificateProvided: !!parsed.data.fitnessCertificateUrl,
        workingDays: leave.workingDays,
        comment: parsed.data.comment,
      },
    },
  });

  return NextResponse.json({
    ok: true,
    id: leaveId,
    message: "Duty return recorded successfully",
    fitnessCertificateRequired: leave.workingDays > 7,
    fitnessCertificateProvided: !!parsed.data.fitnessCertificateUrl,
  });
}

