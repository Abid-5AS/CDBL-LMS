import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserRole } from "@/lib/session";
import { ApplyLeaveForm } from "./_components/apply-leave-form";

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
      <ApplyLeavePageWrapper />
    </Suspense>
  );
}

function ApplyLeaveFallback() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <div className="h-8 bg-muted/40 rounded-lg w-48" />
        <div className="h-4 bg-muted/40 rounded-lg w-64" />
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-6">
            <div className="h-96 bg-white/60 dark:bg-neutral-900/40 border border-neutral-200/70 dark:border-neutral-800/70 rounded-xl backdrop-blur-sm" />
          </div>
          <div className="lg:col-span-4 space-y-4">
            <div className="h-64 bg-white/60 dark:bg-neutral-900/40 border border-neutral-200/70 dark:border-neutral-800/70 rounded-xl backdrop-blur-sm" />
            <div className="h-48 bg-white/60 dark:bg-neutral-900/40 border border-neutral-200/70 dark:border-neutral-800/70 rounded-xl backdrop-blur-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
