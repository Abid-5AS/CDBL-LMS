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
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <div className="h-36 rounded-xl border border-slate-200 bg-white shadow-sm" />
        <div className="h-96 rounded-xl border border-slate-200 bg-white shadow-sm" />
      </div>
      <div className="space-y-4">
        <div className="h-64 rounded-xl border border-slate-200 bg-white shadow-sm" />
        <div className="h-48 rounded-xl border border-slate-200 bg-white shadow-sm" />
      </div>
    </div>
  );
}
