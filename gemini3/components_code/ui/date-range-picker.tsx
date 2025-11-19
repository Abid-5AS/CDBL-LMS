"use client";

import * as React from "react";
import {
  format,
  isAfter,
  isBefore,
  isSameDay,
  startOfDay,
  endOfDay,
  addDays,
  subDays,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Calendar } from "./calendar";
import { Badge } from "./badge";

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  presets?: DateRangePreset[];
  showPresets?: boolean;
  showClear?: boolean;
  className?: string;
  error?: string;
  required?: boolean;

  // Formatting
  formatStr?: string;

  // Validation
  maxDays?: number;
  minDays?: number;

  // Callbacks
  onFocus?: () => void;
  onBlur?: () => void;
}

export interface DateRangePreset {
  label: string;
  value: DateRange;
  description?: string;
}

const defaultPresets: DateRangePreset[] = [
  {
    label: "Today",
    value: { from: new Date(), to: new Date() },
  },
  {
    label: "Yesterday",
    value: { from: subDays(new Date(), 1), to: subDays(new Date(), 1) },
  },
  {
    label: "Last 7 days",
    value: { from: subDays(new Date(), 6), to: new Date() },
  },
  {
    label: "Last 30 days",
    value: { from: subDays(new Date(), 29), to: new Date() },
  },
  {
    label: "This month",
    value: {
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      to: new Date(),
    },
  },
  {
    label: "Last month",
    value: {
      from: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
      to: new Date(new Date().getFullYear(), new Date().getMonth(), 0),
    },
  },
];

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Select date range",
  disabled = false,
  minDate,
  maxDate,
  presets = defaultPresets,
  showPresets = true,
  showClear = true,
  className,
  error,
  required = false,
  formatStr = "MMM dd, yyyy",
  maxDays,
  minDays,
  onFocus,
  onBlur,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [tempRange, setTempRange] = React.useState<DateRange | undefined>(
    value
  );
  const [selectingEnd, setSelectingEnd] = React.useState(false);

  // Update temp range when value changes
  React.useEffect(() => {
    setTempRange(value);
  }, [value]);

  // Format display value
  const displayValue = React.useMemo(() => {
    if (!value?.from) return placeholder;

    if (value.from && !value.to) {
      return format(value.from, formatStr);
    }

    if (value.from && value.to) {
      if (isSameDay(value.from, value.to)) {
        return format(value.from, formatStr);
      }
      return `${format(value.from, formatStr)} - ${format(
        value.to,
        formatStr
      )}`;
    }

    return placeholder;
  }, [value, placeholder, formatStr]);

  // Validate date range
  const validateRange = React.useCallback(
    (range: DateRange): string | null => {
      if (!range.from || !range.to) return null;

      if (isAfter(range.from, range.to)) {
        return "Start date must be before end date";
      }

      if (minDate && isBefore(range.from, minDate)) {
        return `Start date must be after ${format(minDate, formatStr)}`;
      }

      if (maxDate && isAfter(range.to, maxDate)) {
        return `End date must be before ${format(maxDate, formatStr)}`;
      }

      if (minDays) {
        const daysDiff =
          Math.ceil(
            (range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)
          ) + 1;
        if (daysDiff < minDays) {
          return `Range must be at least ${minDays} days`;
        }
      }

      if (maxDays) {
        const daysDiff =
          Math.ceil(
            (range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)
          ) + 1;
        if (daysDiff > maxDays) {
          return `Range cannot exceed ${maxDays} days`;
        }
      }

      return null;
    },
    [minDate, maxDate, minDays, maxDays, formatStr]
  );

  // Handle date selection
  const handleDateSelect = React.useCallback(
    (date: Date | undefined) => {
      if (!date) return;

      if (!tempRange?.from || selectingEnd) {
        // Selecting start date or end date
        if (!tempRange?.from) {
          setTempRange({ from: date, to: undefined });
          setSelectingEnd(true);
        } else {
          const newRange = { from: tempRange.from, to: date };

          // Ensure from is before to
          if (isAfter(newRange.from, newRange.to)) {
            newRange.from = date;
            newRange.to = tempRange.from;
          }

          const validationError = validateRange(newRange);
          if (!validationError) {
            setTempRange(newRange);
            onChange(newRange);
            setOpen(false);
            setSelectingEnd(false);
          }
        }
      } else {
        // Selecting end date
        const newRange = { from: tempRange.from, to: date };

        // Ensure from is before to
        if (isAfter(newRange.from, newRange.to)) {
          newRange.from = date;
          newRange.to = tempRange.from;
        }

        const validationError = validateRange(newRange);
        if (!validationError) {
          setTempRange(newRange);
          onChange(newRange);
          setOpen(false);
          setSelectingEnd(false);
        }
      }
    },
    [tempRange, selectingEnd, validateRange, onChange]
  );

  // Handle preset selection
  const handlePresetSelect = React.useCallback(
    (preset: DateRangePreset) => {
      const validationError = validateRange(preset.value);
      if (!validationError) {
        setTempRange(preset.value);
        onChange(preset.value);
        setOpen(false);
        setSelectingEnd(false);
      }
    },
    [validateRange, onChange]
  );

  // Handle clear
  const handleClear = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setTempRange(undefined);
      onChange(undefined);
      setSelectingEnd(false);
    },
    [onChange]
  );

  // Handle apply (for manual confirmation)
  const handleApply = React.useCallback(() => {
    if (tempRange) {
      const validationError = validateRange(tempRange);
      if (!validationError) {
        onChange(tempRange);
        setOpen(false);
        setSelectingEnd(false);
      }
    }
  }, [tempRange, validateRange, onChange]);

  // Handle cancel
  const handleCancel = React.useCallback(() => {
    setTempRange(value);
    setOpen(false);
    setSelectingEnd(false);
  }, [value]);

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value?.from && "text-muted-foreground",
              error && "border-destructive focus:ring-destructive",
              disabled && "cursor-not-allowed opacity-50"
            )}
            disabled={disabled}
            onFocus={onFocus}
            onBlur={onBlur}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span className="flex-1 truncate">{displayValue}</span>

            {showClear && value?.from && (
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent ml-2"
                onClick={handleClear}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* Presets */}
            {showPresets && presets.length > 0 && (
              <div className="border-r p-3 space-y-1 min-w-[200px]">
                <h4 className="font-medium text-sm mb-2">Quick Select</h4>
                {presets.map((preset, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-auto p-2 font-normal"
                      onClick={() => handlePresetSelect(preset)}
                    >
                      <div className="text-left">
                        <div className="font-medium">{preset.label}</div>
                        {preset.description && (
                          <div className="text-xs text-muted-foreground">
                            {preset.description}
                          </div>
                        )}
                      </div>
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Calendar */}
            <div className="p-3">
              <Calendar
                mode="range"
                selected={tempRange}
                onSelect={(range) => {
                  if (range?.from) {
                    handleDateSelect(range.from);
                  }
                  if (range?.to) {
                    handleDateSelect(range.to);
                  }
                }}
                disabled={(date) => {
                  if (minDate && isBefore(date, minDate)) return true;
                  if (maxDate && isAfter(date, maxDate)) return true;
                  return false;
                }}
                numberOfMonths={2}
                className="rounded-md"
              />

              {/* Status */}
              <div className="mt-3 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
                {!tempRange?.from && "Select start date"}
                {tempRange?.from && !tempRange?.to && "Select end date"}
                {tempRange?.from && tempRange?.to && (
                  <div className="flex items-center justify-between">
                    <span>
                      {Math.ceil(
                        (tempRange.to.getTime() - tempRange.from.getTime()) /
                          (1000 * 60 * 60 * 24)
                      ) + 1}{" "}
                      days selected
                    </span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancel}
                      >
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleApply}>
                        Apply
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Error Message */}
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}

// Hook for managing date range state
export function useDateRange(initialRange?: DateRange) {
  const [range, setRange] = React.useState<DateRange | undefined>(initialRange);
  const [error, setError] = React.useState<string | null>(null);

  const updateRange = React.useCallback((newRange: DateRange | undefined) => {
    setRange(newRange);
    setError(null);
  }, []);

  const clearRange = React.useCallback(() => {
    setRange(undefined);
    setError(null);
  }, []);

  const validateRange = React.useCallback(
    (
      range: DateRange | undefined,
      options: {
        required?: boolean;
        minDays?: number;
        maxDays?: number;
        minDate?: Date;
        maxDate?: Date;
      } = {}
    ): boolean => {
      if (options.required && (!range?.from || !range?.to)) {
        setError("Date range is required");
        return false;
      }

      if (!range?.from || !range?.to) {
        setError(null);
        return true;
      }

      if (isAfter(range.from, range.to)) {
        setError("Start date must be before end date");
        return false;
      }

      if (options.minDate && isBefore(range.from, options.minDate)) {
        setError(
          `Start date must be after ${format(options.minDate, "MMM dd, yyyy")}`
        );
        return false;
      }

      if (options.maxDate && isAfter(range.to, options.maxDate)) {
        setError(
          `End date must be before ${format(options.maxDate, "MMM dd, yyyy")}`
        );
        return false;
      }

      const daysDiff =
        Math.ceil(
          (range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;

      if (options.minDays && daysDiff < options.minDays) {
        setError(`Range must be at least ${options.minDays} days`);
        return false;
      }

      if (options.maxDays && daysDiff > options.maxDays) {
        setError(`Range cannot exceed ${options.maxDays} days`);
        return false;
      }

      setError(null);
      return true;
    },
    []
  );

  const getDuration = React.useCallback(() => {
    if (!range?.from || !range?.to) return 0;
    return (
      Math.ceil(
        (range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1
    );
  }, [range]);

  const isValid = React.useMemo(() => {
    return !error && range?.from && range?.to;
  }, [error, range]);

  return {
    range,
    error,
    isValid,
    updateRange,
    clearRange,
    validateRange,
    getDuration,
    setError,
  };
}

// Utility functions for common date range operations
export const dateRangeUtils = {
  // Create preset ranges
  createPreset: (
    label: string,
    from: Date,
    to: Date,
    description?: string
  ): DateRangePreset => ({
    label,
    value: { from, to },
    description,
  }),

  // Get relative date ranges
  getLastDays: (days: number): DateRange => ({
    from: subDays(new Date(), days - 1),
    to: new Date(),
  }),

  getNextDays: (days: number): DateRange => ({
    from: new Date(),
    to: addDays(new Date(), days - 1),
  }),

  // Format range for display
  formatRange: (
    range: DateRange | undefined,
    formatStr = "MMM dd, yyyy"
  ): string => {
    if (!range?.from) return "";

    if (range.from && !range.to) {
      return format(range.from, formatStr);
    }

    if (range.from && range.to) {
      if (isSameDay(range.from, range.to)) {
        return format(range.from, formatStr);
      }
      return `${format(range.from, formatStr)} - ${format(
        range.to,
        formatStr
      )}`;
    }

    return "";
  },

  // Check if ranges overlap
  rangesOverlap: (range1: DateRange, range2: DateRange): boolean => {
    if (!range1.from || !range1.to || !range2.from || !range2.to) return false;

    return isBefore(range1.from, range2.to) && isAfter(range1.to, range2.from);
  },

  // Get range duration in days
  getRangeDuration: (range: DateRange | undefined): number => {
    if (!range?.from || !range?.to) return 0;
    return (
      Math.ceil(
        (range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1
    );
  },
};
