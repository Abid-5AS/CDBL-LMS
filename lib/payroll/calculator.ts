import { prisma } from "@/lib/prisma";
import { LeaveType, LeaveStatus } from "@/src/generated/prisma/client";
import { startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from "date-fns";

const UNPAID_LEAVE_TYPES: Set<LeaveType> = new Set([
    LeaveType.EXTRAWITHOUTPAY,
]);

function isLeaveTypePaid(type: LeaveType): boolean {
    return !UNPAID_LEAVE_TYPES.has(type);
}

export interface PayrollSummary {
    employeeId: number;
    month: number;
    year: number;
    totalWorkingDays: number;
    totalPresentDays: number;
    totalPaidLeaveDays: number;
    totalUnpaidLeaveDays: number;
    lwpDeductionDays: number;
    encashmentDays: number;
    breakdown: Record<string, { days: number; isPaid: boolean }>;
}

export class PayrollCalculator {
    /**
     * Calculate payroll summary for an employee for a specific month
     */
    static async calculateMonthlyPayroll(
        employeeId: number,
        month: number, // 0-11
        year: number
    ): Promise<PayrollSummary> {
        const startDate = startOfMonth(new Date(year, month));
        const endDate = endOfMonth(startDate);

        const leaves = await prisma.leaveRequest.findMany({
            where: {
                requesterId: employeeId,
                status: LeaveStatus.APPROVED,
                startDate: { lte: endDate },
                endDate: { gte: startDate },
            },
        });

        const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
        const totalWorkingDays = daysInMonth.filter((day) => !isWeekend(day)).length;

        let totalPaidLeaveDays = 0;
        let totalUnpaidLeaveDays = 0;
        const breakdown: Record<string, { days: number; isPaid: boolean }> = {};

        for (const leave of leaves) {
            const leaveStart = leave.startDate < startDate ? startDate : leave.startDate;
            const leaveEnd = leave.endDate > endDate ? endDate : leave.endDate;

            const leaveDays = eachDayOfInterval({ start: leaveStart, end: leaveEnd })
                .filter((day) => !isWeekend(day)).length;

            if (leaveDays > 0) {
                const typeName = leave.type;
                const isPaid = isLeaveTypePaid(leave.type);

                if (!breakdown[typeName]) {
                    breakdown[typeName] = { days: 0, isPaid };
                }
                breakdown[typeName].days += leaveDays;

                if (isPaid) {
                    totalPaidLeaveDays += leaveDays;
                } else {
                    totalUnpaidLeaveDays += leaveDays;
                }
            }
        }

        const lwpDeductionDays = totalUnpaidLeaveDays;
        const encashmentDays = 0;
        const totalPresentDays = totalWorkingDays - (totalPaidLeaveDays + totalUnpaidLeaveDays);

        return {
            employeeId,
            month,
            year,
            totalWorkingDays,
            totalPresentDays: Math.max(0, totalPresentDays),
            totalPaidLeaveDays,
            totalUnpaidLeaveDays,
            lwpDeductionDays,
            encashmentDays,
            breakdown,
        };
    }

    /**
     * Calculate encashment amount
     */
    static calculateEncashmentAmount(days: number, basicSalary: number): number {
        if (days <= 0) return 0;
        const dailyRate = basicSalary / 30; // Standard 30-day calculation
        return Math.round(dailyRate * days);
    }
}
