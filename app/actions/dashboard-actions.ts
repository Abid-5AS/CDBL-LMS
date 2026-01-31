"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { startOfDay, endOfDay, addDays, isWithinInterval } from "date-fns";

export type TeamAvailabilityData = {
    onLeaveToday: {
        id: number;
        name: string;
        email: string;
        leaveType: string;
        returnDate: Date;
    }[];
    upcomingLeaves: {
        id: number;
        name: string;
        date: Date;
        leaveType: string;
        duration: number;
    }[];
};

export async function getTeamAvailability(): Promise<{ success: boolean; data?: TeamAvailabilityData; error?: string }> {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "DEPT_HEAD") {
            return { success: false, error: "Unauthorized" };
        }

        // Get all employees in the same department
        // Assuming department is stored as a string on the user model for now, 
        // or we use deptHeadId relationship if strictly hierarchical. 
        // Based on schemas seen, 'department' string field seems common, but let's check if we can query by it.
        // If strict hierarchy: where: { OR: [{ deptHeadId: user.id }, { department: user.department }] }
        // Let's stick to department string matching as a safe bet for "Team".

        if (!user.department) {
            return { success: false, error: "No department assigned" };
        }

        const today = new Date();
        const nextWeek = addDays(today, 7);

        // Fetch leaves for the department
        const leaves = await prisma.leaveRequest.findMany({
            where: {
                requester: {
                    department: user.department,
                    id: { not: user.id } // Exclude self
                },
                status: "APPROVED",
                OR: [
                    // On leave today: start <= today <= end
                    {
                        startDate: { lte: endOfDay(today) },
                        endDate: { gte: startOfDay(today) }
                    },
                    // Upcoming: today < start <= nextWeek
                    {
                        startDate: { gt: endOfDay(today), lte: endOfDay(nextWeek) }
                    }
                ]
            },
            include: {
                requester: {
                    select: { id: true, name: true, email: true }
                }
            },
            orderBy: { startDate: 'asc' }
        });

        const onLeaveToday = [];
        const upcomingLeaves = [];

        for (const leave of leaves) {
            // Check if it's "Today"
            if (isWithinInterval(today, { start: startOfDay(leave.startDate), end: endOfDay(leave.endDate) })) {
                onLeaveToday.push({
                    id: leave.requester.id,
                    name: leave.requester.name,
                    email: leave.requester.email,
                    leaveType: leave.type,
                    returnDate: addDays(leave.endDate, 1) // Expected return (next working day logic omitted for simplicity)
                });
            } else if (leave.startDate > today) {
                upcomingLeaves.push({
                    id: leave.requester.id,
                    name: leave.requester.name,
                    date: leave.startDate,
                    leaveType: leave.type,
                    duration: leave.workingDays
                });
            }
        }

        return {
            success: true,
            data: {
                onLeaveToday,
                upcomingLeaves
            }
        };

    } catch (error) {
        console.error("getTeamAvailability error:", error);
        return { success: false, error: "Failed to fetch team availability" };
    }
}
