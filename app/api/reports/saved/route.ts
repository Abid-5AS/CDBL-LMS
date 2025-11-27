import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const reports = await prisma.savedReport.findMany({
            where: { creatorId: user.id },
            orderBy: { updatedAt: "desc" },
        });

        return NextResponse.json(reports);
    } catch (error) {
        console.error("Error fetching saved reports:", error);
        return NextResponse.json(
            { error: "Failed to fetch saved reports" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, description, config, schedule, recipients } = body;

        if (!name || !config) {
            return NextResponse.json(
                { error: "Name and config are required" },
                { status: 400 }
            );
        }

        const report = await prisma.savedReport.create({
            data: {
                name,
                description,
                config,
                schedule,
                recipients,
                creatorId: user.id,
            },
        });

        return NextResponse.json(report);
    } catch (error) {
        console.error("Error saving report:", error);
        return NextResponse.json(
            { error: "Failed to save report" },
            { status: 500 }
        );
    }
}
