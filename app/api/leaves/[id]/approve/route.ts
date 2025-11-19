import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canPerformAction,
  getStepForRole,
  getStatusAfterAction,
  isFinalApprover,
  type ApprovalAction,
} from "@/lib/workflow";
import type { AppRole } from "@/lib/rbac";
import { LeaveStatus } from "@prisma/client";
import { z } from "zod";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";
import { calculateMLConversion, formatConversionBreakdown } from "@/lib/medical-leave-conversion";
import { calculateCLConversion, formatCLConversionBreakdown } from "@/lib/casual-leave-conversion";
import { fetchHolidaysInRange } from "@/lib/leave-validation";
import { countWorkingDays } from "@/lib/working-days";
import { deductBalance, deductMultipleBalances } from "@/lib/balance-manager";

export const cache = "no-store";

const ApproveSchema = z.object({
  comment: z.string().optional(),
});

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

  const userRole = user.role as AppRole;

  // Get the leave request with requester (need type and role for per-type chain resolution)
  const leave = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
    include: { requester: { select: { email: true, role: true } } },
  });

  if (!leave) {
    return NextResponse.json(error("not_found", undefined, traceId), {
      status: 404,
    });
  }

  const requesterRole = leave.requester.role as AppRole;

  // Explicitly exclude HR_ADMIN from approval (operational role only)
  if (userRole === "HR_ADMIN") {
    return NextResponse.json(
      error(
        "forbidden",
        "HR Admin cannot approve requests. Only final approvers (Dept Head or CEO) can approve.",
        traceId
      ),
      { status: 403 }
    );
  }

  // Check if user can approve for this leave type (per-type chain logic with requester role)
  if (!canPerformAction(userRole, "APPROVE", leave.type, requesterRole)) {
    return NextResponse.json(
      error("forbidden", "You cannot approve leave requests", traceId),
      { status: 403 }
    );
  }

  // Verify user is final approver for this leave type and requester
  if (!isFinalApprover(userRole, leave.type, requesterRole)) {
    return NextResponse.json(
      error(
        "forbidden",
        "Only the final approver can approve leave requests",
        traceId
      ),
      { status: 403 }
    );
  }

  // Parse request body
  const body = await request.json().catch(() => ({}));
  const parsed = ApproveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(error("invalid_input", undefined, traceId), {
      status: 400,
    });
  }

  // Prevent self-approval
  if (leave.requesterId === user.id) {
    return NextResponse.json(
      error("self_approval_disallowed", undefined, traceId),
      { status: 403 }
    );
  }

  // Check if leave is in an approvable state
  const isCancellationRequest = leave.status === "CANCELLATION_REQUESTED" || leave.isCancellationRequest;
  const validStatuses = isCancellationRequest
    ? ["CANCELLATION_REQUESTED", "PENDING"]
    : ["SUBMITTED", "PENDING"];

  if (!validStatuses.includes(leave.status)) {
    return NextResponse.json(
      error("invalid_status", undefined, traceId, {
        currentStatus: leave.status,
      }),
      { status: 400 }
    );
  }

  const step = getStepForRole(userRole, leave.type, requesterRole);
  const newStatus = isCancellationRequest
    ? "CANCELLED" as LeaveStatus  // Cancellation approved → status becomes CANCELLED
    : getStatusAfterAction(leave.status as LeaveStatus, "APPROVE");

  // Update existing PENDING approval to APPROVED, or create new one
  const existingApproval = await prisma.approval.findFirst({
    where: {
      leaveId,
      approverId: user.id,
      decision: "PENDING",
    },
  });

  if (existingApproval) {
    await prisma.approval.update({
      where: { id: existingApproval.id },
      data: {
        decision: "APPROVED",
        decidedAt: new Date(),
        comment: parsed.data.comment,
      },
    });
  } else {
    // Fallback: create new approval record
    await prisma.approval.create({
      data: {
        leaveId,
        step,
        approverId: user.id,
        decision: "APPROVED",
        decidedAt: new Date(),
        comment: parsed.data.comment,
      },
    });
  }

  // Update leave status
  await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: { status: newStatus as LeaveStatus },
  });

  // Handle balance updates
  const currentYear = new Date().getFullYear();

  // For cancellation requests: restore balance instead of deducting
  if (isCancellationRequest) {
    // For partial cancellation: days already deducted minus new working days
    // For full cancellation: all working days
    // Note: For partial cancellation, the leave.workingDays already represents the NEW reduced days
    // So we need to get the originally deducted amount from the balance or calculate it

    // Get the original deducted days (before cancellation request was made)
    // This should be calculated from originalEndDate if partial, or workingDays if full
    let daysToRestore = 0;

    if (leave.isPartialCancellation && leave.originalEndDate) {
      // Calculate original working days from originalEndDate
      const holidays = await fetchHolidaysInRange(leave.startDate, leave.originalEndDate);
      const originalWorkingDays = await countWorkingDays(leave.startDate, leave.originalEndDate, holidays);
      daysToRestore = originalWorkingDays - leave.workingDays; // Difference between original and new
    } else {
      // Full cancellation: restore all working days
      daysToRestore = leave.workingDays;
    }

    // Restore balance
    const balance = await prisma.balance.findUnique({
      where: {
        userId_type_year: {
          userId: leave.requesterId,
          type: leave.type,
          year: currentYear,
        },
      },
    });

    if (balance && daysToRestore > 0) {
      const newUsed = Math.max((balance.used || 0) - daysToRestore, 0);
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
    }

    // Create audit log for cancellation approval
    await prisma.auditLog.create({
      data: {
        actorEmail: user.email,
        action: leave.isPartialCancellation ? "PARTIAL_CANCELLATION_APPROVED" : "CANCELLATION_APPROVED",
        targetEmail: leave.requester.email,
        details: {
          leaveId,
          actorRole: userRole,
          step,
          daysRestored: daysToRestore,
          isPartial: leave.isPartialCancellation,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      status: newStatus,
      message: leave.isPartialCancellation
        ? `Partial cancellation approved. ${daysToRestore} day(s) restored to balance.`
        : `Cancellation approved. ${daysToRestore} day(s) restored to balance.`,
    });
  }

  // Regular leave approval: deduct from balance
  // CL >3 days: First 3 days from CL, remaining from EL (Policy 6.20.d)
  let clConversionDetails: string | null = null;

  // ML >14 days: First 14 days from ML, excess from EL/Special/Extraordinary (Policy 6.21.c)
  let mlConversionDetails: string | null = null;

  if (leave.type === "CASUAL" && leave.workingDays > 3) {
    // Get all relevant balances for conversion calculation
    const [clBalance, elBalance] = await Promise.all([
      prisma.balance.findUnique({
        where: {
          userId_type_year: {
            userId: leave.requesterId,
            type: "CASUAL",
            year: currentYear,
          },
        },
      }),
      prisma.balance.findUnique({
        where: {
          userId_type_year: {
            userId: leave.requesterId,
            type: "EARNED",
            year: currentYear,
          },
        },
      }),
    ]);

    // Calculate conversion (first 3 days CL, remaining EL)
    const conversion = calculateCLConversion(leave.workingDays, {
      cl: (clBalance?.opening || 0) + (clBalance?.accrued || 0) - (clBalance?.used || 0),
      el: (elBalance?.opening || 0) + (elBalance?.accrued || 0) - (elBalance?.used || 0),
    });

    clConversionDetails = formatCLConversionBreakdown(conversion);

    // SECURITY: Use atomic multi-balance deduction to prevent race conditions
    const deductions: Array<{ type: any; days: number }> = [];
    if (conversion.clPortion > 0) {
      deductions.push({ type: "CASUAL", days: conversion.clPortion });
    }
    if (conversion.elPortion > 0) {
      deductions.push({ type: "EARNED", days: conversion.elPortion });
    }

    const deductionResult = await deductMultipleBalances(
      leave.requesterId,
      deductions,
      currentYear,
      leave.id,
      { id: user.id, email: user.email, role: userRole }
    );

    if (!deductionResult.success) {
      return NextResponse.json(
        error(
          "balance_deduction_failed",
          deductionResult.error || "Failed to deduct CL/EL balance for conversion",
          traceId,
          {
            leaveId: leave.id,
            conversion: { clPortion: conversion.clPortion, elPortion: conversion.elPortion },
          }
        ),
        { status: 400 }
      );
    }
  } else if (leave.type === "MEDICAL" && leave.workingDays > 14) {
    // Medical Leave >14 days requiring auto-conversion (Policy 6.21.c)
    // Get all relevant balances for conversion calculation
    const [mlBalance, elBalance, specialElBalance] = await Promise.all([
      prisma.balance.findUnique({
        where: {
          userId_type_year: {
            userId: leave.requesterId,
            type: "MEDICAL",
            year: currentYear,
          },
        },
      }),
      prisma.balance.findUnique({
        where: {
          userId_type_year: {
            userId: leave.requesterId,
            type: "EARNED",
            year: currentYear,
          },
        },
      }),
      prisma.balance.findUnique({
        where: {
          userId_type_year: {
            userId: leave.requesterId,
            type: "SPECIAL",
            year: currentYear,
          },
        },
      }),
    ]);

    // Calculate conversion
    const conversion = calculateMLConversion(leave.workingDays, {
      ml: (mlBalance?.opening || 0) + (mlBalance?.accrued || 0) - (mlBalance?.used || 0),
      el: (elBalance?.opening || 0) + (elBalance?.accrued || 0) - (elBalance?.used || 0),
      specialEl: (specialElBalance?.opening || 0) + (specialElBalance?.accrued || 0) - (specialElBalance?.used || 0),
    });

    mlConversionDetails = formatConversionBreakdown(conversion);

    // Update ML balance (up to 14 days)
    if (conversion.mlPortion > 0 && mlBalance) {
      const newUsed = (mlBalance.used || 0) + conversion.mlPortion;
      const newClosing = (mlBalance.opening || 0) + (mlBalance.accrued || 0) - newUsed;

      await prisma.balance.update({
        where: {
          userId_type_year: {
            userId: leave.requesterId,
            type: "MEDICAL",
            year: currentYear,
          },
        },
        data: {
          used: newUsed,
          closing: Math.max(newClosing, 0),
        },
      });
    }

    // Update EL balance (excess days)
    if (conversion.elPortion > 0 && elBalance) {
      const newUsed = (elBalance.used || 0) + conversion.elPortion;
      const newClosing = (elBalance.opening || 0) + (elBalance.accrued || 0) - newUsed;

      await prisma.balance.update({
        where: {
          userId_type_year: {
            userId: leave.requesterId,
            type: "EARNED",
            year: currentYear,
          },
        },
        data: {
          used: newUsed,
          closing: Math.max(newClosing, 0),
        },
      });
    }

    // Update Special EL balance (if EL insufficient)
    if (conversion.specialElPortion > 0 && specialElBalance) {
      const newUsed = (specialElBalance.used || 0) + conversion.specialElPortion;
      const newClosing = (specialElBalance.opening || 0) + (specialElBalance.accrued || 0) - newUsed;

      await prisma.balance.update({
        where: {
          userId_type_year: {
            userId: leave.requesterId,
            type: "SPECIAL",
            year: currentYear,
          },
        },
        data: {
          used: newUsed,
          closing: Math.max(newClosing, 0),
        },
      });
    }

    // Note: Extraordinary Leave has no balance to track (unpaid leave)
    // It's just recorded in the conversion details for transparency
  } else {
    // Standard balance update for non-CL, non-ML, or CL ≤3 days / ML ≤14 days
    // SECURITY: Use atomic deduction to prevent race conditions
    const deductionResult = await deductBalance(
      leave.requesterId,
      leave.type,
      leave.workingDays,
      currentYear,
      leave.id,
      { id: user.id, email: user.email, role: userRole }
    );

    if (!deductionResult.success) {
      // Balance deduction failed (insufficient balance or race condition)
      return NextResponse.json(
        error(
          "balance_deduction_failed",
          deductionResult.error || "Failed to deduct balance",
          traceId,
          {
            leaveId: leave.id,
            requiredDays: leave.workingDays,
            leaveType: leave.type,
          }
        ),
        { status: 400 }
      );
    }

    // Log successful deduction details in approval audit
    await prisma.auditLog.create({
      data: {
        actorEmail: user.email,
        action: "BALANCE_DEDUCTION_ON_APPROVAL",
        targetEmail: leave.requester.email,
        details: {
          leaveId: leave.id,
          balanceId: deductionResult.balanceId,
          beforeUsed: deductionResult.beforeUsed,
          afterUsed: deductionResult.afterUsed,
          beforeClosing: deductionResult.beforeClosing,
          afterClosing: deductionResult.afterClosing,
          days: leave.workingDays,
          leaveType: leave.type,
        },
      },
    });
  }

  // Create audit log
  await prisma.auditLog.create({
    data: {
      actorEmail: user.email,
      action: "LEAVE_APPROVE",
      targetEmail: leave.requester.email,
      details: {
        leaveId,
        actorRole: userRole,
        step,
        ...(clConversionDetails && {
          clConversion: {
            applied: true,
            reason: "Casual leave >3 days auto-converted per Policy 6.20.d",
            breakdown: clConversionDetails,
          },
        }),
        ...(mlConversionDetails && {
          mlConversion: {
            applied: true,
            reason: "Medical leave >14 days auto-converted per Policy 6.21.c",
            breakdown: mlConversionDetails,
          },
        }),
      },
    },
  });

  return NextResponse.json({
    ok: true,
    status: newStatus,
    ...(clConversionDetails && {
      clConversion: {
        applied: true,
        details: clConversionDetails,
        message: "Casual leave >3 days was automatically converted per Policy 6.20.d. First 3 days deducted from CL balance, remaining days from EL balance. See breakdown in leave details.",
      },
    }),
    ...(mlConversionDetails && {
      mlConversion: {
        applied: true,
        details: mlConversionDetails,
        message: "Medical leave >14 days was automatically converted per Policy 6.21.c. See breakdown in leave details.",
      },
    }),
  });
}
