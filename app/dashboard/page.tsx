import Link from "next/link";
import { Plus, FileText, Calendar } from "lucide-react";
import AppShell from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { canApprove, type AppRole } from "@/lib/rbac";
import { BalanceSummaryCards } from "./components/balance-summary-cards";
import PendingApprovalsCard from "./components/pending-approvals-card";
import { PendingApprovals } from "./components/pending-approvals";
import { RequestsTable } from "./components/requests-table";
import { ActivityPanel } from "./components/activity-panel";
import { PolicyReminders } from "./components/policy-reminders";
import { DashboardToday } from "./components/dashboard-today";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const username = user?.name ?? "User";
  const approver = user ? canApprove(user.role as AppRole) : false;
  const approverStage = user?.role ?? "";

  return (
    <AppShell title="Dashboard" pathname="/dashboard">
      <div className="space-y-8">
        <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back, {username}</p>
            <h2 className="text-2xl font-semibold text-slate-900">Your leave snapshot</h2>
            <DashboardToday />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
              <Link href="/leaves/apply">
                <Plus className="mr-2 h-4 w-4" />
                Apply Leave
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/policies">
                <FileText className="mr-2 h-4 w-4" />
                View Policies
              </Link>
            </Button>
            {approver ? (
              <Button asChild variant="ghost">
                <Link href="/approvals">Go to Approvals</Link>
              </Button>
            ) : null}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <BalanceSummaryCards />
          {approver ? (
            <PendingApprovalsCard />
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Upcoming Holiday</h3>
              <p className="mt-2 text-lg font-semibold text-slate-900">Victory Day</p>
              <p className="text-sm text-muted-foreground">16 December • Click to view all holidays</p>
              <Button asChild variant="link" className="px-0 text-blue-600">
                <Link href="/holidays">
                  <Calendar className="mr-1 h-4 w-4" />
                  See calendar
                </Link>
              </Button>
            </div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Recent Requests</h3>
              <Button asChild variant="ghost" className="text-blue-600">
                <Link href="/leaves">View all</Link>
              </Button>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <RequestsTable />
            </div>
          </div>
          <div className="space-y-4">
            {approver && user ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <PendingApprovals role={approverStage} />
              </div>
            ) : null}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <ActivityPanel />
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <PolicyReminders />
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
