import Link from "next/link";
import { Plus, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { canApprove, type AppRole } from "@/lib/rbac";
import { Suspense } from "react";
import { BalanceSummaryCards } from "./components/balance-summary-cards";
import PendingApprovalsCard from "./components/pending-approvals-card";
import { PendingApprovals } from "./components/pending-approvals";
import { RequestsTable } from "./components/requests-table";
import { ActivityPanel } from "./components/activity-panel";
import { PolicyReminders } from "./components/policy-reminders";
import { DashboardToday } from "./components/dashboard-today";
import { DashboardTodaySkeleton } from "./components/dashboard-today-skeleton";
import { BalanceSummaryCardsSkeleton } from "./components/balance-summary-cards-skeleton";
import { PendingApprovalsCardSkeleton } from "./components/pending-approvals-card-skeleton";
import { RequestsTableSkeleton } from "./components/requests-table-skeleton";
import { PendingApprovalsSkeleton } from "./components/pending-approvals-skeleton";
import { ActivityPanelSkeleton } from "./components/activity-panel-skeleton";
import { PolicyRemindersSkeleton } from "./components/policy-reminders-skeleton";

export default async function DashboardContent() {
  const user = await getCurrentUser();
  const username = user?.name ?? "User";
  const approver = user ? canApprove(user.role as AppRole) : false;
  const approverStage = user?.role ?? "";

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-3 rounded-xl border border-border dark:border-border/50 bg-card dark:bg-card/90 p-6 shadow-sm hover:shadow-md transition-all duration-100 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back, {username}</p>
          <h2 className="text-2xl font-semibold text-foreground">Your leave snapshot</h2>
          <Suspense fallback={<DashboardTodaySkeleton />}>
            <DashboardToday />
          </Suspense>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild className="bg-info hover:bg-info/90 dark:bg-info/80 dark:hover:bg-info text-info-foreground transition-colors duration-100">
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
        <Suspense fallback={<BalanceSummaryCardsSkeleton />}>
          <BalanceSummaryCards />
        </Suspense>
        {approver ? (
          <Suspense fallback={<PendingApprovalsCardSkeleton />}>
            <PendingApprovalsCard />
          </Suspense>
        ) : (
          <div className="rounded-xl border border-border dark:border-border/50 bg-card dark:bg-card/90 p-6 shadow-sm hover:shadow-md transition-all duration-100">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground dark:text-muted-foreground/80">Upcoming Holiday</h3>
            <p className="mt-2 text-lg font-semibold text-foreground dark:text-foreground/95">Victory Day</p>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground/80">16 December • Click to view all holidays</p>
            <Button asChild variant="link" className="px-0 text-info dark:text-info/90 hover:text-info/80 transition-colors">
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
            <h3 className="text-lg font-semibold text-foreground dark:text-foreground/95">Recent Requests</h3>
            <Button asChild variant="ghost" className="text-info dark:text-info/90 hover:text-info/80 transition-colors">
              <Link href="/leaves">View all</Link>
            </Button>
          </div>
          <div className="rounded-xl border border-border dark:border-border/50 bg-card dark:bg-card/90 p-4 shadow-sm hover:shadow-md transition-all duration-100">
            <Suspense fallback={<RequestsTableSkeleton />}>
              <RequestsTable />
            </Suspense>
          </div>
        </div>
        <div className="space-y-4">
          {approver && user ? (
            <div className="rounded-xl border border-border dark:border-border/50 bg-card dark:bg-card/90 p-4 shadow-sm hover:shadow-md transition-all duration-100">
              <Suspense fallback={<PendingApprovalsSkeleton />}>
                <PendingApprovals role={approverStage} />
              </Suspense>
            </div>
          ) : null}
          <div className="rounded-xl border border-border dark:border-border/50 bg-card dark:bg-card/90 p-4 shadow-sm hover:shadow-md transition-all duration-100">
            <Suspense fallback={<ActivityPanelSkeleton />}>
              <ActivityPanel />
            </Suspense>
          </div>
          <div className="rounded-xl border border-border dark:border-border/50 bg-card dark:bg-card/90 p-4 shadow-sm hover:shadow-md transition-all duration-100">
            <Suspense fallback={<PolicyRemindersSkeleton />}>
              <PolicyReminders />
            </Suspense>
          </div>
        </div>
      </section>
    </div>
  );
}
