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
      type: formData.get("type")?.toString(),
      startDate: formData.get("startDate")?.toString(),
      endDate: formData.get("endDate")?.toString(),
      reason: formData.get("reason")?.toString(),
      needsCertificate: formData.get("needsCertificate") === "true",
      certificateUrl: formData.get("certificateUrl")?.toString() || null,
      certificateFile: formData.get("certificate") as File | null,
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
  const holidays = await prisma.holiday.findMany({
    select: { date: true },
  });

  // Calculate working days
  const workingDays = await countWorkingDays(startDate, endDate, holidays.map((h) => h.date));

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
    
    certificateUrl = `/api/uploads/${filename}`;
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

