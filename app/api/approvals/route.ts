export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { Leave } from "@/models/leave";
import { canApprove, Role } from "@/lib/rbac";

function serializeApproval(step: any) {
  if (!step) return null;
  return {
    role: step.role,
    status: step.status,
    decidedById: step.decidedById ?? null,
    decidedByName: step.decidedByName ?? null,
    decidedAt: step.decidedAt ? new Date(step.decidedAt).toISOString() : null,
    comment: step.comment ?? null,
  };
}

function serializeLeave(doc: any) {
  const approvals = Array.isArray(doc.approvals)
    ? doc.approvals.map((step: any) => serializeApproval(step)).filter(Boolean)
    : [];

  return {
    id: String(doc._id),
    type: doc.type,
    start: doc.start ? new Date(doc.start).toISOString() : null,
    end: doc.end ? new Date(doc.end).toISOString() : null,
    requestedDays: doc.requestedDays,
    reason: doc.reason,
    status: doc.status,
    approvals,
    currentStageIndex: doc.currentStageIndex ?? 0,
    requestedById: doc.requestedById ? String(doc.requestedById) : null,
    requestedByName: doc.requestedByName ?? null,
    requestedByEmail: doc.requestedByEmail ?? null,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
  };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canApprove(user.role as Role)) return NextResponse.json({ items: [] });

  await dbConnect();

  const items = await Leave.find({ status: "PENDING" }).lean();

  const filtered = items.filter((leave: any) => {
    const stageIndex = typeof leave.currentStageIndex === "number" ? leave.currentStageIndex : 0;
    const step = Array.isArray(leave.approvals) ? leave.approvals[stageIndex] : null;
    return step && step.role === user.role && step.status === "PENDING";
  });

  return NextResponse.json({ items: filtered.map(serializeLeave) });
}
