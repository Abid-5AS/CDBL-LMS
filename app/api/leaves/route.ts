import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const cache = "no-store";
import { LeaveType } from "@prisma/client";
import {
  policy,
  daysInclusive,
  needsMedicalCertificate,
  canBackdate,
  withinBackdateLimit,
  makeWarnings,
} from "@/lib/policy";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { getBackdateSettings, type BackdateSetting } from "@/lib/org-settings";
import { countWorkingDays } from "@/lib/working-days";
import { normalizeToDhakaMidnight } from "@/lib/date-utils";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";
import { getStepForRole } from "@/lib/workflow";
import { violatesCasualLeaveSideTouch } from "@/lib/leave-validation";
import { generateSignedUrl } from "@/lib/storage";

const ApplySchema = z.object({
  type: z.enum([
    "EARNED",
    "CASUAL",
    "MEDICAL",
    "EXTRAWITHPAY",
    "EXTRAWITHOUTPAY",
    "MATERNITY",
    "PATERNITY",
    "STUDY",
    "SPECIAL_DISABILITY",
    "QUARANTINE",
  ]),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().min(3),
  workingDays: z.number().int().positive().optional(),
  needsCertificate: z.boolean().optional(),
});

export async function GET(req: Request) {
  const me = await getCurrentUser();
  const traceId = getTraceId(req as any);
  if (!me) return NextResponse.json(error("unauthorized", undefined, traceId), { status: 401 });

  // Parse query parameters
  const url = new URL(req.url);
  const statusFilter = url.searchParams.get("status");
  const mine = url.searchParams.get("mine") === "1";

  // Build where clause
  const where: any = {};
  
  if (mine) {
    where.requesterId = me.id;
  }

  if (statusFilter && statusFilter !== "all") {
    where.status = statusFilter;
  }

  const items = await prisma.leaveRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      approvals: {
        include: {
          approver: {
            select: {
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          step: "asc",
        },
      },
      comments: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  // Get author information for comments
  const allCommentAuthorIds = [
    ...new Set(
      items.flatMap((item) => 
        (item.comments || []).map((c: any) => c.authorId).filter(Boolean)
      )
    ),
  ];

  const commentAuthors = allCommentAuthorIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: allCommentAuthorIds } },
        select: { id: true, name: true, role: true },
      })
    : [];

  const authorMap = new Map(commentAuthors.map((a) => [a.id, a]));

  // Map items with author information for comments
  const itemsWithAuthors = items.map((item) => ({
    ...item,
    comments: (item.comments || []).map((comment: any) => ({
      ...comment,
      authorName: authorMap.get(comment.authorId)?.name || "Unknown",
    })),
  }));

  return NextResponse.json({ items: itemsWithAuthors });
}

function yearOf(d: Date) {
  return d.getFullYear();
}

async function getAvailableDays(userId: number, type: LeaveType, year: number) {
  const bal = await prisma.balance.findUnique({
    where: { userId_type_year: { userId, type, year } },
  });
  if (!bal) return 0;
  return (bal.opening ?? 0) + (bal.accrued ?? 0) - (bal.used ?? 0);
}

