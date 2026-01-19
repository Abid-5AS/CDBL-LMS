import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";
import { LeaveType, LeaveStatus } from "@/src/generated/prisma/client";
import { z } from "zod";

export const cache = "no-store";

// Schema for bulk import validation
const LeaveImportSchema = z.object({
    leaves: z.array(z.object({
        employeeEmail: z.string().email(),
        type: z.enum([
            "EARNED", "CASUAL", "MEDICAL", "EXTRAWITHPAY", "EXTRAWITHOUTPAY",
            "MATERNITY", "PATERNITY", "STUDY", "SPECIAL_DISABILITY", "QUARANTINE", "SPECIAL"
        ]),
        startDate: z.string(),
        endDate: z.string(),
        reason: z.string().min(3),
        workingDays: z.number().optional(),
    })),
});

export async function POST(req: NextRequest) {
    const traceId = getTraceId(req as any);
    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json(error("unauthorized", undefined, traceId), { status: 401 });
    }

    // Only HR_ADMIN, HR_HEAD, and SYSTEM_ADMIN can bulk import
    const allowedRoles = ["HR_ADMIN", "HR_HEAD", "SYSTEM_ADMIN"];
    if (!allowedRoles.includes(user.role)) {
        return NextResponse.json(error("forbidden", "Access denied", traceId), { status: 403 });
    }

    try {
        const body = await req.json();
        const parsed = LeaveImportSchema.parse(body);

        const results = {
            success: 0,
            failed: 0,
            errors: [] as Array<{ row: number; email: string; error: string }>,
        };

        for (let i = 0; i < parsed.leaves.length; i++) {
            const leave = parsed.leaves[i];

            try {
                // Find employee by email
                const employee = await prisma.user.findUnique({
                    where: { email: leave.employeeEmail },
                });

                if (!employee) {
                    results.failed++;
                    results.errors.push({
                        row: i + 1,
                        email: leave.employeeEmail,
                        error: "Employee not found",
                    });
                    continue;
                }

                // Calculate working days if not provided
                const startDate = new Date(leave.startDate);
                const endDate = new Date(leave.endDate);
                const workingDays = leave.workingDays ?? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                // Create leave request
                await prisma.leaveRequest.create({
                    data: {
                        requesterId: employee.id,
                        type: leave.type as LeaveType,
                        startDate,
                        endDate,
                        reason: leave.reason,
                        workingDays,
                        status: LeaveStatus.APPROVED, // Bulk imports are pre-approved
                        policyVersion: "v2.0-bulk-import",
                    },
                });

                results.success++;
            } catch (err) {
                results.failed++;
                results.errors.push({
                    row: i + 1,
                    email: leave.employeeEmail,
                    error: err instanceof Error ? err.message : "Unknown error",
                });
            }
        }

        // Log the bulk import action
        await prisma.auditLog.create({
            data: {
                actorEmail: user.email,
                action: "BULK_LEAVE_IMPORT",
                details: {
                    total: parsed.leaves.length,
                    success: results.success,
                    failed: results.failed,
                },
            },
        });

        return NextResponse.json({
            success: true,
            data: results,
        });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return NextResponse.json(
                error("validation_error", "Invalid import data", traceId, { errors: err.format() }),
                { status: 400 }
            );
        }

        console.error("Bulk import error:", err);
        return NextResponse.json(
            error("internal_error", "Failed to import leaves", traceId),
            { status: 500 }
        );
    }
}
