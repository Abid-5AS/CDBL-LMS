import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/app/dashboard/components/dashboard-sidebar";
import { DashboardHeader } from "@/app/dashboard/components/dashboard-header";
import { getCurrentUser } from "@/lib/auth";
import { canApprove, type AppRole } from "@/lib/rbac";
import { ApprovalsContent } from "./components/approvals-content";

export default async function ApprovalsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const approver = canApprove(user.role as AppRole);
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
              <h1 className="text-2xl font-semibold text-slate-900">Pending Leave Approvals</h1>
              <p className="text-sm text-slate-600">
                Review and process employee leave requests. Select a row to view the complete employee profile before
                approving or rejecting.
              </p>
            </header>
            <ApprovalsContent />
          </div>
        </main>
      </div>
    </div>
  );
}
