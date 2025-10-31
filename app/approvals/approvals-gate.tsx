import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canApprove, type AppRole } from "@/lib/rbac";
import { ApprovalsContent } from "./components/approvals-content";

export default async function ApprovalsGate() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const approver = canApprove(user.role as AppRole);
  if (!approver) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Pending Leave Approvals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and process employee leave requests. Select a row to view full details before approving or rejecting.
        </p>
      </section>
      <ApprovalsContent />
    </div>
  );
}
