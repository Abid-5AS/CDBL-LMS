"use client";

import { motion } from "framer-motion";
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
      className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-hide"
      data-filter-chips
    >
      {options.map((option) => {
        const isSelected = selectedValue === option.value;
        return (
          <motion.button
            key={option.value}
            onClick={() => onChange(option.value)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={clsx(
              "relative px-5 py-2.5 text-sm font-semibold rounded-xl",
              "transition-all duration-200 ease-out whitespace-nowrap",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(91,94,252)] focus-visible:ring-offset-2",
              isSelected
                ? "bg-gradient-to-br from-[rgb(91,94,252)] to-[rgb(71,74,232)] text-white shadow-[0_4px_12px_rgba(91,94,252,0.3)]"
                : "bg-[var(--color-card-elevated)] border border-[var(--shell-card-border)] text-[var(--color-text-secondary)] hover:border-[rgb(91,94,252)]/30 hover:bg-[rgba(91,94,252,0.04)]"
            )}
            role="tab"
            aria-selected={isSelected}
            aria-current={isSelected ? "page" : undefined}
          >
            {option.label}
          </motion.button>
        );
      })}
    </div>
  );
}
