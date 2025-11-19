"use client";

import { cn } from "@/lib/utils";
import type { DensityMode } from "@/lib/ui/density-modes";
import { cardPadding, cardGap, getTypography } from "@/lib/ui/density-modes";
import type { LeaveType } from "@prisma/client";
import { TrendingUp, Clock, Heart } from "lucide-react";

interface BalanceCardProps {
  type: LeaveType;
  available: number;
  used: number;
  total: number;
  density?: DensityMode;
  className?: string;
  onClick?: () => void;
}

// Color configurations for each leave type
const LEAVE_TYPE_CONFIG: Record<LeaveType, {
  label: string;
  abbr: string;
  icon: typeof TrendingUp;
  colors: {
    border: string;
    icon: string;
    iconBg: string;
    progress: string;
  };
}> = {
  EARNED: {
    label: "Earned Leave",
    abbr: "EL",
    icon: TrendingUp,
    colors: {
      border: "border-t-blue-500",
      icon: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-500/10",
      progress: "bg-blue-500",
    },
  },
  CASUAL: {
    label: "Casual Leave",
    abbr: "CL",
    icon: Clock,
    colors: {
      border: "border-t-green-500",
      icon: "text-green-600 dark:text-green-400",
      iconBg: "bg-green-500/10",
      progress: "bg-green-500",
    },
  },
  MEDICAL: {
    label: "Medical Leave",
    abbr: "ML",
    icon: Heart,
    colors: {
      border: "border-t-red-500",
      icon: "text-red-600 dark:text-red-400",
      iconBg: "bg-red-500/10",
      progress: "bg-red-500",
    },
  },
  MATERNITY: {
    label: "Maternity Leave",
    abbr: "MtL",
    icon: Heart,
    colors: {
      border: "border-t-pink-500",
      icon: "text-pink-600 dark:text-pink-400",
      iconBg: "bg-pink-500/10",
      progress: "bg-pink-500",
    },
  },
  PATERNITY: {
    label: "Paternity Leave",
    abbr: "PtL",
    icon: Heart,
    colors: {
      border: "border-t-indigo-500",
      icon: "text-indigo-600 dark:text-indigo-400",
      iconBg: "bg-indigo-500/10",
      progress: "bg-indigo-500",
    },
  },
  STUDY: {
    label: "Study Leave",
    abbr: "SL",
    icon: TrendingUp,
    colors: {
      border: "border-t-purple-500",
      icon: "text-purple-600 dark:text-purple-400",
      iconBg: "bg-purple-500/10",
      progress: "bg-purple-500",
    },
  },
  SPECIAL: {
    label: "Special Leave",
    abbr: "SpL",
    icon: TrendingUp,
    colors: {
      border: "border-t-yellow-500",
      icon: "text-yellow-600 dark:text-yellow-400",
      iconBg: "bg-yellow-500/10",
      progress: "bg-yellow-500",
    },
  },
  SPECIAL_DISABILITY: {
    label: "Special Disability Leave",
    abbr: "SDL",
    icon: Heart,
    colors: {
      border: "border-t-orange-500",
      icon: "text-orange-600 dark:text-orange-400",
      iconBg: "bg-orange-500/10",
      progress: "bg-orange-500",
    },
  },
  QUARANTINE: {
    label: "Quarantine Leave",
    abbr: "QL",
    icon: Heart,
    colors: {
      border: "border-t-teal-500",
      icon: "text-teal-600 dark:text-teal-400",
      iconBg: "bg-teal-500/10",
      progress: "bg-teal-500",
    },
  },
  EXTRAWITHPAY: {
    label: "Extra Leave (Paid)",
    abbr: "ExP",
    icon: TrendingUp,
    colors: {
      border: "border-t-cyan-500",
      icon: "text-cyan-600 dark:text-cyan-400",
      iconBg: "bg-cyan-500/10",
      progress: "bg-cyan-500",
    },
  },
  EXTRAWITHOUTPAY: {
    label: "Extra Leave (Unpaid)",
    abbr: "ExU",
    icon: Clock,
    colors: {
      border: "border-t-gray-500",
      icon: "text-gray-600 dark:text-gray-400",
      iconBg: "bg-gray-500/10",
      progress: "bg-gray-500",
    },
  },
};

/**
 * Corporate Balance Card
 * Displays leave balance with color-coded visual indicators
 */
export function BalanceCard({
  type,
  available,
  used,
  total,
  density = "comfortable",
  className,
  onClick,
}: BalanceCardProps) {
  const typography = getTypography(density);
  const config = LEAVE_TYPE_CONFIG[type];
  const Icon = config.icon;
  
  // Calculate progress percentage
  const usagePercentage = total > 0 ? (used / total) * 100 : 0;

  return (
    <div
      className={cn(
        "bg-card border border-border shadow-sm rounded-md transition-all duration-100 border-t-4",
        config.colors.border,
        cardPadding(density),
        onClick && "cursor-pointer hover:border-ring hover:-translate-y-[1px]",
        className
      )}
      onClick={onClick}
    >
      <div className={cn("flex flex-col", cardGap(density))}>
        {/* Header with Icon and Label */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", config.colors.iconBg)}>
              <Icon className={cn("h-5 w-5", config.colors.icon)} />
            </div>
            <div>
              <span className={cn(typography.label, "!normal-case")}>{config.label}</span>
              <p className="text-xs text-muted-foreground">{config.abbr}</p>
            </div>
          </div>
      {/* Header with Icon and Type */}
      <div className="flex items-center gap-3 mb-4">
        <div className={cn("p-2 rounded-lg", config.colors.iconBg)}>
          <config.icon className={cn("h-5 w-5", config.colors.icon)} />
        </div>
        <h3 className={cn(typography.cardTitle, "!text-foreground")}>{config.label}</h3>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className={cn(typography.kpiNumber, config.colors.icon)}>{available}</p>
          <p className={cn(typography.label, "!text-muted-foreground")}>Available</p>
        </div>
        <div>
          <p className={cn(typography.kpiNumber, config.colors.icon)}>{used}</p>
          <p className={cn(typography.label, "!text-muted-foreground")}>Used</p>
        </div>
        <div>
          <p className={cn(typography.kpiNumber, config.colors.icon)}>{total}</p>
          <p className={cn(typography.label, "!text-muted-foreground")}>Total</p>
        </div>
      </div>

      {/* Usage Progress Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>Usage</span>
          <span>{usagePercent}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all duration-300", config.colors.progress)}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
```
