import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const cache = "no-store";

const UpdateSchema = z.object({
  role: z.enum(["EMPLOYEE", "DEPT_HEAD", "HR_ADMIN", "HR_HEAD", "CEO"]).optional(),
  department: z.string().min(1).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {

  const current = await getCurrentUser();
  if (!current || (current.role as string) !== "CEO") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const numericId = Number(id);
  if (Number.isNaN(numericId)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "invalid_payload" }, { status: 400 });
  }

  const payload = parsed.data;
  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: "no_changes" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: numericId },
    select: { id: true, email: true, role: true, department: true, name: true },
  });
  if (!target) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (payload.role && payload.role !== "CEO" && target.role === "CEO") {
    const remaining = await prisma.user.count({ where: { role: "CEO" as any, NOT: { id: numericId } } });
    if (remaining === 0) {
      return NextResponse.json({ error: "last_super_admin" }, { status: 400 });
    }
  }

  const updated = await prisma.user.update({
    where: { id: numericId },
    data: {
      role: (payload.role ?? undefined) as any,
      department: payload.department ?? undefined,
    },
    select: {
      id: true,
      name: true,
      email: true,
      empCode: true,
      role: true,
      department: true,
      createdAt: true,
    },
  });

  const log = await prisma.auditLog.create({
    data: {
      actorEmail: current.email ?? "unknown@cdbl",
      action: "USER_UPDATED",
      targetEmail: updated.email,
      details: {
        previousRole: target.role,
        newRole: updated.role,
        previousDepartment: target.department,
        newDepartment: updated.department,
      },
    },
  });

  return NextResponse.json({
    item: {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
    },
    log: {
      ...log,
      createdAt: log.createdAt.toISOString(),
    },
  });
}
