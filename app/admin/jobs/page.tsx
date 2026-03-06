import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { JobsMaintenancePanel } from "./components/JobsMaintenancePanel";
import { Skeleton } from "@/components/ui/skeleton";

const ALLOWED_ROLES = ["HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN"];

export default function AdminJobsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <AdminJobsGate />
      </Suspense>
    </div>
  );
}

async function AdminJobsGate() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (!ALLOWED_ROLES.includes(user.role as string)) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Jobs &amp; Maintenance</h1>
        <p className="text-muted-foreground">
          Run balance maintenance jobs manually (EL accrual, lapse, rollover, init)
        </p>
      </div>
      <JobsMaintenancePanel />
    </div>
  );
}
