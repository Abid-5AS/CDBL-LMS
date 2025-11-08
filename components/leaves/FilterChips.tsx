"use client";

import clsx from "clsx";

type FilterOption = {
  value: string;
  label: string;
};

type FilterChipsProps = {
  options: FilterOption[];
  selectedValue: string;
  onChange: (value: string) => void;
};

export function FilterChips({
  options,
  selectedValue,
  onChange,
}: FilterChipsProps) {
  return (
    <div
      className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide"
      data-filter-chips
    >
      // ARCHIVED: Use FilterChips from components/filters instead. Original
      code below for reference. //{" "}
      {options.map((option) => {
        const isSelected = selectedValue === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={clsx(
              "relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ease-out whitespace-nowrap",
              "focus:outline-none focus:ring-2 focus:ring-card-action focus:ring-offset-2",
              "hover:scale-105",
              isSelected
                ? "bg-card-action text-text-inverted shadow-sm"
                : "bg-bg-primary border border-border-strong text-text-secondary hover:border-border-strong"
            )}
            aria-current={isSelected ? "page" : undefined}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
