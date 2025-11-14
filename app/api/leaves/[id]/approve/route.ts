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

  // Get the leave request with requester (need type for per-type chain resolution)
  const leave = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
    include: { requester: { select: { email: true } } },
  });

  if (!leave) {
    return NextResponse.json(error("not_found", undefined, traceId), {
      status: 404,
    });
  }

  // Explicitly exclude HR_ADMIN from approval (operational role only)
  if (userRole === "HR_ADMIN") {
    return NextResponse.json(
      error(
        "forbidden",
        "HR Admin cannot approve requests. Only HR Head, CEO, or System Admin can approve.",
        traceId
      ),
      { status: 403 }
    );
  }

  // Check if user can approve for this leave type (per-type chain logic)
  if (!canPerformAction(userRole, "APPROVE", leave.type)) {
    return NextResponse.json(
      error("forbidden", "You cannot approve leave requests", traceId),
      { status: 403 }
    );
  }

  // Verify user is final approver for this leave type
  if (!isFinalApprover(userRole, leave.type)) {
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
  if (!["SUBMITTED", "PENDING"].includes(leave.status)) {
    return NextResponse.json(
      error("invalid_status", undefined, traceId, {
        currentStatus: leave.status,
      }),
      { status: 400 }
    );
  }

  const step = getStepForRole(userRole, leave.type);
  const newStatus = getStatusAfterAction(
    leave.status as LeaveStatus,
    "APPROVE"
  );

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

  // Update balance when leave is approved
  const currentYear = new Date().getFullYear();

  // Check if this is Medical Leave >14 days requiring auto-conversion (Policy 6.21.c)
  let conversionDetails: string | null = null;

  if (leave.type === "MEDICAL" && leave.workingDays > 14) {
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

    conversionDetails = formatConversionBreakdown(conversion);

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
    // Standard balance update for non-ML or ML ≤14 days
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
      const newUsed = (balance.used || 0) + leave.workingDays;
      const newClosing = Math.max(
        (balance.opening || 0) + (balance.accrued || 0) - newUsed,
        0
      );

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
        ...(conversionDetails && {
          mlConversion: {
            applied: true,
            reason: "Medical leave >14 days auto-converted per Policy 6.21.c",
            breakdown: conversionDetails,
          },
        }),
      },
    },
  });

  return NextResponse.json({
    ok: true,
    status: newStatus,
    ...(conversionDetails && {
      mlConversion: {
        applied: true,
        details: conversionDetails,
        message: "Medical leave >14 days was automatically converted per Policy 6.21.c. See breakdown in leave details.",
      },
    }),
  });
}
