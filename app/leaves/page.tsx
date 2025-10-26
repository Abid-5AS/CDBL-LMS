import AppShell from "@/components/app-shell";
import { RequestsTable } from "@/app/dashboard/components/requests-table";

export default function MyLeavesPage() {
  return (
    <AppShell title="My Requests" pathname="/leaves">
      <div className="space-y-4">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">My Leave Requests</h1>
          <p className="text-sm text-muted-foreground">
            Track the status of your submitted leave applications. Pending requests can be withdrawn before approval.
          </p>
        </section>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <RequestsTable />
        </div>
      </div>
    </AppShell>
  );
}
