import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeaveStatus } from "@prisma/client";
import { z } from "zod";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";
import { normalizeToDhakaMidnight } from "@/lib/date-utils";
import { countWorkingDays } from "@/lib/working-days";
import { getChainFor } from "@/lib/workflow";
import { fetchHolidaysInRange } from "@/lib/leave-validation";

export const cache = "no-store";

const ExtendSchema = z.object({
  newEndDate: z.string(), // New extended end date
  extensionReason: z
    .string()
    .min(10, "Extension reason must be at least 10 characters"),
});

/**
 * Extension Request Endpoint
 *
 * Rules (Per Master Spec):
 * - Can only extend APPROVED leaves
 * - Leave must have started (today >= startDate)
 * - Cannot extend if leave has already ended
 * - Creates a new linked LeaveRequest with:
 *   - parentLeaveId: original leave ID
 *   - isExtension: true
 *   - startDate: original endDate + 1 day
 *   - endDate: new extended end date
 *   - type: same as parent
 * - Extension goes through full approval chain
 * - Balance validation applies to extension days
 * - Original leave remains APPROVED
 * - Extension shows as separate request linked to parent
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

  // Get the parent leave
  const parentLeave = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
    include: {
      requester: { select: { id: true, email: true, joinDate: true } },
      extensions: { select: { id: true, status: true } },
    },
  });

  if (!parentLeave) {
    return NextResponse.json(error("not_found", undefined, traceId), {
      status: 404,
    });
  }

  // Check ownership
  if (parentLeave.requesterId !== user.id) {
    return NextResponse.json(
      error(
        "forbidden",
        "You can only extend your own leave requests",
        traceId
      ),
      { status: 403 }
    );
  }

  // Validation 1: Leave must be APPROVED
  if (parentLeave.status !== LeaveStatus.APPROVED) {
    return NextResponse.json(
      error(
        "extension_invalid_status",
        "Can only extend APPROVED leave requests",
        traceId,
        { currentStatus: parentLeave.status }
      ),
      { status: 400 }
    );
  }

  // Validation 2: Leave must have started
  const today = normalizeToDhakaMidnight(new Date());
  const parentStart = normalizeToDhakaMidnight(parentLeave.startDate);
  const parentEnd = normalizeToDhakaMidnight(parentLeave.endDate);

  if (today < parentStart) {
    return NextResponse.json(
      error(
        "extension_not_started",
        "Cannot extend a leave that hasn't started yet. Please modify the original request instead.",
        traceId,
        { startDate: parentLeave.startDate }
      ),
      { status: 400 }
    );
  }

  // Validation 3: Leave must not have ended
  if (today > parentEnd) {
    return NextResponse.json(
      error(
        "extension_already_ended",
        "Cannot extend a leave that has already ended",
        traceId,
        { endDate: parentLeave.endDate }
      ),
      { status: 400 }
    );
  }

  // Validation 4: Check if there's already a PENDING extension
  const pendingExtension = parentLeave.extensions.find(
    (ext) => ext.status === "SUBMITTED" || ext.status === "PENDING"
  );

  if (pendingExtension) {
    return NextResponse.json(
      error(
        "extension_already_pending",
        "You already have a pending extension request for this leave",
        traceId,
        { extensionId: pendingExtension.id }
      ),
      { status: 400 }
    );
  }

  // Parse request body
  const body = await request.json().catch(() => ({}));
  const parsed = ExtendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      error(
        "invalid_input",
        parsed.error.flatten().formErrors[0] || "Invalid extension data",
        traceId
      ),
      { status: 400 }
    );
  }

  const newEndDate = normalizeToDhakaMidnight(new Date(parsed.data.newEndDate));

  // Validation 5: New end date must be after original end date
  if (newEndDate <= parentEnd) {
    return NextResponse.json(
      error(
        "extension_invalid_date",
        "Extension end date must be after the original leave end date",
        traceId,
        {
          originalEndDate: parentLeave.endDate,
          requestedEndDate: newEndDate,
        }
      ),
      { status: 400 }
    );
  }

  // Calculate extension dates and working days
  const extensionStartDate = new Date(parentEnd);
  extensionStartDate.setDate(extensionStartDate.getDate() + 1); // Day after original end
  const normalizedExtensionStart = normalizeToDhakaMidnight(extensionStartDate);

  const holidays = await fetchHolidaysInRange(
    normalizedExtensionStart,
    newEndDate
  );

  const extensionWorkingDays = await countWorkingDays(
    normalizedExtensionStart,
    newEndDate,
    holidays
  );

  if (extensionWorkingDays <= 0) {
    return NextResponse.json(
      error(
        "extension_no_working_days",
        "Extension period must include at least one working day",
        traceId
      ),
      { status: 400 }
    );
  }

  // Check balance for extension days
  const currentYear = new Date().getFullYear();
  const balance = await prisma.balance.findUnique({
    where: {
      userId_type_year: {
        userId: user.id,
        type: parentLeave.type,
        year: currentYear,
      },
    },
  });

  if (balance) {
    const availableBalance =
      (balance.opening || 0) + (balance.accrued || 0) - (balance.used || 0);

    if (extensionWorkingDays > availableBalance) {
      return NextResponse.json(
        error(
          "insufficient_balance",
          `Insufficient ${parentLeave.type} balance for extension. Available: ${availableBalance} days, Requested: ${extensionWorkingDays} days.`,
          traceId,
          {
            available: availableBalance,
            requested: extensionWorkingDays,
            type: parentLeave.type,
          }
        ),
        { status: 400 }
      );
    }
  }

  // Create extension request (as new linked LeaveRequest)
  const extensionRequest = await prisma.leaveRequest.create({
    data: {
      requesterId: user.id,
      type: parentLeave.type,
      startDate: normalizedExtensionStart,
      endDate: newEndDate,
      workingDays: extensionWorkingDays,
      reason: `Extension of leave #${parentLeave.id}: ${parsed.data.extensionReason}`,
      needsCertificate: false,
      status: "SUBMITTED",
      policyVersion: "v2.0",
      isModified: false,
      parentLeaveId: parentLeave.id,
      isExtension: true,
    },
  });

  // Create initial approval record for extension (follows full approval chain)
  const approvalChain = getChainFor(parentLeave.type);
  if (approvalChain.length > 0) {
    const firstApproverRole = approvalChain[0];

    // Find the first approver
    let firstApproverId: number | null = null;

    if (firstApproverRole === "HR_ADMIN") {
      // Find any HR_ADMIN
      const hrAdmin = await prisma.user.findFirst({
        where: { role: "HR_ADMIN" },
        select: { id: true },
      });
      firstApproverId = hrAdmin?.id || null;
    } else if (firstApproverRole === "DEPT_HEAD") {
      // Use user's department head
      const userWithDeptHead = await prisma.user.findUnique({
        where: { id: user.id },
        select: { deptHeadId: true },
      });
      firstApproverId = userWithDeptHead?.deptHeadId || null;
    }

    if (firstApproverId) {
      await prisma.approval.create({
        data: {
          leaveId: extensionRequest.id,
          step: 1,
          approverId: firstApproverId,
          decision: "PENDING",
        },
      });
    }
  }

  // Create audit log
  await prisma.auditLog.create({
    data: {
      actorEmail: user.email,
      action: "EXTENSION_REQUESTED",
      targetEmail: user.email,
      details: {
        parentLeaveId: parentLeave.id,
        extensionId: extensionRequest.id,
        originalEndDate: parentLeave.endDate,
        newEndDate: newEndDate,
        extensionDays: extensionWorkingDays,
        reason: parsed.data.extensionReason,
      },
    },
  });

  return NextResponse.json({
    ok: true,
    extensionId: extensionRequest.id,
    parentLeaveId: parentLeave.id,
    extensionStartDate: normalizedExtensionStart,
    extensionEndDate: newEndDate,
    extensionDays: extensionWorkingDays,
    status: "SUBMITTED",
    message: `Extension request created successfully. It will go through the approval chain independently.`,
  });
}
