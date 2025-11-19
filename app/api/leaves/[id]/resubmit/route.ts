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
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { generateSignedUrl } from "@/lib/storage";
import { violatesCasualLeaveSideTouch } from "@/lib/leave-validation";
import { validateStatusTransition } from "@/lib/state-machine";

export const cache = "no-store";

// Note: This endpoint accepts FormData for file uploads
// Schema validation is done manually for FormData

/**
 * Employee resubmits a returned leave request
 * Updates the request with new data and sets status back to PENDING
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  // Get the leave request
  const leave = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
    include: { requester: { select: { email: true } } },
  });

  if (!leave) {
    return NextResponse.json(error("not_found", undefined, traceId), { status: 404 });
  }

  // Verify this is the requester's own request
  if (leave.requesterId !== user.id) {
    return NextResponse.json(
      error("forbidden", "You can only resubmit your own leave requests", traceId),
      { status: 403 }
    );
  }

  // Verify the request is in RETURNED status
  if (leave.status !== "RETURNED") {
    return NextResponse.json(
      error("invalid_status", "Only returned requests can be resubmitted", traceId, {
        currentStatus: leave.status,
      }),
      { status: 400 }
    );
  }

  // Parse request body (may be FormData or JSON)
  const contentType = request.headers.get("content-type") || "";
  let body: any = {};
  
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    body = {
      type: (formData as any).get("type")?.toString(),
      startDate: (formData as any).get("startDate")?.toString(),
      endDate: (formData as any).get("endDate")?.toString(),
      reason: (formData as any).get("reason")?.toString(),
      needsCertificate: (formData as any).get("needsCertificate") === "true",
      certificateUrl: (formData as any).get("certificateUrl")?.toString() || null,
      certificateFile: (formData as any).get("certificate") as File | null,
    };
  } else {
    body = await request.json().catch(() => ({}));
  }

  // Validate required fields
  if (!body.type || !body.startDate || !body.endDate || !body.reason || body.reason.trim().length < 3) {
    return NextResponse.json(
      error("invalid_input", "Missing required fields or reason too short", traceId),
      { status: 400 }
    );
  }

  // Normalize dates to Dhaka midnight
  const startDate = normalizeToDhakaMidnight(new Date(body.startDate));
  const endDate = normalizeToDhakaMidnight(new Date(body.endDate));

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return NextResponse.json(
      error("invalid_input", "Invalid date format", traceId),
      { status: 400 }
    );
  }

  // Get holidays for working days calculation
  const holidaysRaw = await prisma.holiday.findMany({
    select: { date: true, name: true },
  });
  const holidays = holidaysRaw.map(h => ({ ...h, date: h.date.toISOString().slice(0, 10) }));

  // Calculate working days
  const workingDays = await countWorkingDays(startDate, endDate, holidays);

  // Enforce CL side-touch rule
  if (body.type === "CASUAL") {
    const violates = await violatesCasualLeaveSideTouch(startDate, endDate);
    if (violates) {
      return NextResponse.json(
        error(
          "cl_cannot_touch_holiday",
          "Casual Leave cannot be adjacent to holidays or weekends. Please use Earned Leave instead.",
          traceId
        ),
        { status: 400 }
      );
    }
  }

  // ==================== CRITICAL SECURITY VALIDATIONS ====================
  // These checks prevent balance exploitation and unauthorized modifications

  const currentYear = new Date().getFullYear();
  const originalWorkingDays = leave.workingDays;
  const daysDifference = workingDays - originalWorkingDays;

  // SECURITY CHECK 1: Validate state transition (prevents APPROVED → PENDING exploit)
  try {
    validateStatusTransition(leave.status, "PENDING");
  } catch (e: any) {
    return NextResponse.json(
      error("invalid_state_transition", e.message, traceId),
      { status: 400 }
    );
  }

  // SECURITY CHECK 2: Prevent leave type changes (prevents type switching exploits)
  if (body.type !== leave.type) {
    return NextResponse.json(
      error(
        "cannot_change_type",
        "Leave type cannot be modified after submission. Please cancel and create a new request.",
        traceId,
        { originalType: leave.type, requestedType: body.type }
      ),
      { status: 400 }
    );
  }

  // SECURITY CHECK 3: Prevent excessive day increases (prevents day extension exploits)
  const MAX_DAY_INCREASE = 3; // Policy: Cannot increase by more than 3 days without new request
  if (daysDifference > MAX_DAY_INCREASE) {
    return NextResponse.json(
      error(
        "excessive_modification",
        `Cannot increase leave duration by more than ${MAX_DAY_INCREASE} days. Current: ${originalWorkingDays} days, Requested: ${workingDays} days (+${daysDifference}). Please create a new request or extension.`,
        traceId,
        { originalDays: originalWorkingDays, requestedDays: workingDays, maxIncrease: MAX_DAY_INCREASE }
      ),
      { status: 400 }
    );
  }

  // SECURITY CHECK 4: Validate sufficient balance for the NEW request
  // This prevents the exploit where balance was already deducted on previous approval
  const existingBalance = await prisma.balance.findUnique({
    where: {
      userId_type_year: {
        userId: user.id,
        type: body.type as any,
        year: currentYear,
      },
    },
  });

  if (!existingBalance) {
    return NextResponse.json(
      error(
        "no_balance_record",
        `No balance record found for ${body.type} leave in ${currentYear}`,
        traceId
      ),
      { status: 400 }
    );
  }

  const availableBalance =
    (existingBalance.opening || 0) +
    (existingBalance.accrued || 0) -
    (existingBalance.used || 0);

  // CRITICAL: Check if new working days exceed available balance
  // If previous approval deducted days, we need to account for that
  let balanceNeeded = workingDays;

  // If leave was previously approved and balance was deducted, we need to restore it first
  // Then check if the new request can be fulfilled
  if (leave.approvedAt) {
    // Balance was previously deducted, restore it for this check
    balanceNeeded = workingDays - originalWorkingDays; // Only need the difference

    // If reducing days, no balance check needed
    if (balanceNeeded <= 0) {
      balanceNeeded = 0;
    } else if (balanceNeeded > availableBalance) {
      return NextResponse.json(
        error(
          "insufficient_balance",
          `Insufficient balance for modification. Available: ${availableBalance} days, Additional required: ${balanceNeeded} days (Original: ${originalWorkingDays}, New: ${workingDays})`,
          traceId,
          { available: availableBalance, required: balanceNeeded, originalDays: originalWorkingDays, newDays: workingDays }
        ),
        { status: 400 }
      );
    }
  } else {
    // Leave was never approved, check full amount
    if (workingDays > availableBalance) {
      return NextResponse.json(
        error(
          "insufficient_balance",
          `Insufficient balance. Available: ${availableBalance} days, Requested: ${workingDays} days`,
          traceId,
          { available: availableBalance, requested: workingDays }
        ),
        { status: 400 }
      );
    }
  }

  // SECURITY CHECK 5: Restore balance if leave was previously approved
  // This prevents the double-deduction exploit
  if (leave.approvedAt && originalWorkingDays > 0) {
    await prisma.balance.update({
      where: {
        userId_type_year: {
          userId: user.id,
          type: leave.type as any,
          year: currentYear,
        },
      },
      data: {
        used: { decrement: originalWorkingDays },
        closing: { increment: originalWorkingDays },
      },
    });

    // Log balance restoration
    await prisma.auditLog.create({
      data: {
        actorEmail: user.email,
        action: "BALANCE_RESTORED_ON_RESUBMIT",
        targetEmail: leave.requester.email,
        details: {
          leaveId,
          restoredDays: originalWorkingDays,
          reason: "Resubmit after approval - restoring original deduction",
          leaveType: leave.type,
          year: currentYear,
        },
      },
    });
  }

  // ==================== END SECURITY VALIDATIONS ====================

  // Handle file upload if provided
  let certificateUrl = body.certificateUrl || leave.certificateUrl;
  if (body.certificateFile && body.certificateFile instanceof File) {
    const uploadsDir = path.join(process.cwd(), "private", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    
    const fileExt = path.extname(body.certificateFile.name);
    const filename = `${randomUUID()}${fileExt}`;
    const filePath = path.join(uploadsDir, filename);
    
    const bytes = await body.certificateFile.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(bytes));
    
    certificateUrl = generateSignedUrl(filename);
  }

  // Get the workflow chain for this leave type
  const chain = getChainFor(body.type as any);
  const firstApproverRole = chain[0]; // HR_ADMIN for most types

  // Capture version snapshot BEFORE updating (for comparison)
  const currentVersionCount = await prisma.leaveVersion.count({
    where: { leaveId },
  });
  const nextVersion = currentVersionCount + 1;

  // Store snapshot of current state before update
  await prisma.leaveVersion.create({
    data: {
      leaveId,
      version: nextVersion,
      data: {
        type: leave.type,
        startDate: leave.startDate.toISOString(),
        endDate: leave.endDate.toISOString(),
        workingDays: leave.workingDays,
        reason: leave.reason,
        needsCertificate: leave.needsCertificate,
        certificateUrl: leave.certificateUrl,
        fitnessCertificateUrl: leave.fitnessCertificateUrl,
        status: leave.status,
        updatedAt: leave.updatedAt.toISOString(),
      },
      createdById: user.id,
      createdByRole: user.role,
    },
  });

  // Delete old approval records to start fresh workflow
  await prisma.approval.deleteMany({
    where: { leaveId },
  });

  // Update the leave request with new data
  // Status is set to PENDING, which will make it visible to HR_ADMIN in their queue
  // Set isModified to true to indicate this was resubmitted after return
  await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: {
      type: body.type,
      startDate,
      endDate,
      reason: body.reason.trim(),
      workingDays,
      needsCertificate: body.needsCertificate ?? leave.needsCertificate,
      certificateUrl,
      status: "PENDING" as LeaveStatus,
      isModified: true, // Mark as modified for comparison UI
      updatedAt: new Date(),
    },
  });

  // Note: We don't create an Approval record here because:
  // 1. HR_ADMIN will see this in their queue via /api/approvals (status=PENDING, no FORWARDED approvals)
  // 2. When HR_ADMIN processes it, they'll create their own approval record
  // 3. This matches the initial submission flow where status=PENDING and no approvals exist yet

  // Add a comment from the employee indicating resubmission
  await prisma.leaveComment.create({
    data: {
      leaveId,
      authorId: user.id,
      authorRole: "EMPLOYEE",
      comment: "Request resubmitted after modification",
    },
  });

  // Calculate what changed for audit log
  const changes: Record<string, any> = {};
  if (leave.type !== body.type) changes.type = { from: leave.type, to: body.type };
  if (leave.startDate.getTime() !== startDate.getTime()) changes.startDate = { from: leave.startDate.toISOString(), to: startDate.toISOString() };
  if (leave.endDate.getTime() !== endDate.getTime()) changes.endDate = { from: leave.endDate.toISOString(), to: endDate.toISOString() };
  if (leave.reason !== body.reason.trim()) changes.reason = { from: leave.reason, to: body.reason.trim() };
  if (leave.workingDays !== workingDays) changes.workingDays = { from: leave.workingDays, to: workingDays };

  // Create audit log with change details
  await prisma.auditLog.create({
    data: {
      actorEmail: user.email,
      action: "LEAVE_RESUBMIT",
      targetEmail: leave.requester.email,
      details: {
        leaveId,
        actorRole: "EMPLOYEE",
        previousStatus: "RETURNED",
        newStatus: "PENDING",
        nextApproverRole: firstApproverRole,
        version: nextVersion,
        modifiedFields: Object.keys(changes),
        changes,
      },
    },
  });

  return NextResponse.json({
    ok: true,
    status: "PENDING",
    message: "Leave request resubmitted successfully",
  });
}

