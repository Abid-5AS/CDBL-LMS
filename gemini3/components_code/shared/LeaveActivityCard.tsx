"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface LeaveActivityData {
  label: string;
  type: "EARNED" | "CASUAL" | "MEDICAL";
  used: number;
  total: number;
  color: string;
  size: number;
  unit: string;
}

const LEAVE_COLORS: Record<LeaveActivityData["type"], string> = {
  EARNED: "var(--color-leave-earned)",
  CASUAL: "var(--color-leave-casual)",
  MEDICAL: "var(--color-leave-medical)",
};

const circleStroke = (size: number) => size / 2 - 12;

function ActivityMeter({
  data,
  index,
}: {
  data: LeaveActivityData;
  index: number;
}) {
  const percentage = data.total ? Math.min((data.used / data.total) * 100, 100) : 0;
  const radius = circleStroke(data.size);
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference;
  const accent = data.color || LEAVE_COLORS[data.type];

  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        "--leave-meter-accent": accent,
        "--leave-meter-track": `color-mix(in srgb, ${accent} 25%, transparent)`,
      } as React.CSSProperties}
    >
      <motion.svg
        width={data.size}
        height={data.size}
        className="-rotate-90"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: index * 0.15 }}
      >
        <circle
          cx={data.size / 2}
          cy={data.size / 2}
          r={radius}
          fill="none"
          strokeWidth={8}
          stroke="var(--leave-meter-track)"
        />
        <motion.circle
          cx={data.size / 2}
          cy={data.size / 2}
          r={radius}
          fill="none"
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          stroke="var(--leave-meter-accent)"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.9, delay: index * 0.15 + 0.1, ease: "easeOut" }}
        />
      </motion.svg>
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center text-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.15 + 0.2 }}
      >
        <p className="text-lg font-semibold text-foreground">{data.used}</p>
        <p className="text-[11px] text-muted-foreground">
          of {data.total} {data.unit}
        </p>
        <p className="text-xs font-medium text-muted-foreground">
          {Math.round(percentage)}%
        </p>
      </motion.div>
    </div>
  );
}

interface LeaveActivityCardProps {
  title?: string;
  activities: LeaveActivityData[];
  className?: string;
}

export function LeaveActivityCard({
  title = "Leave Balance Overview",
  activities,
  className,
}: LeaveActivityCardProps) {
  const totals = useMemo(() => {
    const used = activities.reduce((sum, item) => sum + item.used, 0);
    const total = activities.reduce((sum, item) => sum + item.total, 0);
    return { used, remaining: Math.max(total - used, 0) };
  }, [activities]);

  return (
    <div
      className={cn(
        "neo-card relative flex flex-col gap-6 overflow-hidden px-6 py-6",
        className
      )}
    >
      <div className="relative text-center">
        <motion.h3
          className="text-xl font-semibold text-foreground"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {title}
        </motion.h3>
        <p className="text-sm text-muted-foreground">
          View usage across earned, casual, and medical categories
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {activities.map((activity, index) => (
          <div key={activity.type} className="flex flex-col items-center gap-3">
            <ActivityMeter data={activity} index={index} />
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.15 + 0.2 }}
            >
              <p className="text-sm font-semibold text-foreground">
                {activity.label}
              </p>
              <p
                className="text-xs font-medium"
                style={{ color: activity.color || LEAVE_COLORS[activity.type] }}
              >
                {activity.used}/{activity.total} {activity.unit}
              </p>
            </motion.div>
          </div>
        ))}
      </div>

      <motion.div
        className="grid grid-cols-2 gap-4 rounded-2xl border border-white/10 p-4 text-center text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <div>
          <p className="text-muted-foreground">Total Used</p>
          <p className="text-2xl font-semibold text-foreground">
            {totals.used} days
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Remaining</p>
          <p className="text-2xl font-semibold text-foreground">
            {totals.remaining} days
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export function createLeaveActivityData(balances: {
  earnedUsed: number;
  earnedTotal: number;
  casualUsed: number;
  casualTotal: number;
  medicalUsed: number;
  medicalTotal: number;
}): LeaveActivityData[] {
  return [
    {
      label: "Earned Leave",
      type: "EARNED",
      used: balances.earnedUsed,
      total: balances.earnedTotal,
      color: "var(--color-leave-earned)",
      size: 120,
      unit: "days",
    },
    {
      label: "Casual Leave",
      type: "CASUAL",
      used: balances.casualUsed,
      total: balances.casualTotal,
      color: "var(--color-leave-casual)",
      size: 120,
      unit: "days",
    },
    {
      label: "Medical Leave",
      type: "MEDICAL",
      used: balances.medicalUsed,
      total: balances.medicalTotal,
      color: "var(--color-leave-medical)",
      size: 120,
      unit: "days",
    },
  ];
}
