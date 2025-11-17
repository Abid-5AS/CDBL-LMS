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
 * Partial Cancellation Request Endpoint - Updated 2025-11-17
 *
 * New Rules:
 * - Employee requests partial cancellation of APPROVED leave
 * - Request goes through same approval flow as new leave requests:
 *   - Employee → HR_ADMIN → HR_HEAD → DEPT_HEAD
 *   - Dept Head → HR_ADMIN → HR_HEAD → CEO
 * - Creates a cancellation request with status CANCELLATION_REQUESTED
 * - Only future days can be cancelled (past days are locked)
 * - Once approved, the leave end date is adjusted and balance is restored
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

  // Create a partial cancellation request that will go through approval workflow
  // Status is set to CANCELLATION_REQUESTED and will go through approval chain
  await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: {
      status: 'CANCELLATION_REQUESTED',
      isCancellationRequest: true,
      isPartialCancellation: true,
      originalEndDate: leave.endDate, // Store original end date
      endDate: newEndDate, // Proposed new end date
      workingDays: newWorkingDays, // Proposed new working days
      cancellationReason: parsed.data.reason,
    },
  });

  // Create approval record for HR_ADMIN (first in chain)
  const hrAdmin = await prisma.user.findFirst({
    where: { role: 'HR_ADMIN' },
    select: { id: true },
  });

  if (hrAdmin) {
    await prisma.approval.create({
      data: {
        leaveId: leaveId,
        approverId: hrAdmin.id,
        step: 1,
        decision: 'PENDING',
      },
    });
  }

  // Create audit log for cancellation request
  await prisma.auditLog.create({
    data: {
      actorEmail: user.email,
      action: "PARTIAL_CANCELLATION_REQUESTED",
      targetEmail: user.email,
      details: {
        leaveId: leave.id,
        originalEndDate: leave.endDate,
        requestedEndDate: newEndDate,
        originalWorkingDays: leave.workingDays,
        requestedWorkingDays: newWorkingDays,
        futureDaysToCancel: cancelledDays,
        reason: parsed.data.reason,
      },
    },
  });

  return NextResponse.json({
    ok: true,
    leaveId: leaveId,
    status: 'CANCELLATION_REQUESTED',
    originalEndDate: leave.endDate,
    requestedEndDate: newEndDate,
    originalWorkingDays: leave.workingDays,
    requestedWorkingDays: newWorkingDays,
    daysToCancel: cancelledDays,
    message: `Partial cancellation request submitted. Your request to cancel ${cancelledDays} future day(s) has been sent for approval. The leave will remain active until approved.`,
  });
}
