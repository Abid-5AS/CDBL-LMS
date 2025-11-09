import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeaveStatus } from "@prisma/client";

export const cache = "no-store";

export async function GET() {
  const me = await getCurrentUser();
  
  if (!me) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Get ALL leave requests with their approvals
  const allLeaves = await prisma.leaveRequest.findMany({
    include: {
      requester: { select: { id: true, name: true, email: true, role: true } },
      approvals: {
        include: {
          approver: { select: { id: true, name: true, role: true } },
        },
        orderBy: { step: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20, // Last 20 requests
  });

  // Get the whereClause that would be used for HR_ADMIN
  const hrAdminWhereClause = {
    status: {
      in: [LeaveStatus.SUBMITTED, LeaveStatus.PENDING],
    },
    approvals: {
      none: {
        approverId: me.id,
        decision: {
          in: ["FORWARDED", "APPROVED", "REJECTED"],
        },
      },
    },
  };

  const hrAdminFilteredLeaves = await prisma.leaveRequest.findMany({
    where: hrAdminWhereClause,
    include: {
      requester: { select: { id: true, name: true, email: true, role: true } },
      approvals: {
        include: {
          approver: { select: { id: true, name: true, role: true } },
        },
        orderBy: { step: "asc" },
      },
    },
  });

  return NextResponse.json({
    currentUser: {
      id: me.id,
      name: me.name,
      email: me.email,
      role: me.role,
    },
    allLeaves: allLeaves.map(leave => ({
      id: leave.id,
      type: leave.type,
      status: leave.status,
      requester: leave.requester,
      approvals: leave.approvals.map(app => ({
        step: app.step,
        decision: app.decision,
        toRole: app.toRole,
        approverId: app.approverId,
        approver: app.approver,
        decidedAt: app.decidedAt,
      })),
      createdAt: leave.createdAt,
    })),
    hrAdminFilteredLeaves: hrAdminFilteredLeaves.map(leave => ({
      id: leave.id,
      type: leave.type,
      status: leave.status,
      requester: leave.requester,
      approvals: leave.approvals.map(app => ({
        step: app.step,
        decision: app.decision,
        toRole: app.toRole,
        approverId: app.approverId,
        approver: app.approver,
      })),
    })),
    whereClauseUsed: hrAdminWhereClause,
  });
}
