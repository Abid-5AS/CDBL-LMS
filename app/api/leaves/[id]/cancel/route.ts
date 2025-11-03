import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { LeaveStatus } from "@prisma/client";
import { canCancel } from "@/lib/rbac";
import { z } from "zod";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";

export const cache = "no-store";

const CancelSchema = z.object({
  comment: z.string().optional(),
});

/**
 * Admin/HR cancellation endpoint
 * Rules:
 * - HR_ADMIN, HR_HEAD, CEO can cancel any approved leave
 * - Can approve cancellation requests (CANCELLATION_REQUESTED → CANCELLED)
 * - Restores balance when cancelling approved leave
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

  const userRole = user.role as "EMPLOYEE" | "DEPT_HEAD" | "HR_ADMIN" | "HR_HEAD" | "CEO";

  // Check if user can cancel (admin roles only)
  if (!canCancel(userRole, false)) {
    return NextResponse.json(
      error("forbidden", "Only HR Admin, HR Head, or CEO can cancel leaves", traceId),
      { status: 403 }
    );
  }

  // Parse request body
  const body = await request.json().catch(() => ({}));
  const parsed = CancelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(error("invalid_input", undefined, traceId), { status: 400 });
  }

  // Get the leave request with requester
  const leave = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
    include: { requester: { select: { email: true } } },
  });

  if (!leave) {
    return NextResponse.json(error("not_found", undefined, traceId), { status: 404 });
  }

  // Check if already cancelled
  if (leave.status === LeaveStatus.CANCELLED) {
    return NextResponse.json(error("already_cancelled", undefined, traceId), { status: 400 });
  }

  // Check valid cancellation states (APPROVED or CANCELLATION_REQUESTED)
  if (!["APPROVED", "CANCELLATION_REQUESTED"].includes(leave.status)) {
    return NextResponse.json(
      error("cancellation_request_invalid", undefined, traceId, { currentStatus: leave.status }),
      { status: 400 }
    );
  }

  const currentYear = new Date().getFullYear();
  let balanceRestored = false;

  // If leave was APPROVED, restore balance
  if (leave.status === "APPROVED") {
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
      const newUsed = Math.max((balance.used || 0) - leave.workingDays, 0);
      const newClosing = (balance.opening || 0) + (balance.accrued || 0) - newUsed;

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

      balanceRestored = true;
    }
  }

  // Update leave status to CANCELLED
  const updated = await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: { status: LeaveStatus.CANCELLED },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      actorEmail: user.email,
      action: "LEAVE_CANCELLED",
      targetEmail: leave.requester.email,
      details: {
        leaveId: leave.id,
        previousStatus: leave.status,
        cancelledAt: new Date(),
        initiatedBy: "ADMIN",
        actorRole: userRole,
        balanceRestored,
        restoredDays: balanceRestored ? leave.workingDays : 0,
        comment: parsed.data.comment,
      },
    },
  });

  return NextResponse.json({
    ok: true,
    id: updated.id,
    status: updated.status,
    balanceRestored,
  });
}

