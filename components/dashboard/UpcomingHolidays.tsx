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
      <Card className="h-auto min-h-[120px]">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-slate-600">
            Upcoming Holidays
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No upcoming holidays</p>
          <Button asChild variant="link" className="px-0 text-blue-600 mt-2">
            <Link href="/holidays">
              <Calendar className="mr-1 h-4 w-4" />
              View calendar
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const nextHoliday = holidays[0];
  const dateStr = formatDate(nextHoliday.date.toISOString());

  return (
    <Card className="h-auto min-h-[120px]">
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          Upcoming Holidays
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <p className="text-lg font-semibold text-slate-900">{nextHoliday.name}</p>
          <p className="text-sm text-muted-foreground">{dateStr}</p>
        </div>
        {holidays.length > 1 && (
          <p className="text-xs text-muted-foreground">
            +{holidays.length - 1} more upcoming
          </p>
        )}
        <Button asChild variant="link" className="px-0 text-blue-600">
          <Link href="/holidays">
            <Calendar className="mr-1 h-4 w-4" />
            See calendar
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

