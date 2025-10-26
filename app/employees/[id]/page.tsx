import Link from "next/link";
import { notFound } from "next/navigation";
import { getEmployeeDashboardData } from "@/lib/employee";
import { HRStatCards } from "@/components/HRStatCards";
import { EmployeeProfileCard } from "../components/EmployeeProfileCard";
import { LeaveBalanceCard } from "../components/LeaveBalanceCard";
import { LeaveStatsChart } from "../components/LeaveStatsChart";
import { LeaveDistributionChart } from "../components/LeaveDistributionChart";
import { LeaveHistoryTable } from "../components/LeaveHistoryTable";
import { ApprovalActions } from "../components/ApprovalActions";

type EmployeePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EmployeeDetailPage({ params, searchParams }: EmployeePageProps) {
  const { id } = await params;
  const query = await searchParams;

  const employeeId = Number(id);
  if (Number.isNaN(employeeId)) {
    notFound();
  }

  const data = await getEmployeeDashboardData(employeeId);
  if (!data) {
    notFound();
  }

  const pendingRequestQuery = query.request;
  const queryRequestId = typeof pendingRequestQuery === "string" ? Number(pendingRequestQuery) : NaN;
  const pendingRequestId = Number.isNaN(queryRequestId)
    ? data.pendingRequestId ?? undefined
    : queryRequestId;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              <Link href="/approvals" className="text-blue-600 hover:underline">
                &larr; Back to approvals
              </Link>
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">{data.name}</h1>
            <p className="text-sm text-muted-foreground">{data.email}</p>
          </div>
          <ApprovalActions pendingRequestId={pendingRequestId} employeeName={data.name} />
        </div>

        <HRStatCards stats={data.stats} />

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
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

        <div className="grid gap-6 lg:grid-cols-2">
          <LeaveStatsChart data={data.monthlyTrend} />
          <LeaveDistributionChart data={data.distribution} />
        </div>

        <LeaveHistoryTable history={data.history} />
      </div>
    </div>
  );
}
