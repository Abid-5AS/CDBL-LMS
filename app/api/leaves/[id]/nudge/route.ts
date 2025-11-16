import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getNextApproverRole } from "@/components/shared/forms/approval-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const leaveId = parseInt(resolvedParams.id);
    if (isNaN(leaveId)) {
      return NextResponse.json(
        { error: "Invalid leave ID" },
        { status: 400 }
      );
    }

    // Get the leave request
    const leave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
      include: { approvals: true },
    });

    if (!leave) {
      return NextResponse.json(
        { error: "Leave request not found" },
        { status: 404 }
      );
    }

    // Verify user is the requester
    if (leave.requesterId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Check if already nudged recently (within 24 hours)
    const recentNudge = await prisma.auditLog.findFirst({
      where: {
        action: "APPROVAL_REQUIRED",
        targetEmail: user.email,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    if (recentNudge) {
      return NextResponse.json(
        { error: "You can only nudge once per 24 hours" },
        { status: 429 }
      );
    }

    // Find the next pending approval step
    const sortedApprovals = leave.approvals.sort((a, b) => (a.step || 0) - (b.step || 0));
    const nextPendingApproval = sortedApprovals.find(
      (a) => a.decision === "PENDING" || a.decision === null
    );

    if (!nextPendingApproval) {
      return NextResponse.json(
        { error: "No pending approval found" },
        { status: 400 }
      );
    }

    // Find the approver user
    const approver = await prisma.user.findUnique({
      where: { id: nextPendingApproval.approverId },
    });

    if (!approver) {
      return NextResponse.json(
        { error: "Approver not found" },
        { status: 404 }
      );
    }

    // Create notification for the approver
    await prisma.notification.create({
      data: {
        userId: approver.id,
        type: "APPROVAL_REQUIRED",
        title: "Leave Request Reminder",
        message: `${user.name} is waiting for your review on their leave request (${leave.type})`,
        link: `/approvals?status=PENDING`,
        leaveId: leave.id,
      },
    });

    // Log the nudge action
    await prisma.auditLog.create({
      data: {
        actorEmail: user.email,
        action: "APPROVAL_REQUIRED",
        targetEmail: approver.email,
        details: `Nudged for leave request #${leaveId}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Reminder sent to ${approver.name}`,
    });
  } catch (error) {
    console.error("Nudge error:", error);
    return NextResponse.json(
      { error: "Failed to send nudge" },
      { status: 500 }
    );
  }
}
