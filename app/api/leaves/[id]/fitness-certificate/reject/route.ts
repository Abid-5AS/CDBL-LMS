import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";
import { z } from "zod";
import type { AppRole } from "@/lib/rbac";

export const cache = "no-store";

const RejectSchema = z.object({
  comment: z.string().min(1, "Rejection reason is required"),
});

/**
 * Reject fitness certificate
 * Endpoint: POST /api/leaves/[id]/fitness-certificate/reject
 *
 * Rules:
 * - Only HR_ADMIN, HR_HEAD, or CEO can reject
 * - Rejection requires a comment explaining why
 * - Clears fitnessCertificateUrl so employee must resubmit
 * - Sends notification to employee to resubmit
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

  // Only specific roles can reject fitness certificates
  const approvalRoles: AppRole[] = ["HR_ADMIN", "HR_HEAD", "CEO"];
  if (!approvalRoles.includes(userRole)) {
    return NextResponse.json(
      error("forbidden", "Only HR Admin, HR Head, or CEO can reject fitness certificates", traceId),
      { status: 403 }
    );
  }

  // Parse request body
  const body = await request.json().catch(() => ({}));
  const parsed = RejectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      error("invalid_input", parsed.error.issues[0]?.message, traceId),
      { status: 400 }
    );
  }

  // Get the leave request
  const leave = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
    include: {
      requester: { select: { id: true, email: true, name: true } },
    },
  });

  if (!leave) {
    return NextResponse.json(error("not_found", undefined, traceId), { status: 404 });
  }

  // Check if leave is MEDICAL and >7 days
  if (leave.type !== "MEDICAL" || leave.workingDays <= 7) {
    return NextResponse.json(
      error("invalid_leave_type", "Fitness certificate rejection is only for Medical Leave >7 days", traceId),
      { status: 400 }
    );
  }

  // Check if fitness certificate has been uploaded
  if (!leave.fitnessCertificateUrl) {
    return NextResponse.json(
      error("certificate_not_uploaded", "No fitness certificate to reject", traceId),
      { status: 400 }
    );
  }

  // Check if leave is in valid status
  if (!["APPROVED", "RECALLED"].includes(leave.status)) {
    return NextResponse.json(
      error("invalid_status", "Leave must be in APPROVED or RECALLED status", traceId, { currentStatus: leave.status }),
      { status: 400 }
    );
  }

  // Clear the fitness certificate URL
  await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: { fitnessCertificateUrl: null },
  });

  // Delete any pending CERTIFICATE_REVIEW approvals
  await prisma.approval.deleteMany({
    where: {
      leaveId,
      comment: { contains: "CERTIFICATE_REVIEW" },
    },
  });

  // Create approval record for rejection (for audit trail)
  await prisma.approval.create({
    data: {
      leaveId,
      step: 20, // Use step 20 for rejection to differentiate
      approverId: user.id,
      decision: "REJECTED",
      decidedAt: new Date(),
      comment: `CERTIFICATE_REJECTED: ${parsed.data.comment}`,
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      actorEmail: user.email,
      action: "FITNESS_CERTIFICATE_REJECT",
      targetEmail: leave.requester.email,
      details: {
        leaveId,
        actorRole: userRole,
        reason: parsed.data.comment,
      },
    },
  });

  // Notify employee to resubmit
  await prisma.notification.create({
    data: {
      userId: leave.requesterId,
      type: "FITNESS_CERTIFICATE_REJECTED",
      title: "Fitness Certificate Rejected",
      message: `Your fitness certificate has been rejected by ${user.role.replace("_", " ")}. Reason: ${parsed.data.comment}. Please upload a new certificate.`,
      link: `/leaves/${leaveId}`,
      leaveId,
    },
  });

  return NextResponse.json({
    ok: true,
    message: "Fitness certificate rejected. Employee notified to resubmit.",
    reason: parsed.data.comment,
  });
}
