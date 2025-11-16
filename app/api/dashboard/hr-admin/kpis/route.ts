import { NextResponse } from "next/server";
import {
  DashboardAccessError,
  getHRAdminKPIData,
} from "@/lib/dashboard/hr-admin-data";

export async function GET() {
  try {
    const data = await getHRAdminKPIData();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    if (error instanceof DashboardAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Error fetching HR_ADMIN KPIs:", error);
    return NextResponse.json(
      { error: "Failed to fetch KPIs" },
      { status: 500 }
    );
  }
}
