import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { reportId, schedule, recipients } = body;

        if (!reportId || !schedule) {
            return NextResponse.json(
                { error: "Report ID and schedule are required" },
                { status: 400 }
            );
        }

        // Verify ownership
        const report = await prisma.savedReport.findUnique({
            where: { id: reportId },
        });

        if (!report || report.creatorId !== user.id) {
            return NextResponse.json({ error: "Report not found or unauthorized" }, { status: 404 });
        }

        const updatedReport = await prisma.savedReport.update({
            where: { id: reportId },
            data: {
                schedule,
                recipients,
            },
        });

        return NextResponse.json(updatedReport);
    } catch (error) {
        console.error("Error scheduling report:", error);
        return NextResponse.json(
            { error: "Failed to schedule report" },
            { status: 500 }
        );
    }
}
