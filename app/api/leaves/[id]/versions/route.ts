import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";

export const cache = "no-store";

/**
 * Get version history for a leave request
 * Only accessible to supervisors (DEPT_HEAD, HR_ADMIN, HR_HEAD, CEO)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const traceId = getTraceId(request as any);
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(error("unauthorized", undefined, traceId), { status: 401 });
  }

  // Only supervisors can view version history
  if (!["DEPT_HEAD", "HR_ADMIN", "HR_HEAD", "CEO"].includes(user.role)) {
    return NextResponse.json(
      error("forbidden", "Only supervisors can view version history", traceId),
      { status: 403 }
    );
  }

  const { id } = await params;
  const leaveId = Number(id);
  if (Number.isNaN(leaveId)) {
    return NextResponse.json(error("invalid_id", undefined, traceId), { status: 400 });
  }

  // Verify leave exists and user has access
  const leave = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
    include: {
      requester: {
        select: {
          id: true,
          deptHeadId: true,
          department: true,
        },
      },
    },
  });

  if (!leave) {
    return NextResponse.json(error("not_found", undefined, traceId), { status: 404 });
  }

  // For DEPT_HEAD: verify this is from their team
  if (user.role === "DEPT_HEAD" && leave.requester.deptHeadId !== user.id) {
    return NextResponse.json(
      error("forbidden", "You can only view versions for your team members", traceId),
      { status: 403 }
    );
  }

  // Get all versions, ordered by version number (oldest first)
  const versions = await prisma.leaveVersion.findMany({
    where: { leaveId },
    orderBy: { version: "asc" },
  });

  return NextResponse.json({
    ok: true,
    versions: versions.map((v) => ({
      id: v.id,
      version: v.version,
      data: v.data,
      createdAt: v.createdAt.toISOString(),
      createdByRole: v.createdByRole,
    })),
  });
}

