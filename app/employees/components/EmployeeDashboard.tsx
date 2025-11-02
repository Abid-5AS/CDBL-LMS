"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { EmployeeDashboardData } from "@/lib/employee";
import { useDashboardLayout, type DashboardSectionId } from "@/hooks/useDashboardLayout";
import { DashboardContainer } from "@/components/DashboardContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { LeaveHistoryTable } from "./LeaveHistoryTable";
import { EmployeeProfileCard } from "./EmployeeProfileCard";
import { LeaveBalanceCard } from "./LeaveBalanceCard";
import ChartsSection from "./ChartsSection";
import { HRStatCards } from "@/components/HRStatCards";
import { ApprovalActions } from "./ApprovalActions";
import { canEditEmployee, type AppRole } from "@/lib/rbac";

const SECTION_MAP = {
  Overview: "Overview",
  Analytics: "Analytics",
  History: "History",
} as const;

type EmployeeDashboardProps = {
  data: EmployeeDashboardData;
  pendingRequestId?: number | null;
  viewerRole?: AppRole;
  isHRView?: boolean;
};

export function EmployeeDashboard({ data, pendingRequestId, viewerRole, isHRView = false }: EmployeeDashboardProps) {
  const router = useRouter();
  const { layout, saveLayout, resetLayout, defaultLayout } = useDashboardLayout();
  const [customizeMode, setCustomizeMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering client-side layout after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const sections = useMemo<Record<DashboardSectionId, ReactNode>>(() => ({
    [SECTION_MAP.Overview]: (
      <section className="space-y-4">
        <SectionHeader title="Employee Overview" />
        <div className="grid gap-4 xl:grid-cols-2">
          <EmployeeProfileCard
            name={data.name}
            email={data.email}
            department={data.department}
            designation={data.designation}
            manager={data.manager}
            joiningDate={data.joiningDate}
            employmentStatus={data.employmentStatus}
          />
          <LeaveBalanceCard balances={data.balances} />
        </div>
      </section>
    ),
    [SECTION_MAP.Analytics]: (
      <section className="space-y-4">
        <SectionHeader title="Balances & Analytics" />
        <ChartsSection trend={data.monthlyTrend} distribution={data.distribution} />
      </section>
    ),
    [SECTION_MAP.History]: (
      <section className="space-y-4">
        <SectionHeader title="Leave History" />
        <LeaveHistoryTable history={data.history} />
      </section>
    ),
  }), [data]);

  // Use default layout on server to prevent hydration mismatch
  const activeLayout = mounted && layout.length ? layout : [...defaultLayout];

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
          <div className="space-y-1.5">
            <Link href="/approvals" className="text-sm font-medium text-blue-600 hover:underline">
              &larr; Back to Approvals
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{data.name}</h1>
              <p className="text-sm text-muted-foreground">{data.email}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {data.department ? `${data.department}` : "Department not specified"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setCustomizeMode((prev) => !prev)}
              className={cn(
                "rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium transition",
                customizeMode
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-white text-blue-600 hover:bg-blue-50",
              )}
            >
              {customizeMode ? "Done Customizing" : "Customize Layout"}
            </button>
            <button
              type="button"
              onClick={() => {
                resetLayout();
                setCustomizeMode(false);
              }}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              Revert to Default
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <DashboardContainer
              layout={activeLayout}
              customizeMode={customizeMode}
              saveLayout={(next) => saveLayout(next as DashboardSectionId[])}
              sections={sections}
            />
          </div>
          <aside className="space-y-4">
            <div className="sticky top-4 space-y-4">
              <HRStatCards stats={data.stats} />
            </div>
          </aside>
        </div>
      </div>
      <ApprovalActions
        pendingRequestId={pendingRequestId}
        employeeName={data.name}
        employeeRole={data.role}
        status={pendingRequestId ? "Pending HR Review" : "No pending request"}
      />
      
      {/* Admin Actions Section - Only visible to HR/Admin roles */}
      {isHRView && viewerRole && canEditEmployee(viewerRole, data.role as AppRole) && (
        <div className="mx-auto w-full max-w-[1400px] px-4 pb-6 mt-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Admin Actions</h2>
            <p className="text-sm text-gray-600 mb-4">Manage employee information and access controls</p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push(`/employees/${data.id}?edit=true`)}
                className="flex items-center gap-2 rounded-lg border border-indigo-600 bg-white px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Update Employee
              </button>
              <button
                className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
                disabled
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Deactivate Employee
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4 italic">Note: Deactivation feature coming soon</p>
          </div>
        </div>
      )}
    </div>
  );
}
