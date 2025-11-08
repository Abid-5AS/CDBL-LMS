import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Clock, Users, TrendingUp, Calendar } from "lucide-react";
import { PendingLeaveRequestsTable } from "@/components/dashboards/hr-admin/Sections/PendingApprovals";
import { ReturnedRequestsPanel } from "@/components/dashboards/hr-head/Sections/ReturnedRequests";
import { CancellationRequestsPanel } from "@/components/dashboards/hr-admin/Sections/CancellationRequests";
import { DashboardLoadingFallback, DashboardCardSkeleton } from "../shared/LoadingFallback";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { RoleBasedDashboard } from "@/components/dashboards/shared/RoleBasedDashboard";

async function HRHeadDashboardContent() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  // Only allow HR_HEAD role (CEO can also access)
  if (user.role !== "HR_HEAD" && user.role !== "CEO") {
    redirect("/dashboard");
  }

  const username = user.name ?? "HR Head";
  const role = user.role === "CEO" ? "CEO" : "HR_HEAD";

  return (
    <RoleBasedDashboard
      role={role}
      title={`Welcome, ${username}`}
      description="Review and approve critical leave requests across the organization"
      animate={true}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-8 space-y-6">
          {/* Pending Requests Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <PendingLeaveRequestsTable />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Right Side */}
        <div className="lg:col-span-4 space-y-6">
          {/* KPI Cards */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-3xl font-bold mt-1">3</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">On Leave</p>
                  <p className="text-3xl font-bold mt-1">35</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Returned</p>
                  <p className="text-3xl font-bold mt-1">0</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Upcoming</p>
                  <p className="text-3xl font-bold mt-1">2</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Overview - Compact */}
          <Suspense fallback={<DashboardCardSkeleton />}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Team Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Total Requests</span>
                  <span className="font-semibold">7</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">New Hires</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Casual</span>
                  <span className="font-semibold">0.0 days</span>
                </div>
              </CardContent>
            </Card>
          </Suspense>
        </div>
      </div>

      {/* Bottom Section - Full Width */}
      <div className="grid gap-6 md:grid-cols-2 mt-6">
        <Suspense fallback={<DashboardCardSkeleton />}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Returned for Modification</CardTitle>
            </CardHeader>
            <CardContent>
              <ReturnedRequestsPanel />
            </CardContent>
          </Card>
        </Suspense>
        
        <Suspense fallback={<DashboardCardSkeleton />}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cancellation Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <CancellationRequestsPanel />
            </CardContent>
          </Card>
        </Suspense>
      </div>
    </RoleBasedDashboard>
  );
}

export default function HRHeadDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoadingFallback />}>
      <HRHeadDashboardContent />
    </Suspense>
  );
}

