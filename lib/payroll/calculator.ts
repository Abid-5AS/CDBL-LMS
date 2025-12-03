import { prisma } from "@/lib/prisma";
import { LeaveType, LeaveStatus } from "@prisma/client";
import { startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from "date-fns";

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

        // Get all approved leaves for the employee in this month
        const leaves = await prisma.leaveRequest.findMany({
            where: {
                employeeId,
                status: LeaveStatus.APPROVED,
                OR: [
                    {
                        startDate: {
                            lte: endDate,
                        },
                        endDate: {
                            gte: startDate,
                        },
                    },
                ],
            },
            include: {
                leaveType: true,
            },
        });

        // Calculate working days in month (excluding weekends)
        // TODO: Integrate with Holiday calendar for more accuracy
        const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
        const totalWorkingDays = daysInMonth.filter((day) => !isWeekend(day)).length;

        let totalPaidLeaveDays = 0;
        let totalUnpaidLeaveDays = 0;
        const breakdown: Record<string, { days: number; isPaid: boolean }> = {};

        // Process each leave
        for (const leave of leaves) {
            // Calculate overlap with current month
            const leaveStart = leave.startDate < startDate ? startDate : leave.startDate;
            const leaveEnd = leave.endDate > endDate ? endDate : leave.endDate;

            const leaveDays = eachDayOfInterval({ start: leaveStart, end: leaveEnd })
                .filter((day) => !isWeekend(day)).length; // Assuming leaves are only counted on working days

            if (leaveDays > 0) {
                const typeName = leave.leaveType.name;
                const isPaid = leave.leaveType.isPaid;

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

        // Calculate LWP (Leave Without Pay)
        // Logic: Explicit unpaid leaves + any other logic defined by policy
        const lwpDeductionDays = totalUnpaidLeaveDays;

        // Calculate Encashment (only relevant for specific months/types, usually year-end)
        // For now, returning 0 as it's typically a separate process
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
