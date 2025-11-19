import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canApprove, canReturn, type AppRole } from "@/lib/rbac";
import { ApprovalsContent } from "./components/approvals-content";

export default async function ApprovalsGate() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Allow access if user can approve OR return requests
  // HR_ADMIN can forward/return but not approve
  // HR_HEAD, CEO, DEPT_HEAD can both approve and return
  const canAccessApprovals =
    canApprove(user.role as AppRole) || canReturn(user.role as AppRole);
  if (!canAccessApprovals) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">
          Pending Leave Approvals
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and process employee leave requests. Select a row to view full
          details before approving or rejecting.
        </p>
      </section>
      <ApprovalsContent />
    </div>
  );
}
