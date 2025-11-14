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

const ShortenSchema = z.object({
  newEndDate: z.string(), // New shortened end date (must be before current end date)
  shortenReason: z.string().min(10, "Shorten reason must be at least 10 characters"),
});

/**
 * Shorten Leave Endpoint
 *
 * Rules (Per Master Spec):
 * - Can only shorten APPROVED leaves
 * - Leave must have started (today >= startDate)
 * - Cannot shorten past today (newEndDate must be >= today)
 * - New end date must be before current end date
 * - Shortened days are restored to balance
 * - EL overflow logic applies if balance exceeds 60
 * - Creates audit log
 * - Updates leave endDate and workingDays
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
      error("forbidden", "You can only shorten your own leave requests", traceId),
      { status: 403 }
    );
  }

  // Validation 1: Leave must be APPROVED
  if (leave.status !== LeaveStatus.APPROVED) {
    return NextResponse.json(
      error(
        "shorten_invalid_status",
        "Can only shorten APPROVED leave requests",
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
        "shorten_not_started",
        "Cannot shorten a leave that hasn't started yet. Please modify the original request or cancel it.",
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
        "shorten_already_ended",
        "Cannot shorten a leave that has already ended",
        traceId,
        { endDate: leave.endDate }
      ),
      { status: 400 }
    );
  }

  // Parse request body
  const body = await request.json().catch(() => ({}));
  const parsed = ShortenSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      error(
        "invalid_input",
        parsed.error.flatten().formErrors[0] || "Invalid shorten data",
        traceId
      ),
      { status: 400 }
    );
  }

  const newEndDate = normalizeToDhakaMidnight(new Date(parsed.data.newEndDate));

  // Validation 4: New end date must be before current end date
  if (newEndDate >= currentEndDate) {
    return NextResponse.json(
      error(
        "shorten_invalid_date",
        "New end date must be before the current end date",
        traceId,
        {
          currentEndDate: leave.endDate,
          requestedEndDate: newEndDate,
        }
      ),
      { status: 400 }
    );
  }

  // Validation 5: Cannot shorten to before today
  if (newEndDate < today) {
    return NextResponse.json(
      error(
        "shorten_past_date",
        "Cannot shorten leave to a date in the past. New end date must be today or later.",
        traceId,
        {
          today,
          requestedEndDate: newEndDate,
        }
      ),
      { status: 400 }
    );
  }

  // Calculate new working days and shortened days
  const holidays = await fetchHolidaysInRange(startDate, newEndDate);
  const newWorkingDays = await countWorkingDays(startDate, newEndDate, holidays);

  const shortenedDays = leave.workingDays - newWorkingDays;

  if (shortenedDays <= 0) {
    return NextResponse.json(
      error(
        "shorten_no_reduction",
        "The new end date does not result in any shortened working days",
        traceId
      ),
      { status: 400 }
    );
  }

  // Update leave request
  const updatedLeave = await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: {
      endDate: newEndDate,
      workingDays: newWorkingDays,
    },
  });

  // Restore balance for shortened days
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
    const newUsed = Math.max((balance.used || 0) - shortenedDays, 0);
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
        "leave_shortened"
      );
    }
  }

  // Create audit log
  await prisma.auditLog.create({
    data: {
      actorEmail: user.email,
      action: "LEAVE_SHORTENED",
      targetEmail: user.email,
      details: {
        leaveId: leave.id,
        originalEndDate: leave.endDate,
        newEndDate: newEndDate,
        originalWorkingDays: leave.workingDays,
        newWorkingDays: newWorkingDays,
        shortenedDays: shortenedDays,
        balanceRestored,
        reason: parsed.data.shortenReason,
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
    shortenedDays: shortenedDays,
    balanceRestored,
    message: `Leave shortened successfully. ${shortenedDays} day(s) restored to your ${leave.type} balance.`,
  });
}
