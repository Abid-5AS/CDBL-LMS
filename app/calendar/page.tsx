import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TeamCalendar } from "@/components/calendar/TeamCalendar";
import { redirect } from "next/navigation";
import { LeaveStatus } from "@prisma/client";

export default async function CalendarPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch approved leaves for the user's department
    const leaves = await prisma.leaveRequest.findMany({
        where: {
            requester: {
                department: user.department,
            },
            status: LeaveStatus.APPROVED,
        },
        include: {
            requester: {
                select: {
                    name: true,
                },
            },
        },
    });

    const events = leaves.map((leave) => ({
        id: leave.id,
        employeeName: leave.requester.name,
        leaveType: leave.type,
        startDate: leave.startDate,
        endDate: leave.endDate,
        status: leave.status,
    }));

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Team Calendar</h1>
                <p className="text-muted-foreground mt-2">
                    View leave schedule for your department.
                </p>
            </div>

            <TeamCalendar events={events} />
        </div>
    );
}
