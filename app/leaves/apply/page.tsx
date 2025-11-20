import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserRole } from "@/lib/session";
import { ApplyLeaveForm } from "./_components/apply-leave-form";
import { LeaveSectionNav } from "@/components/layout/SectionNav";

async function ApplyLeavePageWrapper() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const role = await getUserRole();
  const userData = { name: user.name, email: user.email };

  if (role !== "EMPLOYEE") {
    redirect("/dashboard");
  }

  return (
    <Suspense fallback={<ApplyLeaveFallback />}>
      <ApplyLeaveForm />
    </Suspense>
  );
}

export default function ApplyLeavePage() {
  return (
    <Suspense fallback={<ApplyLeaveFallback />}>
      <div className="max-w-5xl mx-auto w-full space-y-6 px-4 sm:px-6 lg:px-0 py-8">
        <LeaveSectionNav />
        <ApplyLeavePageWrapper />
      </div>
    </Suspense>
  );
}

function ApplyLeaveFallback() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-0 py-8 space-y-6">
      <div className="h-10 rounded-xl bg-surface-2 border border-outline/60 dark:border-border" />
      <div className="space-y-6">
        <div className="h-8 bg-muted/40 rounded-lg w-48" />
        <div className="h-4 bg-muted/40 rounded-lg w-64" />
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-6">
            <div className="h-96 bg-card border border-border rounded-xl" />
          </div>
          <div className="lg:col-span-4 space-y-4">
            <div className="h-64 bg-card border border-border rounded-xl" />
            <div className="h-48 bg-card border border-border rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
