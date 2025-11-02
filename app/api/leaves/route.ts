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

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const items = await prisma.leaveRequest.findMany({
    where: { requesterId: me.id },
    orderBy: { createdAt: "desc" },
    include: {
      approvals: {
        include: {
          approver: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          step: "asc",
        },
      },
    },
  });

  return NextResponse.json({ items });
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

/**
 * Check if a date touches a holiday or weekend
 */
async function touchesHolidayOrWeekend(date: Date): Promise<boolean> {
  const day = date.getDay();
  // Weekends: Friday (5) or Saturday (6)
  if (day === 5 || day === 6) return true;
  
  // Check if date is a holiday
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);
  const holiday = await prisma.holiday.findUnique({
    where: { date: dateOnly },
  });
  return !!holiday;
}

/**
 * Check if date range touches holidays/weekends on either side
 */
async function touchesHolidayOrWeekendOnSides(start: Date, end: Date): Promise<boolean> {
  const startTouches = await touchesHolidayOrWeekend(start);
  const endTouches = await touchesHolidayOrWeekend(end);
  return startTouches || endTouches;
}

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

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
    return NextResponse.json({ error: "invalid_dates" }, { status: 400 });
  }

  let certificateUrl: string | undefined;
  if (certificateFile) {
    const ext = (certificateFile.name.split(".").pop() ?? "").toLowerCase();
    const allowed = ["pdf", "jpg", "jpeg", "png"];
    if (!allowed.includes(ext)) {
      return NextResponse.json({ error: "unsupported_file_type" }, { status: 400 });
    }
    if (certificateFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "file_too_large" }, { status: 400 });
    }
    const arrayBuffer = await certificateFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const safeName = certificateFile.name.replace(/[^\w.\-]/g, "_");
    const finalName = `${randomUUID()}-${safeName}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, finalName), buffer);
    certificateUrl = `/uploads/${finalName}`;
  }

  const workingDays = daysInclusive(new Date(start), new Date(end));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDateOnly = new Date(start);
  startDateOnly.setHours(0, 0, 0, 0);
  const isBackdated = startDateOnly < today;
  const t = parsedInput.type as LeaveType;

  // Enforce EL advance notice requirement (15 days)
  if (t === "EARNED") {
    const daysUntilStart = Math.floor((startDateOnly.getTime() - today.getTime()) / 86400000);
    if (daysUntilStart < policy.elMinNoticeDays) {
      return NextResponse.json(
        { error: "el_insufficient_notice", required: policy.elMinNoticeDays, provided: daysUntilStart },
        { status: 400 }
      );
    }
  }

  // Enforce CL consecutive days limit
  if (t === "CASUAL") {
    if (workingDays > policy.clMaxConsecutiveDays) {
      return NextResponse.json(
        { error: "cl_exceeds_consecutive_limit", max: policy.clMaxConsecutiveDays, requested: workingDays },
        { status: 400 }
      );
    }
  }

  // Hard block: ML >3 days requires medical certificate (check before backdate validation)
  const mustCert = needsMedicalCertificate(parsedInput.type, workingDays);
  if (mustCert && !certificateUrl && !parsedInput.needsCertificate) {
    return NextResponse.json(
      { error: "medical_certificate_required", days: workingDays, requiredDays: 3 },
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
        { error: "backdate_disallowed_by_policy", type: leaveTypeKey },
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
    if (!withinBackdateLimit(t, new Date(today), new Date(start))) {
      return NextResponse.json({ error: "backdate_window_exceeded", type: t }, { status: 400 });
    }
  }

  // CL: Cannot be adjacent to holidays/weekends (hard block)
  if (t === "CASUAL") {
    const touchesHoliday = await touchesHolidayOrWeekendOnSides(start, end);
    if (touchesHoliday) {
      return NextResponse.json(
        {
          error: "cl_cannot_touch_holiday",
          message: "Casual Leave cannot be adjacent to holidays or weekends. Please use Earned Leave instead.",
        },
        { status: 400 }
      );
    }
  }

  const warnings = makeWarnings(parsedInput.type, new Date(today), new Date(start));

  // Soft warning: CL advance notice <5 working days (allow submit)
  if (t === "CASUAL") {
    const workingDaysUntilStart = countWorkingDays(today, start);
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
        { error: "cl_annual_cap_exceeded", cap: policy.accrual.CL_PER_YEAR, used: usedThisYear._sum.workingDays ?? 0, requested: workingDays },
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
        { error: "ml_annual_cap_exceeded", cap: policy.accrual.ML_PER_YEAR, used: usedThisYear._sum.workingDays ?? 0, requested: workingDays },
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
            {
              error: "el_carry_cap_exceeded",
              cap: policy.carryForwardCap.EL,
              currentTotal: totalCarry,
              requested: workingDays,
            },
            { status: 400 }
          );
        }
      }
    }
  }

  const available = await getAvailableDays(me.id, t, year);
  if (available < workingDays) {
    return NextResponse.json(
      { error: "insufficient_balance", available, requested: workingDays, type: t },
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
      status: "PENDING",
    },
  });

  return NextResponse.json({ ok: true, id: created.id, warnings });
}
