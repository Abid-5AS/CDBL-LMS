import { notFound } from "next/navigation";
import { getEmployeeDashboardData } from "@/lib/employee";
import { EmployeeDashboard } from "../components/EmployeeDashboard";

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

  return <EmployeeDashboard data={data} pendingRequestId={pendingRequestId} />;
}
