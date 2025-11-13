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
  checkLeaveEligibility,
  calculateMaternityLeaveDays,
  validateQuarantineLeaveDuration,
  validateSpecialDisabilityDuration,
  validateExtraordinaryLeaveDuration,
  checkMedicalLeaveAnnualLimit,
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
import { violatesCasualLeaveSideTouch, violatesCasualLeaveCombination, validatePaternityLeaveEligibility } from "@/lib/leave-validation";
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
    "SPECIAL", // Can be used for medical or rest outside Bangladesh (Policy 6.19.c)
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

  // Check service eligibility per Policy 6.18
  const requester = await prisma.user.findUnique({
    where: { id: me.id },
    select: { joinDate: true },
  });

  if (!requester || !requester.joinDate) {
    return NextResponse.json(
      error("user_join_date_missing", "Employee join date not found. Please contact HR.", traceId),
      { status: 400 }
    );
  }

  const eligibilityCheck = checkLeaveEligibility(parsedInput.type, requester.joinDate);
  if (!eligibilityCheck.eligible) {
    return NextResponse.json(
      error("service_eligibility_not_met", eligibilityCheck.reason, traceId, {
        leaveType: parsedInput.type,
        requiredYears: eligibilityCheck.requiredYears,
      }),
      { status: 403 }
    );
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

    // Enforce CL combination rule (Policy 6.20.e: cannot be combined with other leaves)
    const combinationCheck = await violatesCasualLeaveCombination(
      me.id,
      startDateOnly,
      endDateOnly
    );

    if (combinationCheck.violates && combinationCheck.conflictingLeave) {
      const conflict = combinationCheck.conflictingLeave;
      return NextResponse.json(
        error(
          "cl_cannot_combine_with_other_leave",
          `Casual leave cannot be combined with or adjacent to other leaves (Policy 6.20.e). Conflicts with ${conflict.type} leave from ${conflict.startDate.toLocaleDateString()} to ${conflict.endDate.toLocaleDateString()}.`,
          traceId,
          {
            conflictingLeaveId: conflict.id,
            conflictingLeaveType: conflict.type,
            conflictingStartDate: conflict.startDate,
            conflictingEndDate: conflict.endDate,
          }
        ),
        { status: 400 }
      );
    }
  }

  // Enforce maternity leave pro-rating for employees with <6 months service (Policy 6.23.c)
  if (t === "MATERNITY") {
    const maternityCalc = calculateMaternityLeaveDays(requester.joinDate);
    if (workingDays > maternityCalc.days) {
      const explanation = maternityCalc.isProrated
        ? `Prorated to ${maternityCalc.days} days based on ${maternityCalc.serviceMonths.toFixed(1)} months of service (Policy 6.23.c)`
        : `Maximum 56 days (8 weeks) per Policy 6.23.a`;

      return NextResponse.json(
        error("maternity_exceeds_entitlement", explanation, traceId, {
          maxDays: maternityCalc.days,
          requested: workingDays,
          isProrated: maternityCalc.isProrated,
          serviceMonths: maternityCalc.serviceMonths,
        }),
        { status: 400 }
      );
    }
  }

  // Enforce paternity leave occasion and interval limits (Policy 6.24.b)
  if (t === "PATERNITY") {
    const paternityCheck = await validatePaternityLeaveEligibility(me.id, startDateOnly);
    if (!paternityCheck.valid) {
      return NextResponse.json(
        error("paternity_eligibility_not_met", paternityCheck.reason, traceId, {
          previousLeaves: paternityCheck.previousLeaves,
          monthsSinceFirst: paternityCheck.monthsSinceFirst,
        }),
        { status: 403 }
      );
    }
  }

  // Enforce quarantine leave duration limits (Policy 6.28.b)
  if (t === "QUARANTINE") {
    const quarantineCheck = validateQuarantineLeaveDuration(workingDays);
    if (!quarantineCheck.valid) {
      return NextResponse.json(
        error("quarantine_exceeds_maximum", quarantineCheck.reason, traceId, {
          requested: workingDays,
          maximum: 30,
        }),
        { status: 400 }
      );
    }
    // Note: Exceptional approval (21-30 days) is handled by workflow (CEO approval required)
  }

  // Enforce special disability leave duration limits (Policy 6.27.c)
  if (t === "SPECIAL_DISABILITY") {
    const disabilityCheck = validateSpecialDisabilityDuration(workingDays);
    if (!disabilityCheck.valid) {
      return NextResponse.json(
        error("disability_exceeds_maximum", disabilityCheck.reason, traceId, {
          requested: workingDays,
          maximum: 180,
        }),
        { status: 400 }
      );
    }
  }

  // Enforce extraordinary leave duration limits (Policy 6.22.a, 6.22.b)
  if (t === "EXTRAWITHPAY" || t === "EXTRAWITHOUTPAY") {
    const extraordinaryCheck = validateExtraordinaryLeaveDuration(workingDays, requester.joinDate);
    if (!extraordinaryCheck.valid) {
      return NextResponse.json(
        error("extraordinary_exceeds_maximum", extraordinaryCheck.reason, traceId, {
          requested: workingDays,
          maxAllowed: extraordinaryCheck.maxAllowed,
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

  // Add medical leave excess warning if applicable
  if (mlExcessWarning) {
    (warnings as Record<string, any>).mlExcessWarning = mlExcessWarning;
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
  
  // Medical leave >14 days advisory (Policy 6.21.c)
  // Note: This is a soft warning, not a hard block. Users can still apply but are advised to use EL/SPECIAL
  let mlExcessWarning: string | undefined;
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

    const mlCheck = checkMedicalLeaveAnnualLimit(
      usedThisYear._sum.workingDays ?? 0,
      workingDays
    );

    if (!mlCheck.withinLimit) {
      mlExcessWarning = mlCheck.warning;
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