export async function POST(req: Request) {
  const traceId = getTraceId(req as any);
  const me = await getCurrentUser();
  if (!me) return NextResponse.json(error("unauthorized", undefined, traceId), { status: 401 });

  const contentType = req.headers.get("content-type") ?? "";
  let certificateFile: File | null = null;
  let parsedInput: z.infer<typeof ApplySchema>;

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const toBoolean = (value: FormDataEntryValue | null) => {
      if (typeof value !== "string") return undefined;
      return value === "true";
    };
    const raw = {
      type: String(formData.get("type") ?? ""),
      startDate: String(formData.get("startDate") ?? ""),
      endDate: String(formData.get("endDate") ?? ""),
      reason: String(formData.get("reason") ?? ""),
      workingDays: formData.get("workingDays")
        ? Number(formData.get("workingDays"))
        : undefined,
      needsCertificate: toBoolean(formData.get("needsCertificate")),
    };

    certificateFile = formData.get("certificate") instanceof File ? (formData.get("certificate") as File) : null;
    parsedInput = ApplySchema.parse(raw);
  } else {
    const json = await req.json();
    parsedInput = ApplySchema.parse(json);
  }

  const start = new Date(parsedInput.startDate);
  const end = new Date(parsedInput.endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return NextResponse.json(error("invalid_dates", undefined, traceId), { status: 400 });
  }

  let certificateUrl: string | undefined;
  if (certificateFile) {
    const ext = (certificateFile.name.split(".").pop() ?? "").toLowerCase();
    const allowed = ["pdf", "jpg", "jpeg", "png"];
    if (!allowed.includes(ext)) {
      return NextResponse.json(error("unsupported_file_type", undefined, traceId), { status: 400 });
    }
    if (certificateFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(error("file_too_large", undefined, traceId), { status: 400 });
    }
    const arrayBuffer = await certificateFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const safeName = certificateFile.name.replace(/[^\w.\-]/g, "_");
    const finalName = `${randomUUID()}-${safeName}`;
    const uploadDir = path.join(process.cwd(), "private", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, finalName), buffer);
    certificateUrl = generateSignedUrl(finalName);
  }

  const workingDays = daysInclusive(new Date(start), new Date(end));

  // Normalize all dates to Dhaka midnight for consistent comparison
  const today = normalizeToDhakaMidnight(new Date());
  const startDateOnly = normalizeToDhakaMidnight(new Date(start));
  const endDateOnly = normalizeToDhakaMidnight(new Date(end));
  const isBackdated = startDateOnly < today;
  const t = parsedInput.type as LeaveType;

  // Enforce EL advance notice requirement (5 working days per Policy 6.11)
  if (t === "EARNED") {
    const workingDaysNotice = await countWorkingDays(today, startDateOnly);
    if (workingDaysNotice < policy.elMinNoticeDays) {
      return NextResponse.json(
        error("el_insufficient_notice", undefined, traceId, {
          required: policy.elMinNoticeDays,
          provided: workingDaysNotice,
        }),
        { status: 400 }
      );
    }
  }

  // Enforce CL consecutive days limit
  if (t === "CASUAL") {
    if (workingDays > policy.clMaxConsecutiveDays) {
      return NextResponse.json(
        error("cl_exceeds_consecutive_limit", undefined, traceId, {
          max: policy.clMaxConsecutiveDays,
          requested: workingDays,
        }),
        { status: 400 }
      );
    }
  }

  // Hard block: ML >3 days requires medical certificate (check before backdate validation)
  const mustCert = needsMedicalCertificate(parsedInput.type, workingDays);
  if (mustCert && !certificateUrl && !parsedInput.needsCertificate) {
    return NextResponse.json(
      error("medical_certificate_required", undefined, traceId, {
        days: workingDays,
        requiredDays: 3,
      }),
      { status: 400 }
    );
  }

  // Check backdate settings from orgSettings
  if (isBackdated) {
    const backdateSettings = await getBackdateSettings();
    const leaveTypeKey = t === "EARNED" ? "EL" : t === "CASUAL" ? "CL" : "ML";
    const setting = backdateSettings[leaveTypeKey as keyof typeof backdateSettings];
    
    if (setting === false) {
      return NextResponse.json(
        error("backdate_disallowed_by_policy", undefined, traceId, { type: leaveTypeKey }),
        { status: 400 }
      );
    }
    // If "ask", client should show confirmation modal - we'll allow it but log audit
    if (setting === "ask") {
      // Log audit note that backdate confirmation needed
      await prisma.auditLog.create({
        data: {
          actorEmail: me.email,
          action: "LEAVE_BACKDATE_ASK",
          details: {
            leaveType: leaveTypeKey,
            startDate: start.toISOString(),
            message: "Backdate confirmation required per orgSettings",
          },
        },
      });
    }
    
    // Still validate within backdate limit
    if (!withinBackdateLimit(t, today, startDateOnly)) {
      return NextResponse.json(error("backdate_window_exceeded", undefined, traceId, { type: t }), { status: 400 });
    }
  }

  // CL: Cannot be adjacent to holidays/weekends (hard block)
  if (t === "CASUAL") {
    const clViolatesSideTouch = await violatesCasualLeaveSideTouch(
      startDateOnly,
      endDateOnly
    );
    if (clViolatesSideTouch) {
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

  const warnings = makeWarnings(parsedInput.type, today, startDateOnly);

  // Soft warning: CL advance notice <5 working days (allow submit)
  if (t === "CASUAL") {
    const workingDaysUntilStart = await countWorkingDays(today, startDateOnly);
    if (workingDaysUntilStart < policy.clMinNoticeDays) {
      warnings.clShortNotice = true;
    }
  }

  const needsCertificate = parsedInput.needsCertificate ?? mustCert;
  if (mustCert && certificateUrl) {
    // Certificate provided, no warning needed
  } else if (mustCert) {
    // This shouldn't happen due to hard block above, but keep for consistency
    (warnings as Record<string, boolean>).mlNeedsCertificate = true;
  }

  const year = yearOf(start);
  
  // Hard block: CL annual cap ≤10 days/year
  if (t === "CASUAL") {
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year + 1, 0, 1);
    const usedThisYear = await prisma.leaveRequest.aggregate({
      where: {
        requesterId: me.id,
        type: "CASUAL",
        status: { in: ["APPROVED", "PENDING"] }, // Count approved and pending
        startDate: { gte: yearStart, lt: yearEnd },
      },
      _sum: { workingDays: true },
    });
    const totalUsed = (usedThisYear._sum.workingDays ?? 0) + workingDays;
    if (totalUsed > policy.accrual.CL_PER_YEAR) {
      return NextResponse.json(
        error("cl_annual_cap_exceeded", undefined, traceId, {
          cap: policy.accrual.CL_PER_YEAR,
          used: usedThisYear._sum.workingDays ?? 0,
          requested: workingDays,
        }),
        { status: 400 }
      );
    }
  }
  
  if (t === "MEDICAL") {
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year + 1, 0, 1);
    const usedThisYear = await prisma.leaveRequest.aggregate({
      where: {
        requesterId: me.id,
        type: "MEDICAL",
        status: { in: ["APPROVED", "PENDING"] }, // Count approved and pending
        startDate: { gte: yearStart, lt: yearEnd },
      },
      _sum: { workingDays: true },
    });
    const totalUsed = (usedThisYear._sum.workingDays ?? 0) + workingDays;
    if (totalUsed > policy.accrual.ML_PER_YEAR) {
      return NextResponse.json(
        error("ml_annual_cap_exceeded", undefined, traceId, {
          cap: policy.accrual.ML_PER_YEAR,
          used: usedThisYear._sum.workingDays ?? 0,
          requested: workingDays,
        }),
        { status: 400 }
      );
    }
  }
  
  // Hard block: EL max carry 60 - check if total (opening + accrued) exceeds carry cap
  if (t === "EARNED") {
    const elBalance = await prisma.balance.findUnique({
      where: { userId_type_year: { userId: me.id, type: "EARNED", year } },
    });
    if (elBalance) {
      const totalCarry = (elBalance.opening ?? 0) + (elBalance.accrued ?? 0);
      if (totalCarry > policy.carryForwardCap.EL) {
        // Check if this request would exceed carry cap
        const afterRequest = totalCarry - (elBalance.used ?? 0) - workingDays;
        if (afterRequest > policy.carryForwardCap.EL) {
          return NextResponse.json(
            error("el_carry_cap_exceeded", undefined, traceId, {
              cap: policy.carryForwardCap.EL,
              currentTotal: totalCarry,
              requested: workingDays,
            }),
            { status: 400 }
          );
        }
      }
    }
  }

  // Check for team overlap - prevent too many team members on leave simultaneously
  const currentUser = await prisma.user.findUnique({
    where: { id: me.id },
    select: { deptHeadId: true, department: true },
  });

  if (currentUser?.department) {
    // Find all team members in the same department
    const teamMembers = await prisma.user.findMany({
      where: {
        department: currentUser.department,
        id: { not: me.id }, // Exclude current user
      },
      select: { id: true },
    });

    if (teamMembers.length > 0) {
      // Check how many team members have approved/pending leaves during this period
      const overlappingLeaves = await prisma.leaveRequest.findMany({
        where: {
          requesterId: { in: teamMembers.map((m) => m.id) },
          status: { in: ["APPROVED", "PENDING", "SUBMITTED"] },
          OR: [
            {
              // Leave starts during requested period
              AND: [
                { startDate: { lte: end } },
                { endDate: { gte: start } },
              ],
            },
          ],
        },
        select: {
          requesterId: true,
          requester: { select: { name: true } },
          startDate: true,
          endDate: true,
        },
      });

      const uniqueEmployeesOnLeave = new Set(overlappingLeaves.map((l) => l.requesterId));
      const teamSize = teamMembers.length + 1; // Include current user
      const employeesOnLeaveCount = uniqueEmployeesOnLeave.size + 1; // Include current request
      const percentageOnLeave = (employeesOnLeaveCount / teamSize) * 100;

      // Warn if >30% of team will be on leave
      const TEAM_CAPACITY_THRESHOLD = 30;
      if (percentageOnLeave > TEAM_CAPACITY_THRESHOLD) {
        const overlappingNames = overlappingLeaves
          .slice(0, 3)
          .map((l) => l.requester.name)
          .join(", ");
        const additionalCount = overlappingLeaves.length > 3 ? ` and ${overlappingLeaves.length - 3} more` : "";

        return NextResponse.json(
          error(
            "team_capacity_exceeded",
            `Too many team members on leave during this period. ${overlappingNames}${additionalCount} will also be on leave. Please coordinate with your team or manager.`,
            traceId,
            {
              teamSize,
              onLeaveCount: employeesOnLeaveCount,
              percentageOnLeave: Math.round(percentageOnLeave),
              threshold: TEAM_CAPACITY_THRESHOLD,
            }
          ),
          { status: 400 }
        );
      }
    }
  }

  const available = await getAvailableDays(me.id, t, year);
  if (available < workingDays) {
    return NextResponse.json(
      error("insufficient_balance", undefined, traceId, {
        available,
        requested: workingDays,
        type: t,
      }),
      { status: 400 }
    );
  }

  const created = await prisma.leaveRequest.create({
    data: {
      requesterId: me.id,
      type: t,
      startDate: start,
      endDate: end,
      workingDays,
      reason: parsedInput.reason,
      needsCertificate,
      certificateUrl,
      policyVersion: policy.version,
      status: "SUBMITTED",
    },
  });

  // Create initial pending approval entry for HR Admin (step 1 in chain)
  const hrAdmin = await prisma.user.findFirst({
    where: { role: "HR_ADMIN" },
    orderBy: { id: "asc" },
    select: { id: true },
  });

  if (hrAdmin) {
    const initialStep = Math.max(getStepForRole("HR_ADMIN", t), 1);
    await prisma.approval.create({
      data: {
        leaveId: created.id,
        step: initialStep,
        approverId: hrAdmin.id,
        decision: "PENDING",
        comment: null,
      },
    });
  }

  return NextResponse.json({ ok: true, id: created.id, warnings });
}
