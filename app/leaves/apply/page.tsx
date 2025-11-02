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
    <div className="max-w-7xl mx-auto px-8 lg:px-12 py-6">
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="h-36 backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/30 dark:border-white/10 rounded-xl shadow-sm" />
          <div className="h-96 backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/30 dark:border-white/10 rounded-xl shadow-sm" />
        </div>
        <div className="space-y-4">
          <div className="h-64 backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/30 dark:border-white/10 rounded-xl shadow-sm" />
          <div className="h-48 backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/30 dark:border-white/10 rounded-xl shadow-sm" />
        </div>
      </div>
    </div>
  );
}
