"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface LeaveBalanceCardProps {
  type: string;
  available: number;
  total: number;
  colorClass?: string;
  animate?: boolean;
}

export function LeaveBalanceCard({
  type,
  available,
  total,
  colorClass = "bg-primary",
  animate = true,
}: LeaveBalanceCardProps) {
  const percentage = Math.min(100, Math.max(0, (available / total) * 100));
  
  // Determine color based on type if not provided
  const getColor = (type: string) => {
    switch (type.toUpperCase()) {
      case "CASUAL":
        return "bg-blue-500";
      case "SICK":
        return "bg-rose-500";
      case "EARNED":
        return "bg-emerald-500";
      default:
        return "bg-primary";
    }
  };

  const barColor = colorClass || getColor(type);

  const content = (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">
          {type} LEAVE
        </h3>
        <span className="text-xs font-medium text-muted-foreground">
          {percentage.toFixed(0)}% Left
        </span>
      </div>
      
      <div className="mb-3 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-foreground">{available}</span>
        <span className="text-sm text-muted-foreground">/ {total} Days</span>
      </div>
      
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/50">
        <div 
          className={cn("h-full rounded-full transition-all duration-500", barColor)} 
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
