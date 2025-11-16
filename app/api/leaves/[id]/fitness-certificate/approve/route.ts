import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";
import { z } from "zod";
import type { AppRole } from "@/lib/rbac";

export const cache = "no-store";

const ApproveSchema = z.object({
  comment: z.string().optional(),
});

/**
 * Approve fitness certificate
 * Endpoint: POST /api/leaves/[id]/fitness-certificate/approve
 *
 * Rules:
 * - Only HR_ADMIN, HR_HEAD, or CEO can approve
 * - Follows approval chain: HR_ADMIN → HR_HEAD → CEO
 * - Creates approval record with action CERTIFICATE_REVIEW
 * - Sends notification to next approver or employee when complete
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

  // Only specific roles can approve fitness certificates
  const approvalRoles: AppRole[] = ["HR_ADMIN", "HR_HEAD", "CEO"];
  if (!approvalRoles.includes(userRole)) {
    return NextResponse.json(
      error("forbidden", "Only HR Admin, HR Head, or CEO can approve fitness certificates", traceId),
      { status: 403 }
    );
  }

  // Parse request body
  const body = await request.json().catch(() => ({}));
  const parsed = ApproveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(error("invalid_input", undefined, traceId), { status: 400 });
  }

  // Get the leave request
  const leave = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
    include: {
      requester: { select: { id: true, email: true, name: true } },
      approvals: {
        where: { comment: { contains: "CERTIFICATE_REVIEW" } },
        orderBy: { step: "asc" },
      },
    },
  });

  if (!leave) {
    return NextResponse.json(error("not_found", undefined, traceId), { status: 404 });
  }

  // Check if leave is MEDICAL and >7 days
  if (leave.type !== "MEDICAL" || leave.workingDays <= 7) {
    return NextResponse.json(
      error("invalid_leave_type", "Fitness certificate approval is only for Medical Leave >7 days", traceId),
      { status: 400 }
    );
  }

  // Check if fitness certificate has been uploaded
  if (!leave.fitnessCertificateUrl) {
    return NextResponse.json(
      error("certificate_not_uploaded", "Fitness certificate must be uploaded first", traceId),
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

  // Determine the approval chain order
  const approvalChain: AppRole[] = ["HR_ADMIN", "HR_HEAD", "CEO"];
  const currentUserIndex = approvalChain.indexOf(userRole);

  if (currentUserIndex === -1) {
    return NextResponse.json(
      error("forbidden", "Invalid role for approval", traceId),
      { status: 403 }
    );
  }

  // Check if previous approvers have approved (chain validation)
  const certificateApprovals = leave.approvals.filter(
    (a) => a.decision === "APPROVED"
  );

  if (certificateApprovals.length !== currentUserIndex) {
    return NextResponse.json(
      error(
        "approval_chain_violation",
        `Previous approvers must approve first. Expected ${currentUserIndex} approvals, found ${certificateApprovals.length}`,
        traceId
      ),
      { status: 400 }
    );
  }

  // Check if this user has already approved
  const existingApproval = leave.approvals.find(
    (a) => a.approverId === user.id && a.decision === "APPROVED"
  );

  if (existingApproval) {
    return NextResponse.json(
      error("already_approved", "You have already approved this fitness certificate", traceId),
      { status: 400 }
    );
  }

  // Create approval record
  // Use step 10+ to differentiate from normal leave approvals
  const step = 10 + currentUserIndex;

  await prisma.approval.create({
    data: {
      leaveId,
      step,
      approverId: user.id,
      decision: "APPROVED",
      decidedAt: new Date(),
      comment: `CERTIFICATE_REVIEW: ${parsed.data.comment || "Approved"}`,
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      actorEmail: user.email,
      action: "FITNESS_CERTIFICATE_APPROVE",
      targetEmail: leave.requester.email,
      details: {
        leaveId,
        actorRole: userRole,
        step,
        comment: parsed.data.comment,
        approvalChainProgress: `${currentUserIndex + 1}/${approvalChain.length}`,
      },
    },
  });

  // Determine if this is the final approval
  const isFinalApproval = currentUserIndex === approvalChain.length - 1;

  // Create notification
  if (isFinalApproval) {
    // Notify employee that certificate is fully approved
    await prisma.notification.create({
      data: {
        userId: leave.requesterId,
        type: "LEAVE_APPROVED",
        title: "Fitness Certificate Approved",
        message: `Your fitness certificate has been approved by all reviewers. You may now return to duty.`,
        link: `/leaves/${leaveId}`,
        leaveId,
      },
    });
  } else {
    // Notify next approver
    const nextRole = approvalChain[currentUserIndex + 1];
    const nextApprovers = await prisma.user.findMany({
      where: { role: nextRole },
      select: { id: true },
    });

    for (const approver of nextApprovers) {
      await prisma.notification.create({
        data: {
          userId: approver.id,
          type: "APPROVAL_REQUIRED",
          title: "Fitness Certificate Review Required",
          message: `${leave.requester.name}'s fitness certificate requires your review.`,
          link: `/leaves/${leaveId}`,
          leaveId,
        },
      });
    }
  }

  return NextResponse.json({
    ok: true,
    message: isFinalApproval
      ? "Fitness certificate fully approved. Employee can return to duty."
      : "Fitness certificate approved. Forwarded to next approver.",
    isFinalApproval,
    nextApprover: isFinalApproval ? null : approvalChain[currentUserIndex + 1],
  });
}
