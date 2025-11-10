"use client";

import { motion, type Variants } from "framer-motion";
import { Calendar, Star } from "lucide-react";
import { Badge } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, cn } from "@/lib/utils";
import type { Holiday } from "../hooks/useHolidaysData";

type HolidaysCalendarViewProps = {
  holidays: Holiday[];
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
    },
  },
};

export function HolidaysCalendarView({ holidays }: HolidaysCalendarViewProps) {
  // Group holidays by month
  const holidaysByMonth = holidays.reduce((acc, holiday) => {
    const date = new Date(holiday.date);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    const monthName = date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    if (!acc[monthKey]) {
      acc[monthKey] = {
        name: monthName,
        holidays: [],
      };
    }

    acc[monthKey].holidays.push(holiday);
    return acc;
  }, {} as Record<string, { name: string; holidays: Holiday[] }>);

  const sortedMonths = Object.entries(holidaysByMonth).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  if (holidays.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No holidays found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your filters to see more holidays
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedMonths.map(([monthKey, monthData], monthIndex) => (
        <motion.div
          key={monthKey}
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: monthIndex * 0.1 }}
        >
          <Card className="border border-border bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                {monthData.name}
                <Badge variant="secondary" className="text-xs">
                  {monthData.holidays.length} holiday
                  {monthData.holidays.length !== 1 ? "s" : ""}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {monthData.holidays
                  .sort(
                    (a, b) =>
                      new Date(a.date).getTime() - new Date(b.date).getTime()
                  )
                  .map((holiday, index) => {
                    const isPast = new Date(holiday.date) < new Date();
                    const holidayDate = new Date(holiday.date);

                    return (
                      <motion.div
                        key={holiday.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: monthIndex * 0.1 + index * 0.05 }}
                        className={cn(
                          "p-3 rounded-xl border bg-muted/40 dark:bg-slate-800/70",
                          "border-border transition-all duration-200",
                          "hover:border-primary/40 hover:bg-background",
                          isPast && "opacity-60"
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                            {holidayDate.getDate()}
                          </div>
                          {holiday.isOptional && (
                            <Badge variant="outline" className="text-xs">
                              <Star className="w-3 h-3 mr-1" />
                              Optional
                            </Badge>
                          )}
                        </div>

                        <h4 className="font-medium text-foreground text-sm mb-1 line-clamp-2">
                          {holiday.name}
                        </h4>

                        <p className="text-xs text-muted-foreground">
                          {holidayDate.toLocaleDateString("en-US", {
                            weekday: "long",
                          })}
                        </p>

                        {isPast && (
                          <Badge variant="secondary" className="text-xs mt-2">
                            Past
                          </Badge>
                        )}
                      </motion.div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
