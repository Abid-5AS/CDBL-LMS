import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canViewAllRequests, canCreateEmployee, type AppRole } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
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
      <section className="rounded-xl border border-slate-200/50 dark:border-slate-800/50 glass-base p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Employee Directory</h1>
            <p className="mt-1 text-sm text-muted-foreground dark:text-slate-300">
              Browse and search employee profiles, view leave histories, and manage employee information
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
      <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
      <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
    </div>
  );
}
