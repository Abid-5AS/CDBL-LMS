"use client";

import { useMemo, useState, useEffect } from "react";
import clsx from "clsx";

type CircularMeterProps = {
  label: string;
  used: number;
  total: number;
  color: string;
};

export function CircularMeter({ label, used, total, color }: CircularMeterProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const percentage = useMemo(() => {
    return Math.min(Math.max((used / total) * 100, 0), 100);
  }, [used, total]);

  const remaining = total - used;
  
  // SVG circle calculations
  const size = 80;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center gap-4 group hover:scale-[1.02] transition-transform duration-200">
      {/* Circular SVG */}
      <div className="relative shrink-0">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-200"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={clsx(
              "transition-all duration-1000 ease-out",
              color,
              isVisible ? "opacity-100" : "opacity-0"
            )}
            style={{
              animation: isVisible ? "none" : undefined
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-bold text-foreground transition-all duration-500">{remaining}</div>
            <div className="text-xs text-muted-foreground">{used}/{total}</div>
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground mb-1">{label}</div>
        <div className="text-xs text-muted-foreground">
          {used} / {total} days used
        </div>
        <div className="mt-2 w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div
            className={clsx("h-full transition-all duration-500 ease-out", color)}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

