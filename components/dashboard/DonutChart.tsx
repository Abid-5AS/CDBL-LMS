"use client";

import { cn } from "@/lib/utils";

/**
 * A modern donut chart component for displaying leave balances.
 */
export function DonutChart({
  value,
  total,
  className,
}: {
  value: number;
  total: number;
  className?: string;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const circumference = 2 * Math.PI * 45; // 45 is the radius
  const offset = circumference - (percentage / 100) * circumference;

  let colorClass = "text-green-500";
  if (percentage <= 10) colorClass = "text-red-500";
  else if (percentage <= 30) colorClass = "text-yellow-500";

  return (
    <div className={cn("relative size-24", className)}>
      <svg className="size-full" viewBox="0 0 100 100">
        {/* Background Track */}
        <circle
          className="text-gray-100 dark:text-gray-800"
          strokeWidth="10"
          stroke="currentColor"
          fill="transparent"
          r="45"
          cx="50"
          cy="50"
        />
        {/* Progress Arc */}
        <circle
          className={cn(colorClass, "transition-all duration-500 ease-out")}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r="45"
          cx="50"
          cy="50"
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn(
          "font-bold text-gray-900",
          className?.includes("size-16") ? "text-sm" : "text-xl"
        )}>{value}</span>
        <span className={cn(
          "text-gray-500",
          className?.includes("size-16") ? "text-[10px]" : "text-xs"
        )}>days</span>
      </div>
    </div>
  );
}

