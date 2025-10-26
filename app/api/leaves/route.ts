import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
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

export const runtime = "nodejs";

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
    include: { approvals: true },
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
  const isBackdated = start < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const t = parsedInput.type as LeaveType;

  if (isBackdated) {
    if (!canBackdate(t)) {
      return NextResponse.json({ error: "backdate_disallowed", type: t }, { status: 400 });
    }
    if (!withinBackdateLimit(t, new Date(today), new Date(start))) {
      return NextResponse.json({ error: "backdate_window_exceeded", type: t }, { status: 400 });
    }
  }

  const warnings = makeWarnings(parsedInput.type, new Date(today), new Date(start));

  const mustCert = needsMedicalCertificate(parsedInput.type, workingDays);
  const needsCertificate = parsedInput.needsCertificate ?? mustCert;
  if (mustCert) {
    (warnings as Record<string, boolean>).mlNeedsCertificate = true;
  }

  const year = yearOf(start);
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
