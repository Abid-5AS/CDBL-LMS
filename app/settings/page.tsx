import AppShell from "@/components/app-shell";
import { Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <AppShell title="Settings" pathname="/settings">
      <div className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your account preferences and notification settings
          </p>
        </section>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-slate-400" />
              <CardTitle>Settings Panel</CardTitle>
            </div>
            <CardDescription>Configure your account and preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Settings className="h-12 w-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Settings Coming Soon</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                We're working on bringing you a comprehensive settings panel where you can manage your preferences,
                notifications, and account details.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
