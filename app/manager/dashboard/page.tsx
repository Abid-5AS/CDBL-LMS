import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { DeptHeadDashboardWrapper } from "@/components/dashboard/DeptHeadDashboardWrapper";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

// Simplified greeting component
function GreetingHeader({ name, department }: { name: string; department?: string }) {
  const now = new Date();
  const hour = now.getHours();
  let greeting = "Good Morning";
  if (hour >= 12 && hour < 17) greeting = "Good Afternoon";
  else if (hour >= 17) greeting = "Good Evening";

  const deptLabel = department ? `, Head of ${department}` : "";

  return (
    <section className="space-y-1">
      <h1 className="text-2xl font-bold text-foreground">
        {greeting}{deptLabel}
      </h1>
      <p className="text-sm text-muted-foreground">
        Review and manage your department's leave requests.
      </p>
    </section>
  );
}

async function DeptHeadDashboardPage() {
  const user = await getCurrentUser();

  if (!user || !["DEPT_HEAD", "CEO"].includes(user.role as string)) {
    redirect("/dashboard");
  }

  return (
    <div className="w-full px-3 sm:px-4 lg:px-6 space-y-6">
      {/* Simplified Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Department Head</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Simplified Greeting Header */}
      <GreetingHeader name={user.name || "Department Head"} department={user.department || undefined} />

      {/* Main Content Grid - Restructured Layout */}
      <Suspense fallback={<DashboardFallback />}>
        <DeptHeadDashboardWrapper />
      </Suspense>

      {/* Footer */}
      <div className="pt-6 border-t border-muted/60 text-center text-xs text-muted-foreground">
        <p>Policy v2.0 • © Central Depository Bangladesh Ltd.</p>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <Card className="rounded-2xl border-muted/60 shadow-sm">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          <div className="h-20 bg-muted animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardFallback() {
  return (
    <div className="space-y-6">
      <div className="h-36 rounded-2xl border border-muted/60 bg-card shadow-sm animate-pulse" />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="h-64 rounded-2xl border border-muted/60 bg-card shadow-sm animate-pulse" />
        </div>
        <div className="lg:col-span-1 space-y-6">
          <div className="h-48 rounded-2xl border border-muted/60 bg-card shadow-sm animate-pulse" />
          <div className="h-48 rounded-2xl border border-muted/60 bg-card shadow-sm animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function ManagerDashboard() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DeptHeadDashboardPage />
    </Suspense>
  );
}
