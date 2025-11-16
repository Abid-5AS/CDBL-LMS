import { NextResponse } from "next/server";
import {
  DashboardAccessError,
  getHRAdminStatsData,
} from "@/lib/dashboard/hr-admin-data";

export async function GET() {
  try {
    const data = await getHRAdminStatsData();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    if (error instanceof DashboardAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Error fetching HR_ADMIN stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
