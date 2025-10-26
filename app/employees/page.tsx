import AppShell from "@/components/app-shell";

export default function EmployeesPlaceholder() {
  return (
    <AppShell title="Employees" pathname="/employees">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-sm text-slate-600">
        Employee directory coming soon.
      </div>
    </AppShell>
  );
}
