import Link from "next/link";
import { DashboardSidebar } from "./components/dashboard-sidebar";
import { DashboardHeader } from "./components/dashboard-header";
import { KPICard } from "./components/kpi-card";
import { RequestsTable } from "./components/requests-table";
import { ActivityPanel } from "./components/activity-panel";
import { PolicyReminders } from "./components/policy-reminders";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Clock, Plus, Wallet, FileDown, Calendar } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { canApprove } from "@/lib/rbac";
import PendingApprovalsCard from "./components/pending-approvals-card";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const username = user?.name ?? "User";
  const role = user?.role ?? "employee";
  const approver = user ? canApprove(user.role as any) : false;
  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <DashboardSidebar activeItem="dashboard" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader username={username} role={role} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
              {approver && (
                <Link href="/approvals">
                  <Button variant="outline">Go to Approvals</Button>
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <KPICard title="Available EL" value="18 days" subtext="Max carry 60" icon={CalendarCheck} />
              <KPICard title="Available CL" value="6 days" subtext="Max 3 consecutive" icon={Clock} />
              <KPICard title="Available ML" value="14 days" subtext=">3 days needs certificate" icon={Plus} />
              {approver ? (
                <PendingApprovalsCard />
              ) : (
                <KPICard title="Upcoming Holidays" value="Victory Day" subtext="16 Dec • See all →" icon={Calendar} />
              )}
            </div>
            <div className="flex items-center gap-4 mb-8">
              <Button className="bg-[#2563EB] text-white"><Plus size={18} className="mr-2" />Apply Leave</Button>
              <Button variant="outline" className="text-[#475569]"><Wallet size={18} className="mr-2" />View My Balance</Button>
              <Button variant="outline" className="text-[#475569]"><FileDown size={18} className="mr-2" />Download Policy (PDF)</Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2"><RequestsTable /></div>
              <div className="space-y-6"><ActivityPanel /><PolicyReminders /></div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
