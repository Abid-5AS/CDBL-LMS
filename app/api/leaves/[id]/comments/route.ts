import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";

export const cache = "no-store";

/**
 * Get all comments for a leave request
 * Accessible by the requester or any approver
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

  const { id } = await params;
  const leaveId = Number(id);
  if (Number.isNaN(leaveId)) {
    return NextResponse.json(error("invalid_id", undefined, traceId), { status: 400 });
  }

  // Verify user has access to this leave request
  const leave = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
    select: { requesterId: true },
  });

  if (!leave) {
    return NextResponse.json(error("not_found", undefined, traceId), { status: 404 });
  }

  // Check if user is the requester or has approval permissions
  const userRole = user.role as string;
  const hasAccess =
    leave.requesterId === user.id ||
    ["HR_ADMIN", "HR_HEAD", "DEPT_HEAD", "CEO"].includes(userRole);

  if (!hasAccess) {
    return NextResponse.json(error("forbidden", undefined, traceId), { status: 403 });
  }

  // Get all comments for this leave request
  const comments = await prisma.leaveComment.findMany({
    where: { leaveId },
    orderBy: { createdAt: "asc" },
    include: {
      leave: {
        select: {
          requester: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  // Get author names for comments
  const authorIds = [...new Set(comments.map((c) => c.authorId))];
  const authors = await prisma.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, name: true, role: true },
  });

  const authorMap = new Map(authors.map((a) => [a.id, a]));

  return NextResponse.json({
    items: comments.map((comment) => ({
      id: comment.id,
      comment: comment.comment,
      authorRole: comment.authorRole,
      authorName: authorMap.get(comment.authorId)?.name || "Unknown",
      createdAt: comment.createdAt.toISOString(),
    })),
  });
}

