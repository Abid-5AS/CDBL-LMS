import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const cache = "no-store";

// All available leave types
const LEAVE_TYPES = [
    "EARNED",
    "CASUAL",
    "MEDICAL",
    "EXTRAWITHPAY",
    "EXTRAWITHOUTPAY",
    "MATERNITY",
    "PATERNITY",
    "STUDY",
    "SPECIAL_DISABILITY",
    "QUARANTINE",
    "SPECIAL",
];

export async function GET() {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    return NextResponse.json({
        success: true,
        data: LEAVE_TYPES,
    });
}
