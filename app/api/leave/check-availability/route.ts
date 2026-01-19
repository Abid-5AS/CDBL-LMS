import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeaveType } from "@/src/generated/prisma/client";

export const cache = "no-store";

export async function POST(request: Request) {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const { type, startDate, endDate } = body;

        if (!type || !startDate || !endDate) {
            return NextResponse.json({
                success: false,
                data: false,
                error: "Missing required fields: type, startDate, endDate",
            }, { status: 400 });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const year = start.getFullYear();

        // Check balance
        const balance = await prisma.balance.findFirst({
            where: { userId: me.id, year, type: type as LeaveType },
        });

        if (!balance) {
            return NextResponse.json({
                success: true,
                data: false,
                message: "No balance record found for this leave type",
            });
        }

        const remaining = (balance.closing ?? 0) > 0
            ? balance.closing
            : Math.max((balance.opening ?? 0) + (balance.accrued ?? 0) - (balance.used ?? 0), 0);

        // Calculate working days (simple approximation - excludes weekends)
        let workingDays = 0;
        const current = new Date(start);
        while (current <= end) {
            const day = current.getDay();
            if (day !== 0 && day !== 6) workingDays++;
            current.setDate(current.getDate() + 1);
        }

        const available = remaining >= workingDays;

        return NextResponse.json({
            success: true,
            data: available,
            remaining,
            requested: workingDays,
        });
    } catch (err) {
        console.error("POST /api/leave/check-availability error:", err);
        return NextResponse.json({
            success: false,
            data: false,
            error: "Failed to check availability",
        }, { status: 500 });
    }
}
