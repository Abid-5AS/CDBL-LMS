import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeaveStatus, Prisma } from "@prisma/client";

export const cache = "no-store";

type LeaveWithApprovals = Prisma.LeaveRequestGetPayload<{
  include: {
    requester: { select: { name: true; email: true } };
    approvals: { include: { approver: { select: { name: true } } } };
  };
}>;

type SerializedApproval = {
  role: string;
  status: string;
  decision?: string; // Include decision field for filtering (FORWARDED, APPROVED, etc.)
  toRole?: string | null; // Include toRole for forwarded requests
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
  startDate?: string;
  endDate?: string;
  workingDays?: number;
  requestedDays: number;
  reason: string;
  status: string;
  isModified?: boolean;
  approvals: SerializedApproval[];
  currentStageIndex: number;
  requestedById: string | null;
  requestedByName: string | null;
  requestedByEmail: string | null;
  requester?: {
    id: number;
    name: string;
    email: string;
  };
  updatedAt: string | null;
  createdAt: string | null;
};

async function requireApprover(): Promise<Response | NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>> {
  const me = await getCurrentUser();
  if (!me || !["HR_ADMIN", "DEPT_HEAD", "HR_HEAD", "CEO"].includes(me.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return me;
}

function normalizeApprovals(leave: LeaveWithApprovals): SerializedApproval[] {
  if (Array.isArray(leave.approvals) && leave.approvals.length > 0) {
    return leave.approvals.map((record) => ({
      role: "HR_ADMIN",
      status: record.decision,
      decision: record.decision, // Include decision field for filtering
      toRole: record.toRole, // Include toRole for forwarded requests
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
    startDate: leave.startDate ? leave.startDate.toISOString() : undefined,
    endDate: leave.endDate ? leave.endDate.toISOString() : undefined,
    workingDays: leave.workingDays,
    requestedDays: leave.workingDays,
    reason: leave.reason,
    status: leave.status,
    isModified: (leave as any).isModified ?? false,
    approvals: normalizeApprovals(leave),
    currentStageIndex: 0,
    requestedById: leave.requesterId ? String(leave.requesterId) : null,
    requestedByName: leave.requester?.name ?? null,
    requestedByEmail: leave.requester?.email ?? null,
    requester: leave.requesterId && leave.requester
      ? {
          id: leave.requesterId,
          name: leave.requester.name,
          email: leave.requester.email,
        }
      : undefined,
    updatedAt: leave.updatedAt ? leave.updatedAt.toISOString() : null,
    createdAt: leave.createdAt ? leave.createdAt.toISOString() : null,
  };
}

export async function GET() {
  const me = await requireApprover();
  if (me instanceof Response) return me;

  // Build where clause based on role
  let whereClause: any = {
    status: {
      in: [LeaveStatus.SUBMITTED, LeaveStatus.PENDING],
    },
  };

  // For DEPT_HEAD: only show requests from team members (deptHeadId matches)
  // Must match the exact logic used in dashboard summary count
  if (me.role === "DEPT_HEAD") {
    whereClause.requester = {
      deptHeadId: me.id,
    };
    // Ensure there's an approval forwarded TO DEPT_HEAD
    // AND this DEPT_HEAD hasn't acted on it yet
    whereClause.AND = [
      {
        approvals: {
          some: {
            decision: "FORWARDED",
            toRole: "DEPT_HEAD",
          },
        },
      },
      {
        approvals: {
          none: {
            approverId: me.id,
            decision: {
              in: ["FORWARDED", "APPROVED", "REJECTED"],
            },
          },
        },
      },
    ];
  } else if (me.role === "HR_HEAD") {
    // For HR_HEAD: show requests that have been forwarded from DEPT_HEAD
    whereClause.approvals = {
      some: {
        decision: "FORWARDED",
        toRole: "HR_HEAD",
      },
    };
  } else if (me.role === "CEO") {
    // For CEO: show requests that have been forwarded from HR_HEAD
    whereClause.approvals = {
      some: {
        decision: "FORWARDED",
        toRole: "CEO",
      },
    };
  } else if (me.role === "HR_ADMIN") {
    // For HR_ADMIN: show only requests that HR_ADMIN hasn't acted on yet
    // (i.e., no approval record by HR_ADMIN with FORWARDED/APPROVED/REJECTED)
    whereClause.approvals = {
      none: {
        approverId: me.id,
        decision: {
          in: ["FORWARDED", "APPROVED", "REJECTED"],
        },
      },
    };
  }
  // HR_ADMIN sees all SUBMITTED/PENDING requests that they haven't acted on

  // Get pending requests (no duplicates since we're querying LeaveRequest directly)
  const items = await prisma.leaveRequest.findMany({
    where: whereClause,
    include: {
      requester: { select: { id: true, name: true, email: true, deptHeadId: true } },
      approvals: {
        include: {
          approver: { select: { name: true, role: true } },
        },
        orderBy: { step: "asc" },
      },
    },
    orderBy: { startDate: "asc" }, // Sort by start date for better UX
  });

  return NextResponse.json({ items: items.map(serializeLeave) });
}
