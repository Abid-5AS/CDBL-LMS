import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { executeReport } from "@/lib/reports/executor";

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { config } = body;

        if (!config) {
            return NextResponse.json({ error: "Config is required" }, { status: 400 });
        }

        const data = await executeReport(config);

        return NextResponse.json({ data });
    } catch (error) {
        console.error("Error executing report:", error);
        return NextResponse.json(
            { error: "Failed to execute report" },
            { status: 500 }
        );
    }
}
