import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const UpdateSchema = z
  .object({
    maxDays: z.number().int().min(0).nullable().optional(),
    minDays: z.number().int().min(0).nullable().optional(),
    noticeDays: z.number().int().min(0).nullable().optional(),
    carryLimit: z.number().int().min(0).nullable().optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, "No fields provided");

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  noStore();

  const user = await getCurrentUser();
  if (!user || (user.role as string) !== "SUPER_ADMIN") {
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

  const policyClient = (prisma as any).policyConfig as {
    update: (args: unknown) => Promise<any>;
  };
  if (!policyClient) {
    return NextResponse.json({ error: "policy_model_missing" }, { status: 500 });
  }

  const policy = await policyClient.update({
    where: { id: numericId },
    data: {
      maxDays: payload.maxDays ?? undefined,
      minDays: payload.minDays ?? undefined,
      noticeDays: payload.noticeDays ?? undefined,
      carryLimit: payload.carryLimit ?? undefined,
    },
  });

  return NextResponse.json({
    item: {
      ...policy,
      createdAt: policy.createdAt.toISOString(),
      updatedAt: policy.updatedAt.toISOString(),
    },
  });
}
