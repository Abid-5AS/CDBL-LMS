import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Calendar } from "lucide-react";
import { connection } from "next/server";

export async function HolidaysList() {
  await connection();
  
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
  });

  if (holidays.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Holidays
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No upcoming holidays scheduled</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Holidays
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {holidays.map((holiday) => (
            <div
              key={holiday.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 p-4 hover:bg-slate-50"
            >
              <div>
                <p className="font-medium text-slate-900">{holiday.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(holiday.date.toISOString())}
                  {holiday.isOptional && (
                    <span className="ml-2 text-xs text-blue-600">(Optional)</span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

