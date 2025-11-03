import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { LeaveStatus } from "@prisma/client";
import { canCancel } from "@/lib/rbac";
import { z } from "zod";
import { normalizeToDhakaMidnight } from "@/lib/date-utils";

export const cache = "no-store";

const RecallSchema = z.object({
  comment: z.string().optional(),
});

/**
 * Recall employee from active leave
 * Rules:
 * - HR_ADMIN, HR_HEAD, CEO can recall employees from APPROVED leave
 * - Sets status to RECALLED
 * - Restores remaining balance for unused days
 * - Only valid for future/ongoing leaves (not past leaves)
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const leaveId = Number(id);
  if (Number.isNaN(leaveId)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const userRole = user.role as "EMPLOYEE" | "DEPT_HEAD" | "HR_ADMIN" | "HR_HEAD" | "CEO";

  // Check if user can recall (admin roles only)
  if (!canCancel(userRole, false)) {
    return NextResponse.json(
      { error: "forbidden", message: "Only HR Admin, HR Head, or CEO can recall employees from leave" },
      { status: 403 }
    );
  }

  // Parse request body
  const body = await request.json().catch(() => ({}));
  const parsed = RecallSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  // Get the leave request with requester
  const leave = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
    include: { requester: { select: { email: true } } },
  });

  if (!leave) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Only APPROVED leaves can be recalled
  if (leave.status !== LeaveStatus.APPROVED) {
    return NextResponse.json(
      { error: "cannot_recall_now", currentStatus: leave.status },
      { status: 400 }
    );
  }

  // Check if leave is in the future or ongoing
  const today = normalizeToDhakaMidnight(new Date());
  const leaveStart = normalizeToDhakaMidnight(leave.startDate);
  const leaveEnd = normalizeToDhakaMidnight(leave.endDate);

  // Can only recall future or ongoing leaves
  if (leaveEnd < today) {
    return NextResponse.json(
      { error: "cannot_recall_past_leave", message: "Cannot recall leaves that have already ended" },
      { status: 400 }
    );
  }

  // Calculate remaining days to restore
  // If leave hasn't started yet, restore all days
  // If leave is ongoing, restore remaining days
  let remainingDays = leave.workingDays;
  if (leaveStart <= today && leaveEnd >= today) {
    // Leave is ongoing - calculate remaining days from today to end
    const todayTime = today.getTime();
    const endTime = leaveEnd.getTime();
    const startTime = leaveStart.getTime();
    const totalDuration = endTime - startTime;
    const remainingDuration = endTime - todayTime;
    remainingDays = Math.ceil((leave.workingDays * remainingDuration) / totalDuration);
  }

  const currentYear = new Date().getFullYear();
  let balanceRestored = false;

  // Restore balance for remaining days
  if (remainingDays > 0) {
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
      const newUsed = Math.max((balance.used || 0) - remainingDays, 0);
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

  // Update leave status to RECALLED
  const updated = await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: { status: LeaveStatus.RECALLED },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      actorEmail: user.email,
      action: "LEAVE_RECALL",
      targetEmail: leave.requester.email,
      details: {
        leaveId: leave.id,
        previousStatus: leave.status,
        recalledAt: new Date(),
        actorRole: userRole,
        remainingDays,
        balanceRestored,
        restoredDays: balanceRestored ? remainingDays : 0,
        comment: parsed.data.comment,
      },
    },
  });

  return NextResponse.json({
    ok: true,
    id: updated.id,
    status: updated.status,
    balanceRestored,
    remainingDays,
  });
}

