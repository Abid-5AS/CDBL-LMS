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

export function FilterChips({ options, selectedValue, onChange }: FilterChipsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide" data-filter-chips>
      {options.map((option) => {
        const isSelected = selectedValue === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={clsx(
              "relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ease-out whitespace-nowrap",
              "focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2",
              "hover:scale-105",
              isSelected
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-700 hover:border-gray-300"
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

