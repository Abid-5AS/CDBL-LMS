import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeaveStatus, LeaveType, ApprovalDecision } from "@prisma/client";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";

export const cache = "no-store";

function buildWhere(
  user: { id: number; department?: string | null },
  q: string,
  status: string,
  type: string,
  teamMemberIds: number[]
) {
  const base: any = {
    requesterId: { in: teamMemberIds },
  };

  // Type filter
  if (type && type !== "ALL") {
    base.type = type as LeaveType;
  }

  // Search filter
  if (q) {
    base.OR = [
      { requester: { name: { contains: q, mode: "insensitive" } } },
      { requester: { email: { contains: q, mode: "insensitive" } } },
      { reason: { contains: q, mode: "insensitive" } },
    ];
  }

  // Status scope for Dept Head - must match dashboard logic exactly
  if (status === "PENDING") {
    base.status = { in: [LeaveStatus.PENDING, LeaveStatus.SUBMITTED] };
    base.AND = [
      {
        approvals: {
          some: {
            decision: ApprovalDecision.FORWARDED,
            toRole: "DEPT_HEAD",
          },
        },
      },
      {
        approvals: {
          none: {
            approverId: user.id,
            decision: {
              in: [ApprovalDecision.FORWARDED, ApprovalDecision.APPROVED, ApprovalDecision.REJECTED],
            },
          },
        },
      },
    ];
  } else if (status === "FORWARDED") {
    base.status = LeaveStatus.PENDING;
    base.approvals = {
      some: {
        decision: ApprovalDecision.FORWARDED,
        approverId: user.id,
        toRole: { not: null },
      },
    };
  } else if (status === "RETURNED") {
    base.status = LeaveStatus.RETURNED;
    base.approvals = {
      some: {
        approverId: user.id,
        decision: ApprovalDecision.FORWARDED, // Returned requests use FORWARDED decision with toRole: null
        toRole: null,
      },
    };
  } else if (status === "CANCELLED") {
    base.status = LeaveStatus.CANCELLED;
  } else if (status === "ALL") {
    base.status = {
      in: [
        LeaveStatus.PENDING,
        LeaveStatus.SUBMITTED,
        LeaveStatus.RETURNED,
        LeaveStatus.CANCELLED,
      ],
    };
  }

  return base;
}

export async function GET(req: NextRequest) {
  const traceId = getTraceId(req as any);
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(error("unauthorized", undefined, traceId), {
        status: 401,
      });
    }

    if (user.role !== "DEPT_HEAD") {
      return NextResponse.json(
        error("forbidden", "Only Department Heads can access this endpoint", traceId),
        { status: 403 }
      );
    }

    // Get team members
    const teamMembers = await prisma.user.findMany({
      where: {
        deptHeadId: user.id,
      },
      select: { id: true },
    });
    const teamMemberIds = teamMembers.map((m) => m.id);

    // If no team members, return empty results
    if (teamMemberIds.length === 0) {
      return NextResponse.json({
        rows: [],
        total: 0,
        counts: {
          pending: 0,
          forwarded: 0,
          returned: 0,
          cancelled: 0,
        },
      });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";
    const status = searchParams.get("status") ?? "PENDING";
    const type = searchParams.get("type") ?? "ALL";
    const page = Number(searchParams.get("page") ?? 1);
    const pageSize = Number(searchParams.get("size") ?? 10);

    const where = buildWhere(user, q, status, type, teamMemberIds);

    // Fetch all rows matching the filter (for deduplication)
    const rowsRaw = await prisma.leaveRequest.findMany({
      where,
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            deptHeadId: true,
          },
        },
        approvals: {
          include: {
            approver: {
              select: { name: true, role: true },
            },
          },
          orderBy: { step: "asc" },
        },
      },
      orderBy: [{ startDate: "asc" }, { id: "asc" }],
    });

    // Dedupe guard (same requester + dates) - BEFORE pagination
    const key = (r: any) =>
      `${r.requesterId}-${r.startDate.toISOString()}-${r.endDate.toISOString()}`;
    const seen = new Set<string>();
    const uniqueRows = rowsRaw.filter((r) =>
      seen.has(key(r)) ? false : seen.add(key(r))
    );

    // Calculate total after deduplication
    const total = uniqueRows.length;

    // Apply pagination AFTER deduplication
    const rows = uniqueRows.slice(
      (page - 1) * pageSize,
      page * pageSize
    );

    // Counts under SAME scope as Dept Head dashboard
    const baseDept = { requesterId: { in: teamMemberIds } };
    const [pending, forwarded, returned, cancelled] = await Promise.all([
      prisma.leaveRequest.count({
        where: {
          ...baseDept,
          status: { in: [LeaveStatus.PENDING, LeaveStatus.SUBMITTED] },
          AND: [
            {
              approvals: {
                some: {
                  decision: ApprovalDecision.FORWARDED,
                  toRole: "DEPT_HEAD",
                },
              },
            },
            {
              approvals: {
                none: {
                  approverId: user.id,
                  decision: {
                    in: [ApprovalDecision.FORWARDED, ApprovalDecision.APPROVED, ApprovalDecision.REJECTED],
                  },
                },
              },
            },
          ],
        },
      }),
      prisma.leaveRequest.count({
        where: {
          ...baseDept,
          status: LeaveStatus.PENDING,
          approvals: {
            some: {
              decision: ApprovalDecision.FORWARDED,
              approverId: user.id,
              toRole: { not: null },
            },
          },
        },
      }),
      prisma.leaveRequest.count({
        where: {
          ...baseDept,
          status: LeaveStatus.RETURNED,
          approvals: {
            some: {
              approverId: user.id,
              decision: ApprovalDecision.FORWARDED, // Returned requests use FORWARDED decision with toRole: null
              toRole: null,
            },
          },
        },
      }),
      prisma.leaveRequest.count({
        where: {
          ...baseDept,
          status: LeaveStatus.CANCELLED,
        },
      }),
    ]);

    // Serialize rows for client
    const serializedRows = rows.map((r) => ({
      id: r.id,
      type: r.type,
      startDate: r.startDate.toISOString(),
      endDate: r.endDate.toISOString(),
      workingDays: r.workingDays,
      reason: r.reason,
      status: r.status,
      isModified: (r as any).isModified ?? false,
      requester: r.requester,
      approvals: r.approvals.map((a) => ({
        id: a.id,
        decision: a.decision,
        toRole: a.toRole,
        approverId: a.approverId,
        approver: a.approver,
        decidedAt: a.decidedAt?.toISOString() || null,
        comment: a.comment,
      })),
    }));

    return NextResponse.json({
      rows: serializedRows,
      total,
      counts: {
        pending,
        forwarded,
        returned,
        cancelled,
      },
    });
  } catch (err: any) {
    console.error("Error in /api/manager/pending:", err);
    return NextResponse.json(
      error("server_error", err?.message || "Failed to fetch pending requests", traceId),
      { status: 500 }
    );
  }
}

