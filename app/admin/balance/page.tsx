import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminBalanceManagement } from "./components/AdminBalanceManagement";

async function AdminBalanceContent() {
  const user = await getCurrentUser();
  if (
    !user ||
    !["HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN"].includes(user.role as string)
  ) {
    redirect("/dashboard");
  }

  return (
    <div className="w-full">
      <AdminBalanceManagement userRole={user.role} />
    </div>
  );
}

export default function AdminBalancePage() {
  return (
    <Suspense fallback={<AdminBalanceSkeleton />}>
      <AdminBalanceContent />
    </Suspense>
  );
}

function AdminBalanceSkeleton() {
  return (
    <div className="w-full">
      <div className="space-y-4">
        <div className="h-10 w-64 bg-muted rounded animate-pulse" />
        <div className="flex gap-4">
          <div className="h-10 w-48 bg-muted rounded animate-pulse" />
          <div className="h-10 w-48 bg-muted rounded animate-pulse" />
          <div className="h-10 w-48 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-96 w-full bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}
