export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Leave } from "@/models/leave";
import { getCurrentUser } from "@/lib/auth";

const NEXT_STAGE: Record<string, string> = {
  DEPT_HEAD: "HR_ADMIN",
  HR_ADMIN: "HR_HEAD",
  HR_HEAD: "CEO",
  CEO: "COMPLETED",
};

export async function POST(req: Request, { params }: { params: { id: string } }) {
  await dbConnect();
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await req.json();
  const action = String(payload?.action ?? "").toUpperCase();
  const note = typeof payload?.note === "string" ? payload.note : undefined;

  if (!["APPROVED", "REJECTED"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const leave = await Leave.findById(params.id);
  if (!leave) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (leave.approverStage === "COMPLETED") {
    return NextResponse.json({ error: "Workflow already completed" }, { status: 400 });
  }

  const roleKey = (me.role ?? "").toUpperCase();
  if (leave.approverStage !== roleKey) {
    return NextResponse.json({ error: "Not your stage" }, { status: 403 });
  }

  if (!Array.isArray(leave.timeline)) {
    leave.timeline = [];
  }

  leave.timeline.push({
    by: me.id,
    role: me.role,
    action,
    at: new Date(),
    note,
  });

  if (action === "APPROVED") {
    const next = NEXT_STAGE[roleKey] ?? "COMPLETED";
    leave.approverStage = next;
    if (next === "COMPLETED") {
      leave.status = "APPROVED";
    }
  } else {
    leave.status = "REJECTED";
    leave.approverStage = "COMPLETED";
  }

  await leave.save();
  return NextResponse.json({ success: true, leave });
}
