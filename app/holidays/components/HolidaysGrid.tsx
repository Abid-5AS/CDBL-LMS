"use client";

import { motion, type Variants } from "framer-motion";
import { Calendar, Star, Clock } from "lucide-react";
import { Badge } from "@/components/ui";
import { RoleDashboardCard } from "../../../components/dashboards/shared/RoleBasedDashboard";
import { formatDate, cn } from "@/lib/utils";
import type { Holiday } from "../hooks/useHolidaysData";

type HolidaysGridProps = {
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

export function HolidaysGrid({ holidays }: HolidaysGridProps) {
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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {holidays.map((holiday) => {
        const isPast = new Date(holiday.date) < new Date();
        const holidayDate = new Date(holiday.date);
        const today = new Date();
        const daysUntil = Math.ceil(
          (holidayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        return (
          <motion.div
            key={holiday.id}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <RoleDashboardCard
              role="EMPLOYEE"
              variant="glass"
              className={cn(
                "h-full transition-all duration-300 hover:scale-[1.01]",
                isPast && "opacity-75"
              )}
              animate={true}
            >
              <div className="p-4 h-full flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex flex-col gap-1">
                    {holiday.isOptional && (
                      <Badge variant="outline" className="text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        Optional
                      </Badge>
                    )}
                    {isPast && (
                      <Badge variant="secondary" className="text-xs">
                        Past
                      </Badge>
                    )}
                    {!isPast && daysUntil <= 7 && daysUntil > 0 && (
                      <Badge
                        variant="default"
                        className="text-xs bg-orange-500"
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {daysUntil}d
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                    {holiday.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {formatDate(holiday.date)}
                  </p>

                  {/* Day of week */}
                  <p className="text-xs text-muted-foreground">
                    {holidayDate.toLocaleDateString("en-US", {
                      weekday: "long",
                    })}
                  </p>
                </div>

                {/* Footer */}
                {!isPast && daysUntil > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      {daysUntil === 1 ? "Tomorrow" : `In ${daysUntil} days`}
                    </p>
                  </div>
                )}
              </div>
            </RoleDashboardCard>
          </motion.div>
        );
      })}
    </div>
  );
}
