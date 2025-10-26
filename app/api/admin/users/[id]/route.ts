import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const UpdateSchema = z.object({
  role: z.enum(["EMPLOYEE", "HR_ADMIN", "SUPER_ADMIN"]).optional(),
  department: z.string().min(1).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  noStore();

  const current = await getCurrentUser();
  if (!current || (current.role as string) !== "SUPER_ADMIN") {
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

  return NextResponse.json({
    item: {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
    },
  });
}
