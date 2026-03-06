import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { LeaveType } from "@/src/generated/prisma/client";

export const cache = "no-store";

export async function GET(request: Request) {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const year = new Date().getFullYear();
    const balances = await prisma.balance.findMany({
        where: { userId: me.id, year },
    });

    const getBalance = (type: LeaveType) => {
        const record = balances.find((b) => b.type === type);
        if (!record) return { opening: 0, accrued: 0, used: 0, closing: 0 };
        const closing = record.closing ?? Math.max((record.opening ?? 0) + (record.accrued ?? 0) - (record.used ?? 0), 0);
        return {
            opening: record.opening ?? 0,
            accrued: record.accrued ?? 0,
            used: record.used ?? 0,
            closing,
        };
    };

    const detailedBalances = (["EARNED", "CASUAL", "MEDICAL"] as LeaveType[]).map((type) => ({
        type,
        ...getBalance(type),
    }));

    return NextResponse.json({
        year,
        balances: detailedBalances,
    });
}

export const dynamic = "force-dynamic";
