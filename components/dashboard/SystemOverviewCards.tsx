import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { LeaveStatus, Role } from "@prisma/client";
import { Users, ShieldCheck, Clock, Calendar as CalendarIcon } from "lucide-react";

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
      where: { role: { in: [Role.HR_ADMIN, Role.HR_HEAD, Role.CEO] } },
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
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Active Admins",
      value: activeAdmins,
      description: "HR Admins + Super Admins",
      icon: ShieldCheck,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Pending Requests",
      value: pendingRequests,
      description: "Awaiting approval",
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "Upcoming Holidays",
      value: upcomingHolidays,
      description: "Scheduled holidays",
      icon: CalendarIcon,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="h-auto min-h-[140px] hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {card.title}
                </CardTitle>
                <div className={`${card.bgColor} ${card.color} p-2 rounded-lg`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900 mb-1">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

