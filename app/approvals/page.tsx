import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/app/dashboard/components/dashboard-sidebar";
import { DashboardHeader } from "@/app/dashboard/components/dashboard-header";
import { getCurrentUser } from "@/lib/auth";
import { canApprove, Role } from "@/lib/rbac";
import { ApprovalsTable } from "./components/approvals-table";

export default async function ApprovalsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const approver = canApprove(user.role as Role);
  if (!approver) {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <DashboardSidebar activeItem="approvals" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader username={user.name} role={user.role} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1200px] mx-auto p-8 space-y-6">
            <header>
              <h1 className="text-2xl font-semibold text-slate-900">Approvals</h1>
              <p className="text-sm text-slate-600">
                Review pending leave requests assigned to your role and take action.
              </p>
            </header>
            <ApprovalsTable />
          </div>
        </main>
      </div>
    </div>
  );
}
