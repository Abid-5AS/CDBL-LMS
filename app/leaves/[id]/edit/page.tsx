import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditLeaveForm } from "./_components/edit-leave-form";

async function EditLeavePageWrapper({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const leaveId = Number(id);
  
  if (Number.isNaN(leaveId)) {
    redirect("/dashboard");
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Get the leave request
  const leave = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
    include: {
      comments: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!leave) {
    redirect("/dashboard");
  }

  // Verify this is the requester's own request and it's RETURNED
  if (leave.requesterId !== user.id) {
    redirect("/dashboard");
  }

  if (leave.status !== "RETURNED") {
    redirect(`/leaves/${leaveId}`);
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
    <Suspense fallback={<EditLeaveFallback />}>
      <EditLeaveForm leave={leave} comments={comments} />
    </Suspense>
  );
}

export default function EditLeavePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<EditLeaveFallback />}>
      <EditLeavePageWrapper params={params} />
    </Suspense>
  );
}

function EditLeaveFallback() {
  return (
    <div className="max-w-7xl mx-auto px-8 lg:px-12 py-6">
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="h-36 backdrop-blur-xl bg-bg-primary/70 dark:bg-bg-secondary/70 border border-bg-primary/30 dark:border-bg-primary/10 rounded-xl shadow-sm" />
          <div className="h-96 backdrop-blur-xl bg-bg-primary/70 dark:bg-bg-secondary/70 border border-bg-primary/30 dark:border-bg-primary/10 rounded-xl shadow-sm" />
        </div>
        <div className="space-y-4">
          <div className="h-64 backdrop-blur-xl bg-bg-primary/70 dark:bg-bg-secondary/70 border border-bg-primary/30 dark:border-bg-primary/10 rounded-xl shadow-sm" />
          <div className="h-48 backdrop-blur-xl bg-bg-primary/70 dark:bg-bg-secondary/70 border border-bg-primary/30 dark:border-bg-primary/10 rounded-xl shadow-sm" />
        </div>
      </div>
    </div>
  );
}





