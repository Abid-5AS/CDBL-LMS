import AppShell from "@/components/app-shell";
import { ApplyLeaveForm } from "./_components/apply-leave-form";

export default function ApplyLeavePage() {
  return (
    <AppShell title="Apply Leave" pathname="/leaves/apply">
      <ApplyLeaveForm />
    </AppShell>
  );
}
