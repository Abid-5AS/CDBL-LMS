"use client";

import { motion, type Variants } from "framer-motion";
import { CalendarDays, Clock, Star, History, ArrowRight } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui";
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
  value: number | string;
  helper: string;
  icon: React.ReactNode;
  muted?: boolean;
  featured?: boolean;
};

function HolidayStatCard({ label, value, helper, icon, muted = false, featured = false }: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg p-4 flex flex-col gap-3 h-full transition-all duration-200",
        featured && "ring-2 ring-primary/20",
        muted && "opacity-70"
      )}
      aria-disabled={muted}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className={iconClasses}>{icon}</div>
      </div>
      <div>
        <p className={cn(
          featured ? "text-4xl font-bold" : "text-3xl font-semibold",
          "text-foreground"
        )}>
          {value}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{helper}</p>
      </div>
    </div>
  );
}

function NextHolidayCard({ stats }: { stats: HolidaysStats }) {
  if (!stats.nextHoliday) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 h-full flex flex-col justify-center items-center text-center gap-2">
        <CalendarDays className="w-8 h-8 text-muted-foreground/50" aria-hidden="true" />
        <p className="text-sm font-medium text-muted-foreground">No upcoming holidays</p>
        <p className="text-xs text-muted-foreground">Check back later</p>
      </div>
    );
  }

  const today = new Date();
  const nextHolidayDate = new Date(stats.nextHoliday.date);
  const daysUntil = Math.ceil(
    (nextHolidayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="bg-card border border-border rounded-lg p-4 h-full ring-2 ring-primary/20 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
            Next Holiday
          </p>
          <h3 className="font-semibold text-foreground line-clamp-2 text-sm">
            {stats.nextHoliday.name}
          </h3>
        </div>
        <ArrowRight className="w-4 h-4 text-primary flex-shrink-0 mt-1" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatDate(stats.nextHoliday.date)}</span>
          <span className="font-semibold text-primary">
            {daysUntil} days
          </span>
        </div>
        {stats.nextHoliday.isOptional && (
          <Badge variant="outline" className="text-xs w-fit">
            <Star className="w-3 h-3 mr-1" />
            Optional
          </Badge>
        )}
      </div>
    </div>
  );
}

export function HolidaysKPISection({ stats }: HolidaysKPISectionProps) {
  const optionalCardMuted = stats.optional === 0;
  const cards: (StatCardProps & { id: string })[] = [
    {
      id: "upcoming",
      label: "Upcoming",
      value: stats.upcoming,
      helper: "Holidays ahead",
      icon: <CalendarDays className="size-4" aria-hidden="true" />,
      featured: stats.upcoming > 0,
    },
    {
      id: "mandatory",
      label: "Mandatory",
      value: stats.mandatoryUpcoming,
      helper: "Still to observe",
      icon: <Clock className="size-4" aria-hidden="true" />,
    },
    {
      id: "optional",
      label: "Optional",
      value: optionalCardMuted ? "—" : stats.optional,
      helper: optionalCardMuted ? "No optional holidays" : "Choose to observe",
      icon: <Star className="size-4" aria-hidden="true" />,
      muted: optionalCardMuted,
    },
    {
      id: "past",
      label: "Already Observed",
      value: stats.past,
      helper: "Completed this year",
      icon: <History className="size-4" aria-hidden="true" />,
    },
  ];

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
    >
      {cards.map((card) => (
        <HolidayStatCard key={card.id} {...card} />
      ))}
      {/* Next Holiday featured card */}
      <NextHolidayCard stats={stats} />
    </motion.div>
  );
}
