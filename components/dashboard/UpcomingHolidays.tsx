import Link from "next/link";
import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export async function UpcomingHolidays() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const holidays = await prisma.holiday.findMany({
    where: {
      date: {
        gte: today,
      },
    },
    orderBy: {
      date: "asc",
    },
    take: 5,
  });

  if (holidays.length === 0) {
    return (
      <Card className="h-auto min-h-[140px] hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Upcoming Holidays
            </CardTitle>
            <div className="bg-green-50 text-green-600 p-2 rounded-lg">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">No upcoming holidays scheduled</p>
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/holidays">
              <Calendar className="mr-2 h-4 w-4" />
              View Calendar
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const nextHoliday = holidays[0];
  const dateStr = formatDate(nextHoliday.date.toISOString());
  const nextDate = new Date(nextHoliday.date);
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const daysUntil = Math.ceil((nextDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Card className="h-auto min-h-[140px] hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Upcoming Holidays
          </CardTitle>
          <div className="bg-green-50 text-green-600 p-2 rounded-lg">
            <Calendar className="h-4 w-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-lg font-bold text-slate-900 mb-1">{nextHoliday.name}</p>
          <div className="flex items-center gap-2 text-sm">
            <p className="text-muted-foreground">{dateStr}</p>
            {daysUntil >= 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `in ${daysUntil} days`}
              </span>
            )}
          </div>
        </div>
        {holidays.length > 1 && (
          <p className="text-xs text-muted-foreground">
            +{holidays.length - 1} more upcoming holiday{holidays.length - 1 > 1 ? "s" : ""}
          </p>
        )}
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href="/holidays">
            <Calendar className="mr-2 h-4 w-4" />
            View All
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

