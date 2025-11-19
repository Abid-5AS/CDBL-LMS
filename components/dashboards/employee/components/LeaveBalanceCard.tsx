"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TrendingUp, Clock, Heart } from "lucide-react";

interface LeaveBalanceCardProps {
  type: string;
  available: number;
  total: number;
  colorClass?: string;
  animate?: boolean;
}

// Color configurations for each leave type
const LEAVE_COLORS = {
  CASUAL: {
    border: "border-t-green-500",
    icon: "text-green-600 dark:text-green-400",
    iconBg: "bg-green-500/10",
    progress: "bg-green-500",
    Icon: Clock,
  },
  SICK: {
    border: "border-t-red-500",
    icon: "text-red-600 dark:text-red-400",
    iconBg: "bg-red-500/10",
    progress: "bg-red-500",
    Icon: Heart,
  },
  EARNED: {
    border: "border-t-blue-500",
    icon: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-500/10",
    progress: "bg-blue-500",
    Icon: TrendingUp,
  },
  MEDICAL: {
    border: "border-t-red-500",
    icon: "text-red-600 dark:text-red-400",
    iconBg: "bg-red-500/10",
    progress: "bg-red-500",
    Icon: Heart,
  },
};

export function LeaveBalanceCard({
  type,
  available,
  total,
  colorClass,
  animate = true,
}: LeaveBalanceCardProps) {
  const percentage = Math.min(100, Math.max(0, (available / total) * 100));
  const typeKey = type.toUpperCase() as keyof typeof LEAVE_COLORS;
  const config = LEAVE_COLORS[typeKey] || LEAVE_COLORS.EARNED;
  const Icon = config.Icon;

  const content = (
    <div className={cn(
      "rounded-md border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md border-t-4",
      config.border
    )}>
      {/* Header with Icon */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", config.iconBg)}>
            <Icon className={cn("h-5 w-5", config.icon)} />
          </div>
          <h3 className="font-semibold text-foreground uppercase tracking-wider text-sm">
            {type} Leave
          </h3>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {percentage.toFixed(0)}% Left
        </span>
      </div>
      
      {/* Available Days - Big Number */}
      <div className="mb-3 flex items-baseline gap-1">
        <span className={cn("text-3xl font-bold", config.icon)}>{available}</span>
        <span className="text-sm text-muted-foreground">of {total} days</span>
      </div>
      
      {/* Progress Bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div 
          className={cn("h-full rounded-full transition-all duration-500", config.progress)} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );

  if (animate) {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
}
