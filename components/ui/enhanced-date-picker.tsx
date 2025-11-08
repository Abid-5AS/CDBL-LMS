"use client";

import * as React from "react";
import {
  format,
  isWeekend,
  isSameDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Badge } from "./badge";

export interface Holiday {
  date: Date;
  name: string;
  type?: "public" | "company" | "religious";
}

interface EnhancedDatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  holidays?: Holiday[];
  minDate?: Date;
  maxDate?: Date;
  disableWeekends?: boolean;
  showHolidayNames?: boolean;
  className?: string;
  error?: string;
  helperText?: string;
  label?: string;
  required?: boolean;
}

const dayVariants = {
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};

const holidayTypeColors = {
  public:
    "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  company:
    "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  religious:
    "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
};

export function EnhancedDatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  holidays = [],
  minDate,
  maxDate,
  disableWeekends = false,
  showHolidayNames = true,
  className,
  error,
  helperText,
  label,
  required = false,
}: EnhancedDatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentMonth, setCurrentMonth] = React.useState(value || new Date());
  const [hoveredDate, setHoveredDate] = React.useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get holidays for current month
  const monthHolidays = holidays.filter((holiday) =>
    isSameMonth(holiday.date, currentMonth)
  );

  const isHoliday = (date: Date) => {
    return holidays.some((holiday) => isSameDay(holiday.date, date));
  };

  const getHoliday = (date: Date) => {
    return holidays.find((holiday) => isSameDay(holiday.date, date));
  };

  const isDisabledDate = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    if (disableWeekends && isWeekend(date)) return true;
    return false;
  };

  const getDayClassName = (date: Date) => {
    const baseClasses =
      "relative w-9 h-9 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center";
    const isSelected = value && isSameDay(date, value);
    const isCurrentDay = isToday(date);
    const isHolidayDay = isHoliday(date);
    const isDisabled = isDisabledDate(date);
    const isWeekendDay = isWeekend(date);

    return cn(baseClasses, {
      // Selected state
      "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20":
        isSelected,

      // Today
      "ring-2 ring-primary/30": isCurrentDay && !isSelected,

      // Holiday
      "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800":
        isHolidayDay && !isSelected,

      // Weekend
      "text-muted-foreground": isWeekendDay && !isHolidayDay && !isSelected,

      // Disabled
      "opacity-50 cursor-not-allowed": isDisabled,

      // Hover (only if not disabled or selected)
      "hover:bg-accent hover:text-accent-foreground cursor-pointer":
        !isDisabled && !isSelected,

      // Default
      "hover:bg-muted text-foreground":
        !isSelected && !isHolidayDay && !isWeekendDay && !isDisabled,
    });
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      if (direction === "prev") {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const handleDateSelect = (date: Date) => {
    if (isDisabledDate(date)) return;
    onChange(date);
    setIsOpen(false);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              error && "border-destructive focus:ring-destructive"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "PPP") : placeholder}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("prev")}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <h3 className="text-sm font-semibold">
                {format(currentMonth, "MMMM yyyy")}
              </h3>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("next")}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {/* Day headers */}
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div
                  key={day}
                  className="h-9 flex items-center justify-center text-xs font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {monthDays.map((date) => {
                const holiday = getHoliday(date);

                return (
                  <motion.button
                    key={date.toISOString()}
                    variants={dayVariants}
                    whileHover="hover"
                    whileTap="tap"
                    className={getDayClassName(date)}
                    onClick={() => handleDateSelect(date)}
                    onMouseEnter={() => setHoveredDate(date)}
                    onMouseLeave={() => setHoveredDate(null)}
                    disabled={isDisabledDate(date)}
                    title={holiday ? holiday.name : undefined}
                  >
                    {format(date, "d")}

                    {/* Holiday indicator */}
                    {holiday && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Holiday List for Current Month */}
            {showHolidayNames && monthHolidays.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Holidays this month
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {monthHolidays.map((holiday, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-foreground">{holiday.name}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs px-1.5 py-0.5",
                          holiday.type
                            ? holidayTypeColors[holiday.type]
                            : holidayTypeColors.public
                        )}
                      >
                        {format(holiday.date, "MMM d")}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hovered Date Info */}
            <AnimatePresence>
              {hoveredDate && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="border-t pt-4 mt-4"
                >
                  <div className="text-xs text-muted-foreground">
                    {format(hoveredDate, "EEEE, MMMM d, yyyy")}
                    {isWeekend(hoveredDate) && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Weekend
                      </Badge>
                    )}
                    {getHoliday(hoveredDate) && (
                      <Badge variant="destructive" className="ml-2 text-xs">
                        Holiday
                      </Badge>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </PopoverContent>
      </Popover>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-1 text-sm text-destructive">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}
