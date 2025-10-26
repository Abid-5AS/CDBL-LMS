import AppShell from "@/components/app-shell";
import { unstable_noStore as noStore } from "next/cache";

export default function AdminConsolePage() {
  noStore();
  return (
    <AppShell title="Admin Console" pathname="/admin">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-sm text-slate-600">
        Super admin console coming soon.
      </div>
    </AppShell>
  );
}
