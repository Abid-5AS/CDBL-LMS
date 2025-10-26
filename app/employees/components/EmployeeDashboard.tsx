"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
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

const SECTION_MAP = {
  LeaveHistory: "LeaveHistory",
  Profile: "Profile",
  Balance: "Balance",
  Charts: "Charts",
} as const;

type EmployeeDashboardProps = {
  data: EmployeeDashboardData;
  pendingRequestId?: number | null;
};

export function EmployeeDashboard({ data, pendingRequestId }: EmployeeDashboardProps) {
  const { layout, saveLayout, resetLayout, defaultLayout } = useDashboardLayout();
  const [customizeMode, setCustomizeMode] = useState(false);

  const sections = useMemo<Record<DashboardSectionId, ReactNode>>(() => ({
    [SECTION_MAP.LeaveHistory]: <LeaveHistoryTable history={data.history} />,
    [SECTION_MAP.Profile]: (
      <EmployeeProfileCard
        name={data.name}
        email={data.email}
        department={data.department}
        designation={data.designation}
        manager={data.manager}
        joiningDate={data.joiningDate}
        employmentStatus={data.employmentStatus}
      />
    ),
    [SECTION_MAP.Balance]: <LeaveBalanceCard balances={data.balances} />,
    [SECTION_MAP.Charts]: <ChartsSection trend={data.monthlyTrend} distribution={data.distribution} />,
  }), [data]);

  const activeLayout = layout.length ? layout : [...defaultLayout];

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="mx-auto w-full max-w-6xl px-8 py-8">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <Link href="/approvals" className="text-sm font-medium text-blue-600 hover:underline">
              &larr; Back to Approvals
            </Link>
            <SectionHeader title={data.name} className="mb-0">
              <span className="text-sm text-muted-foreground">{data.email}</span>
            </SectionHeader>
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

        <div className="mt-8 grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <DashboardContainer
              layout={activeLayout}
              customizeMode={customizeMode}
              saveLayout={(next) => saveLayout(next as DashboardSectionId[])}
              sections={sections}
            />
          </div>
          <aside className="col-span-1 space-y-4">
            <div className="sticky top-4 space-y-4">
              <HRStatCards stats={data.stats} />
              <ApprovalActions pendingRequestId={pendingRequestId} employeeName={data.name} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
