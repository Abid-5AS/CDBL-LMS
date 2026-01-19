import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeaveStatus } from "@/src/generated/prisma/client";

export const cache = "no-store";

// Withdraw is essentially a cancel for pending leaves
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { id } = await params;
    const leaveId = parseInt(id, 10);

    if (isNaN(leaveId)) {
        return NextResponse.json({
            success: false,
            error: "Invalid leave ID"
        }, { status: 400 });
    }

    try {
        const leave = await prisma.leaveRequest.findUnique({
            where: { id: leaveId },
        });

        if (!leave) {
            return NextResponse.json({
                success: false,
                error: "Leave request not found"
            }, { status: 404 });
        }

        if (leave.requesterId !== me.id) {
            return NextResponse.json({
                success: false,
                error: "You can only withdraw your own leave requests"
            }, { status: 403 });
        }

        if (leave.status !== LeaveStatus.PENDING) {
            return NextResponse.json({
                success: false,
                error: "Only pending leave requests can be withdrawn"
            }, { status: 400 });
        }

        // Update leave status to CANCELLED
        const updated = await prisma.leaveRequest.update({
            where: { id: leaveId },
            data: { status: LeaveStatus.CANCELLED },
        });

        return NextResponse.json({
            success: true,
            data: updated,
        });
    } catch (err) {
        console.error("POST /api/leaves/[id]/withdraw error:", err);
        return NextResponse.json({
            success: false,
            error: "Failed to withdraw leave request"
        }, { status: 500 });
    }
}
