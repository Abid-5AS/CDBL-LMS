import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserRole } from "@/lib/session";
import { PoliciesContent } from "./PoliciesContent";

async function PoliciesPageWrapper() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const role = await getUserRole();
  const userData = { name: user.name, email: user.email };

  // All authenticated users can view policies
  const allowedRoles = ["EMPLOYEE", "DEPT_HEAD", "HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN"];
  if (!allowedRoles.includes(role)) {
    redirect("/dashboard");
  }

  return (
    <Suspense fallback={<PoliciesFallback />}>
      <PoliciesContent />
    </Suspense>
  );
}

function PoliciesFallback() {
  return (
    <div className="space-y-6">
      <div className="h-32 rounded-2xl border border-border-strong bg-bg-primary p-6" />
      <div className="h-64 rounded-2xl border border-border-strong bg-bg-primary p-6" />
      <div className="h-64 rounded-2xl border border-border-strong bg-bg-primary p-6" />
    </div>
  );
}

export default function PoliciesPage() {
  return (
    <Suspense fallback={<PoliciesFallback />}>
      <PoliciesPageWrapper />
    </Suspense>
  );
}
