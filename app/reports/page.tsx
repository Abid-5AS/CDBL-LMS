import AppShell from "@/components/app-shell";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsPage() {
  return (
    <AppShell title="Reports" pathname="/reports">
      <div className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Access analytics, insights, and detailed reports on leave management
          </p>
        </section>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-slate-400" />
              <CardTitle>Reports Workspace</CardTitle>
            </div>
            <CardDescription>View and export leave management reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart3 className="h-12 w-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Reports Coming Soon</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Our reporting dashboard is under development. Soon you'll be able to generate comprehensive
                leave reports, analytics, and insights.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
