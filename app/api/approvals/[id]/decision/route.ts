import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { resolveLeave } from "../../resolve-leave";

export const cache = "no-store";

const bodySchema = z.object({
  action: z.enum(["approve", "reject"]),
  comment: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "HR_ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
  }

  const numericId = Number(id);
  if (Number.isNaN(numericId)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const decision = parsed.data.action === "approve" ? "APPROVED" : "REJECTED";
  const result = await resolveLeave(numericId, decision, user.id, parsed.data.comment);

  if (!result.ok) {
    if (result.error === "not_found") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (result.error === "already_resolved") {
      return NextResponse.json({ error: "Leave already resolved" }, { status: 400 });
    }
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    status: result.leave.status,
  });
}
