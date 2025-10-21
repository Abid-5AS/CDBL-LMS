import { NextResponse } from "next/server";
import { z } from "zod";
import { countRequestedDays } from "@/lib/leave-days";
import { dbConnect } from "@/lib/db";
import { Leave } from "@/models/leave";
import { getCurrentUser } from "@/lib/auth";
import { canApprove } from "@/lib/rbac";

export const runtime = "nodejs";

const LeaveRequestSchema = z.object({
  type: z.enum(["EL", "CL", "ML", "EWP", "EWO", "MAT", "PAT"]),
  start: z.string().datetime({ offset: true }),
  end: z.string().datetime({ offset: true }),
  reason: z.string().min(3).max(500),
  certificate: z.boolean().optional().default(false),
});

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

async function hasOverlap(userId: string, start: Date, end: Date) {
  const overlap = await Leave.findOne({
    requestedById: userId,
    start: { $lte: end },
    end: { $gte: start },
  })
    .select({ _id: 1 })
    .lean();
  return Boolean(overlap);
}

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const data = LeaveRequestSchema.parse(raw);

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const start = new Date(data.start);
    const end = new Date(data.end);
    if (start > end) {
      return NextResponse.json({ error: "End date cannot be before start date." }, { status: 400 });
    }

    await dbConnect();

    const days = countRequestedDays(start, end);

    if (data.type === "CL" && days > 3) {
      return NextResponse.json({ error: "Casual Leave limited to 3 consecutive days by policy." }, { status: 400 });
    }
    if (data.type === "ML" && days > 3 && !data.certificate) {
      return NextResponse.json(
        { error: "Medical Leave over 3 days requires a medical certificate per policy." },
        { status: 400 },
      );
    }

    const overlap = await hasOverlap(user.id, start, end);
    if (overlap) {
      return NextResponse.json({ error: "Overlapping leave exists for the selected dates." }, { status: 400 });
    }

    const workflowRoles: string[] =
      typeof (Leave as any).workflowRoles === "function" ? (Leave as any).workflowRoles() : [];
    const approvals = workflowRoles.map((role: string) => ({
      role,
      status: "PENDING" as const,
    }));

    const doc = await Leave.create({
      type: data.type,
      start,
      end,
      requestedDays: days,
      reason: data.reason,
      certificate: data.certificate ?? false,
      status: "PENDING",
      requestedByName: user.name,
      requestedById: user.id,
      requestedByEmail: user.email,
      approvals,
      currentStageIndex: 0,
      approverStage: "DEPT_HEAD",
    });

    const serializedApprovals = Array.isArray(doc.approvals)
      ? doc.approvals.map((step: any) => serializeApproval(step)).filter(Boolean)
      : [];

    return NextResponse.json(
      {
        id: String(doc._id),
        type: doc.type,
        start: doc.start.toISOString(),
        end: doc.end.toISOString(),
        requestedDays: doc.requestedDays,
        reason: doc.reason,
        status: doc.status,
        approvals: serializedApprovals,
        currentStageIndex: doc.currentStageIndex,
        approverStage: doc.approverStage ?? null,
        updatedAt: doc.updatedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err?.issues) {
      return NextResponse.json({ error: err.issues?.[0]?.message ?? "Invalid request." }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}

export async function GET(req: Request) {
  await dbConnect();
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ leaves: [] }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const stageParamRaw = searchParams.get("stage");

  const query: Record<string, any> = {};
  if (stageParamRaw) {
    query.approverStage = stageParamRaw.replace(/-/g, "_").toUpperCase();
  } else {
    query.requestedById = user.id;
  }

  const leaves = await Leave.find(query).sort({ createdAt: -1 }).lean();

  const mapped = leaves.map((r: any) => {
    const approvals = Array.isArray(r.approvals)
      ? r.approvals.map((step: any) => serializeApproval(step)).filter(Boolean)
      : [];

    const timeline = Array.isArray(r.timeline)
      ? r.timeline.map((entry: any) => ({
          by: entry?.by ? String(entry.by) : null,
          role: entry?.role ?? null,
          action: entry?.action ?? null,
          at: entry?.at ? new Date(entry.at).toISOString() : null,
          note: entry?.note ?? null,
        }))
      : [];

    return {
      id: String(r._id),
      type: r.type,
      start: r.start ? new Date(r.start).toISOString() : null,
      end: r.end ? new Date(r.end).toISOString() : null,
      requestedDays: r.requestedDays,
      reason: r.reason,
      status: r.status,
      requestedByName: r.requestedByName ?? null,
      requestedByEmail: r.requestedByEmail ?? null,
      approvals,
      currentStageIndex: r.currentStageIndex ?? 0,
      approverStage: r.approverStage ?? null,
      timeline,
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : null,
    };
  });

  return NextResponse.json({ leaves: mapped }, { status: 200 });
}
