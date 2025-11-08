"use client";

import Link from "next/link";
import type { EmployeeDashboardData } from "@/lib/employee";
import {
  Button,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui";
import { EmployeeProfileCard } from "./EmployeeProfileCard";
import { LeaveBalanceCard } from "./LeaveBalanceCard";
import ChartsSection from "./ChartsSection";
import { LeaveHistoryTable } from "./LeaveHistoryTable";

type EmployeeSelfProfileProps = {
  employee: EmployeeDashboardData;
};

export function EmployeeSelfProfile({ employee }: EmployeeSelfProfileProps) {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Your Profile</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header with personal greeting */}
      <div className="rounded-xl border border-border-strong bg-bg-primary p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-text-secondary">
              Your Profile
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Welcome back, {employee.name}! 👋
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/leaves/apply">Apply for Leave</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/leaves">View My Requests</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Profile & Balance Cards */}
      <div className="grid gap-4 xl:grid-cols-2">
        <EmployeeProfileCard
          name={employee.name}
          email={employee.email}
          department={employee.department}
          designation={employee.designation}
          manager={employee.manager}
          joiningDate={employee.joiningDate}
          employmentStatus={employee.employmentStatus}
        />
        <LeaveBalanceCard balances={employee.balances} />
      </div>

      {/* Analytics Charts */}
      <div className="rounded-xl border border-border-strong bg-bg-primary p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-text-secondary mb-4">
          Your Leave Analytics
        </h2>
        <ChartsSection
          trend={employee.monthlyTrend}
          distribution={employee.distribution}
        />
      </div>

      {/* Leave History Table */}
      <div className="rounded-xl border border-border-strong bg-bg-primary p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-text-secondary mb-4">
          Leave History
        </h2>
        <LeaveHistoryTable history={employee.history} />
      </div>
    </div>
  );
}
