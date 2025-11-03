import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { LeaveStatus } from "@prisma/client";
import { normalizeToDhakaMidnight } from "@/lib/date-utils";

/**
 * Employee-initiated cancellation
 * Rules:
 * - SUBMITTED/PENDING → CANCELLED (immediate cancellation)
 * - APPROVED → CANCELLATION_REQUESTED (requires HR review)
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id: paramId } = await params;
  const id = Number(paramId);
  if (Number.isNaN(id)) return NextResponse.json({ error: "invalid_id" }, { status: 400 });

  const leave = await prisma.leaveRequest.findUnique({
    where: { id },
    include: { requester: { select: { email: true } } },
  });

  if (!leave || leave.requesterId !== me.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Check valid cancellation states
  if (!["SUBMITTED", "PENDING", "APPROVED"].includes(leave.status)) {
    return NextResponse.json(
      { error: "cannot_cancel_now", currentStatus: leave.status },
      { status: 400 }
    );
  }

  const currentYear = new Date().getFullYear();
  let newStatus: LeaveStatus;
  let balanceRestored = false;

  // If APPROVED, request cancellation (needs HR review)
  if (leave.status === "APPROVED") {
    newStatus = LeaveStatus.CANCELLATION_REQUESTED;

    // Create audit log for cancellation request
    await prisma.auditLog.create({
      data: {
        actorEmail: me.email,
        action: "CANCELLATION_REQUESTED",
        targetEmail: leave.requester.email,
        details: {
          leaveId: leave.id,
          previousStatus: leave.status,
          requestedAt: new Date(),
          initiatedBy: "EMPLOYEE",
        },
      },
    });
  } else {
    // SUBMITTED or PENDING can be cancelled immediately
    newStatus = LeaveStatus.CANCELLED;

    // Create audit log for immediate cancellation
    await prisma.auditLog.create({
      data: {
        actorEmail: me.email,
        action: "LEAVE_CANCELLED",
        targetEmail: leave.requester.email,
        details: {
          leaveId: leave.id,
          previousStatus: leave.status,
          cancelledAt: new Date(),
          initiatedBy: "EMPLOYEE",
        },
      },
    });
  }

  const updated = await prisma.leaveRequest.update({
    where: { id },
    data: { status: newStatus },
  });

  return NextResponse.json({
    ok: true,
    id: updated.id,
    status: newStatus,
    balanceRestored,
  });
}
