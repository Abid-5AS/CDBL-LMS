import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeaveStatus } from "@prisma/client";
import { z } from "zod";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";
import { normalizeToDhakaMidnight } from "@/lib/date-utils";
import { countWorkingDays } from "@/lib/working-days";
import { fetchHolidaysInRange } from "@/lib/leave-validation";
import { processELOverflow } from "@/lib/el-overflow";

export const cache = "no-store";

const PartialCancelSchema = z.object({
  reason: z.string().min(10, "Cancellation reason must be at least 10 characters"),
});

/**
 * Partial Cancellation Endpoint
 *
 * Rules (Per Master Spec):
 * - Can only partially cancel APPROVED leaves that have started
 * - Past days are locked (already taken)
 * - Cancels all remaining future days (sets endDate to yesterday or today)
 * - Remaining days restored to balance
 * - EL overflow logic applies if balance exceeds 60
 * - Leave status remains APPROVED (leave was approved, just ended early)
 * - Creates audit log with PARTIAL_CANCELLATION action
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const traceId = getTraceId(request as any);
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(error("unauthorized", undefined, traceId), {
      status: 401,
    });
  }

  const { id } = await params;
  const leaveId = Number(id);
  if (Number.isNaN(leaveId)) {
    return NextResponse.json(error("invalid_id", undefined, traceId), {
      status: 400,
    });
  }

  // Get the leave
  const leave = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
    include: {
      requester: { select: { id: true, email: true } },
    },
  });

  if (!leave) {
    return NextResponse.json(error("not_found", undefined, traceId), {
      status: 404,
    });
  }

  // Check ownership
  if (leave.requesterId !== user.id) {
    return NextResponse.json(
      error("forbidden", "You can only cancel your own leave requests", traceId),
      { status: 403 }
    );
  }

  // Validation 1: Leave must be APPROVED
  if (leave.status !== LeaveStatus.APPROVED) {
    return NextResponse.json(
      error(
        "partial_cancel_invalid_status",
        "Can only partially cancel APPROVED leave requests",
        traceId,
        { currentStatus: leave.status }
      ),
      { status: 400 }
    );
  }

  // Validation 2: Leave must have started
  const today = normalizeToDhakaMidnight(new Date());
  const startDate = normalizeToDhakaMidnight(leave.startDate);
  const currentEndDate = normalizeToDhakaMidnight(leave.endDate);

  if (today < startDate) {
    return NextResponse.json(
      error(
        "partial_cancel_not_started",
        "Cannot partially cancel a leave that hasn't started yet. Please cancel the entire request instead.",
        traceId,
        { startDate: leave.startDate }
      ),
      { status: 400 }
    );
  }

  // Validation 3: Leave must not have already ended
  if (today > currentEndDate) {
    return NextResponse.json(
      error(
        "partial_cancel_already_ended",
        "Cannot partially cancel a leave that has already ended",
        traceId,
        { endDate: leave.endDate }
      ),
      { status: 400 }
    );
  }

  // Parse request body
  const body = await request.json().catch(() => ({}));
  const parsed = PartialCancelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      error(
        "invalid_input",
        parsed.error.flatten().formErrors[0] || "Invalid cancellation data",
        traceId
      ),
      { status: 400 }
    );
  }

  // Calculate new end date (yesterday or today, whichever makes sense)
  // If today is within the leave period, set endDate to yesterday
  // This ensures past days are locked and only future days are cancelled
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const normalizedYesterday = normalizeToDhakaMidnight(yesterday);

  const newEndDate = normalizedYesterday >= startDate ? normalizedYesterday : today;

  // Calculate new working days
  const holidays = await fetchHolidaysInRange(startDate, newEndDate);
  const newWorkingDays = await countWorkingDays(startDate, newEndDate, holidays);

  const cancelledDays = leave.workingDays - newWorkingDays;

  if (cancelledDays <= 0) {
    return NextResponse.json(
      error(
        "partial_cancel_no_future_days",
        "No future days to cancel. Leave is already completed or ending today.",
        traceId
      ),
      { status: 400 }
    );
  }

  // Update leave request (endDate changed, status remains APPROVED)
  const updatedLeave = await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: {
      endDate: newEndDate,
      workingDays: newWorkingDays,
      // Status remains APPROVED - leave was approved and partially completed
    },
  });

  // Restore balance for cancelled future days
  const currentYear = new Date().getFullYear();
  const balance = await prisma.balance.findUnique({
    where: {
      userId_type_year: {
        userId: user.id,
        type: leave.type,
        year: currentYear,
      },
    },
  });

  let balanceRestored = false;
  if (balance) {
    const newUsed = Math.max((balance.used || 0) - cancelledDays, 0);
    const newClosing = (balance.opening || 0) + (balance.accrued || 0) - newUsed;

    await prisma.balance.update({
      where: {
        userId_type_year: {
          userId: user.id,
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

    // Check if EL overflow to SPECIAL is needed (Policy 6.19.c)
    if (leave.type === "EARNED" && newClosing > 60) {
      await processELOverflow(
        user.id,
        currentYear,
        user.email,
        "partial_cancellation"
      );
    }
  }

  // Create audit log
  await prisma.auditLog.create({
    data: {
      actorEmail: user.email,
      action: "PARTIAL_CANCELLATION",
      targetEmail: user.email,
      details: {
        leaveId: leave.id,
        originalEndDate: leave.endDate,
        newEndDate: newEndDate,
        originalWorkingDays: leave.workingDays,
        newWorkingDays: newWorkingDays,
        cancelledFutureDays: cancelledDays,
        balanceRestored,
        reason: parsed.data.reason,
      },
    },
  });

  return NextResponse.json({
    ok: true,
    leaveId: updatedLeave.id,
    originalEndDate: leave.endDate,
    newEndDate: newEndDate,
    originalWorkingDays: leave.workingDays,
    newWorkingDays: newWorkingDays,
    cancelledDays: cancelledDays,
    balanceRestored,
    message: `Leave partially cancelled. Remaining ${cancelledDays} future day(s) cancelled and restored to your ${leave.type} balance. Past days remain as taken.`,
  });
}
