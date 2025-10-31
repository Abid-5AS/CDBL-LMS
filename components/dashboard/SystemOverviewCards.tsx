import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { LeaveStatus, Role } from "@prisma/client";

export async function SystemOverviewCards() {
  const [
    totalEmployees,
    activeAdmins,
    pendingRequests,
    upcomingHolidays,
  ] = await Promise.all([
    prisma.user.count({
      where: { role: Role.EMPLOYEE },
    }),
    prisma.user.count({
      where: { role: { in: [Role.HR_ADMIN, Role.SUPER_ADMIN] } },
    }),
    prisma.leaveRequest.count({
      where: {
        status: { in: [LeaveStatus.SUBMITTED, LeaveStatus.PENDING] },
      },
    }),
    prisma.holiday.count({
      where: {
        date: {
          gte: new Date(),
        },
      },
    }),
  ]);

  const cards = [
    {
      title: "Total Employees",
      value: totalEmployees,
      description: "Active employees in the system",
    },
    {
      title: "Active Admins",
      value: activeAdmins,
      description: "HR Admins + Super Admins",
    },
    {
      title: "Pending Requests",
      value: pendingRequests,
      description: "Awaiting approval",
    },
    {
      title: "Upcoming Holidays",
      value: upcomingHolidays,
      description: "Scheduled holidays",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="h-auto min-h-[120px]">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-slate-600">
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

