"use client";

import { motion, type Variants } from "framer-motion";
import {
  Calendar,
  CalendarDays,
  Download,
  Sparkles,
  Users,
} from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { ExpandableCard } from "../../../components/dashboards/shared/ProgressiveDisclosure";
import { formatDate } from "@/lib/utils";
import type { Holiday, HolidaysStats } from "../hooks/useHolidaysData";

type HolidaysSidebarProps = {
  stats: HolidaysStats;
  nextHoliday: Holiday | null;
  onExportPDF: () => void;
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

export function HolidaysSidebar({
  stats,
  nextHoliday,
  onExportPDF,
}: HolidaysSidebarProps) {
  return (
    <motion.div variants={itemVariants} className="space-y-6">
      {/* Quick Stats */}
      <ExpandableCard
        title="Holiday Statistics"
        subtitle="Overview of company holidays"
        icon={CalendarDays}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.upcoming}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              Upcoming
            </div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.mandatory}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">
              Mandatory
            </div>
          </div>
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.optional}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400">
              Optional
            </div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {stats.past}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Past</div>
          </div>
        </div>
      </ExpandableCard>

      {/* Next Holiday */}
      {nextHoliday && (
        <ExpandableCard
          title="Next Holiday"
          subtitle="Upcoming celebration"
          icon={Sparkles}
        >
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900 dark:text-white">
                  {nextHoliday.name}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {formatDate(nextHoliday.date)}
                </p>
                {nextHoliday.isOptional && (
                  <Badge variant="outline" className="mt-1 text-xs">
                    Optional
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </ExpandableCard>
      )}

      {/* Quick Actions */}
      <ExpandableCard
        title="Quick Actions"
        subtitle="Holiday management tools"
        icon={Users}
      >
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={onExportPDF}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Calendar
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => window.open("/leaves/apply", "_blank")}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Plan Leave
          </Button>
        </div>
      </ExpandableCard>
    </motion.div>
  );
}
