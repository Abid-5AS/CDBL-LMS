import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserRole } from "@/lib/session";
import { MyLeavesPageContent } from "./MyLeavesPageContent";

async function MyLeavesPageWrapper() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const role = await getUserRole();
  const userData = { name: user.name, email: user.email };

  // Allow all roles to view their leave history EXCEPT CEO and SYSTEM_ADMIN
  const restrictedRoles = ["CEO", "SYSTEM_ADMIN"];
  if (restrictedRoles.includes(role || "")) {
    redirect("/dashboard");
  }

  return (
    <Suspense fallback={<MyLeavesFallback />}>
      <MyLeavesPageContent />
    </Suspense>
  );
}

export default function MyLeavesPage() {
  return (
    <Suspense fallback={<MyLeavesFallback />}>
      <MyLeavesPageWrapper />
    </Suspense>
  );
}

function MyLeavesFallback() {
  return (
    <div className="space-y-6">
      <div className="h-32 rounded-2xl border border-border bg-card/90 p-6 shadow-sm" />
      <div className="h-96 rounded-2xl border border-border bg-card/90 p-6 shadow-sm" />
    </div>
  );
}
