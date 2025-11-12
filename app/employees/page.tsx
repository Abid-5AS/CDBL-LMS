import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  canViewAllRequests,
  canCreateEmployee,
  type AppRole,
} from "@/lib/rbac";
import { Button } from "@/components/ui";
import { Plus } from "lucide-react";
import Link from "next/link";
import { EmployeeList } from "./components/EmployeeList";

async function EmployeesPageContent() {
  const user = await getCurrentUser();

  if (!user || !canViewAllRequests(user.role as AppRole)) {
    redirect("/dashboard");
  }

  const canCreate = canCreateEmployee(user.role as AppRole);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border backdrop-blur-xl bg-card/90 p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              Employee Directory
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse and search employee profiles, view leave histories, and
              manage employee information
            </p>
          </div>
          {canCreate && (
            <Button asChild>
              <Link href="/admin">
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Link>
            </Button>
          )}
        </div>
      </section>
      <Suspense fallback={<EmployeeListFallback />}>
        <EmployeeList />
      </Suspense>
    </div>
  );
}

export default function EmployeesPage() {
  return (
    <Suspense fallback={<EmployeeListFallback />}>
      <EmployeesPageContent />
    </Suspense>
  );
}

function EmployeeListFallback() {
  return (
    <div className="space-y-4">
      <div className="h-12 bg-bg-secondary dark:bg-bg-secondary rounded animate-pulse" />
      <div className="h-64 bg-bg-secondary dark:bg-bg-secondary rounded-xl animate-pulse" />
    </div>
  );
}
