"use client";

import { motion, type Variants } from "framer-motion";
import { Calendar, CalendarDays, Clock, Star } from "lucide-react";
import type { HolidaysStats } from "../hooks/useHolidaysData";

type HolidaysKPISectionProps = {
  stats: HolidaysStats;
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
    },
  },
};

const iconClasses =
  "w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center";

type StatCardProps = {
  label: string;
  value: number;
  helper: string;
  icon: React.ReactNode;
};

function HolidayStatCard({ label, value, helper, icon }: StatCardProps) {
  return (
    <div className="neo-card p-4 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className={iconClasses}>{icon}</div>
      </div>
      <div>
        <p className="text-3xl font-semibold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{helper}</p>
      </div>
    </div>
  );
}

export function HolidaysKPISection({ stats }: HolidaysKPISectionProps) {
  const cards: StatCardProps[] = [
    {
      label: "Total Holidays",
      value: stats.total,
      helper: "This year",
      icon: <Calendar className="size-4" aria-hidden="true" />,
    },
    {
      label: "Upcoming",
      value: stats.upcoming,
      helper: "Holidays ahead",
      icon: <CalendarDays className="size-4" aria-hidden="true" />,
    },
    {
      label: "Mandatory",
      value: stats.mandatory,
      helper: "Required holidays",
      icon: <Clock className="size-4" aria-hidden="true" />,
    },
    {
      label: "Optional",
      value: stats.optional,
      helper: "Choose to observe",
      icon: <Star className="size-4" aria-hidden="true" />,
    },
  ];

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
    >
      {cards.map((card) => (
        <HolidayStatCard key={card.label} {...card} />
      ))}
    </motion.div>
  );
}
