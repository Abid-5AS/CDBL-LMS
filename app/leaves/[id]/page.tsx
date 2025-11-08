import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeaveDetailsContent } from "./_components/leave-details-content";
import { LeaveStatus } from "@prisma/client";

async function LeaveDetailsPageWrapper({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const leaveId = Number(id);
  
  if (Number.isNaN(leaveId)) {
    redirect("/dashboard");
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Get the leave request with comments
  const leave = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
    include: {
      requester: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      comments: {
        orderBy: { createdAt: "desc" },
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
      },
      approvals: {
        orderBy: { step: "asc" },
        include: {
          approver: {
            select: {
              name: true,
              role: true,
            },
          },
        },
      },
    },
  });

  if (!leave) {
    redirect("/dashboard");
  }

  // Check access: requester or approver
  const userRole = user.role as string;
  const hasAccess =
    leave.requesterId === user.id ||
    ["HR_ADMIN", "HR_HEAD", "DEPT_HEAD", "CEO"].includes(userRole);

  if (!hasAccess) {
    redirect("/dashboard");
  }

  // Get author names for comments
  const authorIds = [...new Set(leave.comments.map((c) => c.authorId))];
  const authors = await prisma.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, name: true, role: true },
  });
  const authorMap = new Map(authors.map((a) => [a.id, a]));

  const comments = leave.comments.map((comment) => ({
    id: comment.id,
    comment: comment.comment,
    authorRole: comment.authorRole,
    authorName: authorMap.get(comment.authorId)?.name || "Unknown",
    createdAt: comment.createdAt.toISOString(),
  }));

  return (
    <Suspense fallback={<LeaveDetailsFallback />}>
      <LeaveDetailsContent leave={leave} comments={comments} currentUserId={user.id} />
    </Suspense>
  );
}

export default function LeaveDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<LeaveDetailsFallback />}>
      <LeaveDetailsPageWrapper params={params} />
    </Suspense>
  );
}

function LeaveDetailsFallback() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-6">
        <div className="h-12 bg-muted animate-pulse rounded-lg" />
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
        <div className="h-96 bg-muted animate-pulse rounded-xl" />
      </div>
    </div>
  );
}





