"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FilterChipOption = {
  value: string;
  label: string;
};

type FilterChipsProps = {
  options: FilterChipOption[];
  selected: Set<string>;
  onChange: (value: string) => void;
  allowMultiple?: boolean;
  className?: string;
};

export function FilterChips({ options, selected, onChange, allowMultiple = true, className }: FilterChipsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const isSelected = selected.has(option.value);
        return (
          <Button
            key={option.value}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(option.value)}
            className={cn(
              "h-8 rounded-full text-xs font-medium transition-all",
              isSelected
                ? "bg-info dark:bg-info/80 hover:bg-info dark:bg-info/80 text-white dark:text-white border-info shadow-sm"
                : "bg-card dark:bg-card/90 hover:bg-muted dark:bg-muted/80 text-muted-foreground dark:text-muted-foreground/80 border-border dark:border-border/50"
            )}
          >
            {option.label}
          </Button>
        );
      })}
      {selected.size > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            selected.forEach((value) => onChange(value));
          }}
          className="h-8 rounded-full text-xs text-muted-foreground hover:text-muted-foreground dark:text-muted-foreground/80"
        >
          <X className="h-3 w-3 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}

