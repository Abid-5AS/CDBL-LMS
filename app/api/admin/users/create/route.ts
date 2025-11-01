import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const cache = "no-store";

const CreateUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  empCode: z.string().min(2),
  department: z.string().min(2).optional(),
  role: z.enum(["EMPLOYEE", "DEPT_HEAD", "HR_ADMIN", "HR_HEAD", "CEO"]),
});

export async function POST(req: Request) {

  const actor = await getCurrentUser();
  if (!actor || (actor.role as string) !== "CEO") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const payload = await req.json().catch(() => null);
  const parsed = CreateUserSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "invalid_payload" }, { status: 400 });
  }

  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return NextResponse.json({ error: "email_exists" }, { status: 400 });
  }

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      empCode: data.empCode,
      department: data.department ?? undefined,
      role: data.role as any,
    },
  });

  const log = await prisma.auditLog.create({
    data: {
      actorEmail: actor.email ?? "unknown@cdbl",
      action: "USER_CREATED",
      targetEmail: user.email,
      details: {
        name: user.name,
        role: user.role,
        department: user.department,
        empCode: user.empCode,
      },
    },
  });

  return NextResponse.json({
    ok: true,
    user: {
      ...user,
      createdAt: user.createdAt.toISOString(),
    },
    log: {
      ...log,
      createdAt: log.createdAt.toISOString(),
    },
  });
}
