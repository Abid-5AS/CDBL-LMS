import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeaveStatus, Prisma } from "@prisma/client";

type LeaveWithApprovals = Prisma.LeaveRequestGetPayload<{
  include: {
    requester: { select: { name: true; email: true } };
    approvals: { include: { approver: { select: { name: true } } } };
  };
}>;

type SerializedApproval = {
  role: string;
  status: string;
  decidedById: string | null;
  decidedByName: string | null;
  decidedAt: string | null;
  comment: string | null;
};

type SerializedLeave = {
  id: string;
  type: string;
  start: string | null;
  end: string | null;
  requestedDays: number;
  reason: string;
  status: string;
  approvals: SerializedApproval[];
  currentStageIndex: number;
  requestedById: string | null;
  requestedByName: string | null;
  requestedByEmail: string | null;
  updatedAt: string | null;
  createdAt: string | null;
};

async function requireHR(): Promise<Response | NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>> {
  const me = await getCurrentUser();
  if (!me || me.role !== "HR_ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return me;
}

function normalizeApprovals(leave: LeaveWithApprovals): SerializedApproval[] {
  if (Array.isArray(leave.approvals) && leave.approvals.length > 0) {
    return leave.approvals.map((record) => ({
      role: "HR_ADMIN",
      status: record.decision,
      decidedById: record.approverId ? String(record.approverId) : null,
      decidedByName: record.approver?.name ?? null,
      decidedAt: record.decidedAt ? new Date(record.decidedAt).toISOString() : null,
      comment: record.comment ?? null,
    }));
  }

  const pendingStatus =
    leave.status === LeaveStatus.SUBMITTED ? "PENDING" : leave.status;

  return [
    {
      role: "HR_ADMIN",
      status: pendingStatus,
      decidedById: null,
      decidedByName: null,
      decidedAt: null,
      comment: null,
    },
  ];
}

function serializeLeave(leave: LeaveWithApprovals): SerializedLeave {
  return {
    id: String(leave.id),
    type: leave.type,
    start: leave.startDate ? leave.startDate.toISOString() : null,
    end: leave.endDate ? leave.endDate.toISOString() : null,
    requestedDays: leave.workingDays,
    reason: leave.reason,
    status: leave.status,
    approvals: normalizeApprovals(leave),
    currentStageIndex: 0,
    requestedById: leave.requesterId ? String(leave.requesterId) : null,
    requestedByName: leave.requester?.name ?? null,
    requestedByEmail: leave.requester?.email ?? null,
    updatedAt: leave.updatedAt ? leave.updatedAt.toISOString() : null,
    createdAt: leave.createdAt ? leave.createdAt.toISOString() : null,
  };
}

export async function GET() {
  noStore();
  const me = await requireHR();
  if (me instanceof Response) return me;

  const items = await prisma.leaveRequest.findMany({
    where: {
      status: {
        in: [LeaveStatus.SUBMITTED, LeaveStatus.PENDING],
      },
    },
    include: {
      requester: { select: { name: true, email: true } },
      approvals: {
        include: {
          approver: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items: items.map(serializeLeave) });
}
