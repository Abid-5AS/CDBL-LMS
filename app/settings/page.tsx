import AppShell from "@/components/app-shell";
import { Suspense } from "react";
import { SettingsContent } from "./components/SettingsContent";
import { getCurrentUser } from "@/lib/auth";

export default async function SettingsPage() {
  return (
    <AppShell title="Settings" pathname="/settings">
      <div className="space-y-6">
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your account preferences and notification settings
          </p>
        </section>
        <Suspense fallback={<SettingsFallback />}>
          <SettingsGate />
        </Suspense>
      </div>
    </AppShell>
  );
}

async function SettingsGate() {
  const user = await getCurrentUser();
  if (!user) {
    return <div className="text-center py-12 text-muted-foreground">Please log in to view settings.</div>;
  }

  return (
    <SettingsContent
      user={{
        name: user.name,
        email: user.email,
        role: user.role || "EMPLOYEE",
        department: null,
        empCode: null,
      }}
    />
  );
}

function SettingsFallback() {
  return (
    <div className="space-y-6">
      <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
      <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
    </div>
  );
}
