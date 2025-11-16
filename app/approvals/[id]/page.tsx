import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApprovalDetailsContent } from "./_components/approval-details-content";

async function ApprovalDetailsPageWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const leaveId = Number(id);

  if (Number.isNaN(leaveId)) {
    redirect("/approvals");
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Check if user is an approver
  const userRole = user.role as string;
  const isApprover = ["HR_ADMIN", "HR_HEAD", "DEPT_HEAD", "CEO"].includes(
    userRole
  );

  if (!isApprover) {
    // Redirect employees to the regular leave details page
    redirect(`/leaves/${leaveId}`);
  }

  // Get the leave request with comprehensive data
  const leave = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
    include: {
      requester: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
        },
      },
      comments: {
        orderBy: { createdAt: "desc" },
      },
      approvals: {
        orderBy: { step: "asc" },
        include: {
          approver: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      },
    },
  });

  if (!leave) {
    redirect("/approvals");
  }

  // Get employee's leave balances for current year
  const currentYear = new Date().getFullYear();
  const balances = await prisma.balance.findMany({
    where: {
      userId: leave.requesterId,
      year: currentYear,
    },
  });

  // Get employee's recent leave history (last 10 requests)
  const leaveHistory = await prisma.leaveRequest.findMany({
    where: {
      requesterId: leave.requesterId,
      id: { not: leaveId }, // Exclude current request
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      type: true,
      startDate: true,
      endDate: true,
      workingDays: true,
      status: true,
      createdAt: true,
    },
  });

  // Get overlapping leave requests from other employees (team impact)
  const overlappingLeaves = await prisma.leaveRequest.findMany({
    where: {
      requesterId: { not: leave.requesterId },
      status: { in: ["APPROVED", "PENDING", "SUBMITTED"] },
      OR: [
        {
          startDate: { lte: leave.endDate },
          endDate: { gte: leave.startDate },
        },
      ],
    },
    include: {
      requester: {
        select: {
          name: true,
          email: true,
          department: true,
        },
      },
    },
    take: 10,
  });

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

  // Check if current user has a pending approval
  const userPendingApproval = leave.approvals.find(
    (a) => a.approverId === user.id && a.decision === "PENDING"
  );

  return (
    <Suspense fallback={<ApprovalDetailsFallback />}>
      <ApprovalDetailsContent
        leave={leave}
        balances={balances}
        leaveHistory={leaveHistory}
        overlappingLeaves={overlappingLeaves}
        comments={comments}
        currentUserId={user.id}
        currentUserRole={userRole}
        canTakeAction={!!userPendingApproval}
      />
    </Suspense>
  );
}

export default function ApprovalDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<ApprovalDetailsFallback />}>
      <ApprovalDetailsPageWrapper params={params} />
    </Suspense>
  );
}

function ApprovalDetailsFallback() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-6">
        <div className="h-12 bg-muted animate-pulse rounded-lg" />
        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <div className="space-y-6">
            <div className="h-64 bg-muted animate-pulse rounded-xl" />
            <div className="h-96 bg-muted animate-pulse rounded-xl" />
          </div>
          <div className="space-y-6">
            <div className="h-96 bg-muted animate-pulse rounded-xl" />
            <div className="h-64 bg-muted animate-pulse rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
