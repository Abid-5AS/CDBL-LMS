import AppShell from "@/components/app-shell";
import { Users, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function EmployeesPlaceholder() {
  return (
    <AppShell title="Employees" pathname="/employees">
      <div className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Employee Directory</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse and search employee profiles, view leave histories, and manage employee information
          </p>
        </section>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-slate-400" />
              <CardTitle>Employee Directory</CardTitle>
            </div>
            <CardDescription>Search and view employee information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-12 w-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Directory Coming Soon</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                The employee directory feature is under development. Soon you'll be able to search employees,
                view profiles, and access detailed leave histories.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
