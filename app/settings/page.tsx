import { Suspense } from "react";
import { SettingsContent } from "./components/SettingsContent";
import { getCurrentUser } from "@/lib/auth";

export default async function SettingsPage() {
  return (
    <div className="h-full">
      <Suspense fallback={<SettingsFallback />}>
        <SettingsGate />
      </Suspense>
    </div>
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
      <div className="h-64 bg-muted dark:bg-muted/80 dark:bg-muted dark:bg-muted/80 rounded-xl animate-pulse" />
      <div className="h-48 bg-muted dark:bg-muted/80 dark:bg-muted dark:bg-muted/80 rounded-xl animate-pulse" />
    </div>
  );
}
