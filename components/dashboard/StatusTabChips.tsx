"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type TabOption = {
  value: string;
  label: string;
};

type StatusTabChipsProps = {
  options: TabOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function StatusTabChips({
  options,
  value,
  onChange,
  className,
}: StatusTabChipsProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const currentIndex = options.findIndex((opt) => opt.value === value);
    if (currentIndex >= 0) {
      tabRefs.current[currentIndex]?.focus();
    }
  }, [value, options]);

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ) => {
    let nextIndex = currentIndex;

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      nextIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
    } else if (e.key === "Home") {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      nextIndex = options.length - 1;
    } else {
      return;
    }

    onChange(options[nextIndex].value);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Filter by status"
      className={cn(
        "flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide",
        className
      )}
    >
      {options.map((option, index) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            role="tab"
            aria-selected={isSelected}
            aria-controls={`tabpanel-${option.value}`}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
              isSelected
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
