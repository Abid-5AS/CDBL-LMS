import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const cache = "no-store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role as string) !== "CEO") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const policyClient = (prisma as any).policyConfig as { findMany: (args?: unknown) => Promise<Array<any>> };
  if (!policyClient) {
    return NextResponse.json({ error: "policy_model_missing" }, { status: 500 });
  }

  const policies = await policyClient.findMany({
    orderBy: { leaveType: "asc" },
  });

  return NextResponse.json({
    items: policies.map((policy) => ({
      ...policy,
      createdAt: policy.createdAt.toISOString(),
      updatedAt: policy.updatedAt.toISOString(),
    })),
  });
}
