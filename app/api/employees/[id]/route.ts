import { NextRequest, NextResponse } from "next/server";
import { getEmployeeDashboardData } from "@/lib/employee";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const employeeId = Number(id);

  if (Number.isNaN(employeeId)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const data = await getEmployeeDashboardData(employeeId);
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
