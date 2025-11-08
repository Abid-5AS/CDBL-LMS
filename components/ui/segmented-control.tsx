"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SegmentedControlProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedControl({ options, value, onChange, className }: SegmentedControlProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg bg-bg-secondary p-1 shadow-inner",
        className
      )}
      role="tablist"
    >
      {options.map((option) => {
        const isActive = option === value;
        return (
          <button
            key={option}
            onClick={() => onChange(option)}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${option.toLowerCase()}`}
            className={cn(
              "relative px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md",
              "focus:outline-none focus:ring-2 focus:ring-data-info focus:ring-offset-2 focus:z-10",
              isActive
                ? "bg-bg-primary text-data-info shadow-sm"
                : "text-text-secondary hover:text-text-secondary hover:bg-bg-secondary"
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

