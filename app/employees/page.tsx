import AppShell from "@/components/app-shell";
import { Suspense } from "react";
import { EmployeeList } from "./components/EmployeeList";

export default function EmployeesPage() {
  return (
    <AppShell title="Employees" pathname="/employees">
      <div className="space-y-6">
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Employee Directory</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse and search employee profiles, view leave histories, and manage employee information
          </p>
        </section>
        <Suspense fallback={<EmployeeListFallback />}>
          <EmployeeList />
        </Suspense>
      </div>
    </AppShell>
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
