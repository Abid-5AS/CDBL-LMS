export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { Leave } from "@/models/leave";

const bodySchema = z.object({
  action: z.enum(["approve", "reject"]),
  comment: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
  }

  await dbConnect();
  const leave = await Leave.findById(params.id);
  if (!leave) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (leave.status !== "PENDING") {
    return NextResponse.json({ error: "Leave already resolved" }, { status: 400 });
  }

  const stageIndex =
    typeof leave.currentStageIndex === "number" && leave.currentStageIndex >= 0
      ? leave.currentStageIndex
      : 0;
  const step = Array.isArray(leave.approvals) ? leave.approvals[stageIndex] : null;

  if (!step || step.role !== user.role || step.status !== "PENDING") {
    return NextResponse.json({ error: "Not allowed for this stage" }, { status: 403 });
  }

  step.status = parsed.data.action === "approve" ? "APPROVED" : "REJECTED";
  step.decidedById = user.id;
  step.decidedByName = user.name;
  step.decidedAt = new Date();
  step.comment = parsed.data.comment;

  if (parsed.data.action === "reject") {
    leave.status = "REJECTED";
  } else {
    if (stageIndex + 1 < leave.approvals.length) {
      leave.currentStageIndex = stageIndex + 1;
      leave.status = "PENDING";
    } else {
      leave.status = "APPROVED";
    }
  }

  await leave.save();

  return NextResponse.json({
    ok: true,
    status: leave.status,
    currentStageIndex: leave.currentStageIndex,
  });
}
