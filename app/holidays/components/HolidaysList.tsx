"use client";

import { motion } from "framer-motion";
import { Calendar, Star, Clock, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui";
import { formatDate, cn } from "@/lib/utils";
import type { Holiday } from "../hooks/useHolidaysData";

type HolidaysListProps = {
  holidays: Holiday[];
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export function HolidaysList({ holidays }: HolidaysListProps) {
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
    <div className="space-y-3">
      {holidays.map((holiday, index) => {
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
            transition={{ delay: index * 0.05 }}
            className={cn(
              "group flex items-center justify-between p-4 rounded-xl border transition-all duration-300",
              "bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-white/20 dark:border-slate-700/50",
              "hover:shadow-lg hover:scale-[1.01] cursor-pointer",
              isPast && "opacity-75"
            )}
          >
            {/* Left side - Holiday info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="p-2 bg-indigo-500/10 rounded-lg shrink-0">
                <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground truncate">
                    {holiday.name}
                  </h3>
                  {holiday.isOptional && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      <Star className="w-3 h-3 mr-1" />
                      Optional
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{formatDate(holiday.date)}</span>
                  <span>•</span>
                  <span>
                    {holidayDate.toLocaleDateString("en-US", {
                      weekday: "long",
                    })}
                  </span>

                  {!isPast && daysUntil > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-orange-600 dark:text-orange-400">
                        {daysUntil === 1 ? "Tomorrow" : `In ${daysUntil} days`}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right side - Status and actions */}
            <div className="flex items-center gap-3 shrink-0">
              {isPast && (
                <Badge variant="secondary" className="text-xs">
                  Past
                </Badge>
              )}

              {!isPast && daysUntil <= 7 && daysUntil > 0 && (
                <Badge variant="default" className="text-xs bg-orange-500">
                  <Clock className="w-3 h-3 mr-1" />
                  {daysUntil}d
                </Badge>
              )}

              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
