/**
 * API Route: GET /api/leaves
 * 
 * Returns all leave requests for the authenticated user.
 * 
 * Query Parameters:
 * - mine=1: Filter to only current user's leaves
 * 
 * Response:
 * {
 *   items: LeaveRequest[]
 * }
 * 
 * Each LeaveRequest includes:
 * - id: number
 * - type: string (EARNED, CASUAL, MEDICAL, etc.)
 * - startDate: string (ISO date)
 * - endDate: string (ISO date)
 * - workingDays: number
 * - status: string (SUBMITTED, PENDING, APPROVED, REJECTED, CANCELLED, etc.)
 * - approvals: Approval[] (with approver info)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";

export const cache = "no-store";

export async function GET(req: Request) {
  const me = await getCurrentUser();
  const traceId = getTraceId(req as any);
  if (!me) return NextResponse.json(error("unauthorized", undefined, traceId), { status: 401 });

  const items = await prisma.leaveRequest.findMany({
    where: { requesterId: me.id },
    orderBy: { createdAt: "desc" },
    include: {
      approvals: {
        include: {
          approver: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          step: "asc",
        },
      },
    },
  });

  return NextResponse.json({ items });
}

