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

  // Both Employee and HR Admin use unified layout
  if (role !== "EMPLOYEE" && role !== "HR_ADMIN") {
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
      <div className="h-32 rounded-2xl border border-gray-200 bg-white p-6" />
      <div className="h-64 rounded-2xl border border-gray-200 bg-white p-6" />
      <div className="h-64 rounded-2xl border border-gray-200 bg-white p-6" />
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
