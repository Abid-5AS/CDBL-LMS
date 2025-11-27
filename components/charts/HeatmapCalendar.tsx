"use client";

import * as React from "react";
import { ResponsiveContainer, Tooltip, TooltipProps } from "recharts";
import { format, getDaysInMonth, startOfMonth, addMonths, subMonths, getDay, startOfWeek, addDays, isSameMonth, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";

export interface HeatmapDataPoint {
    date: string; // ISO date string YYYY-MM-DD
    value: number; // Intensity value (e.g., number of leaves)
    details?: any[]; // Array of details (e.g., employees on leave)
}

interface HeatmapCalendarProps {
    data: HeatmapDataPoint[];
    title?: string;
    description?: string;
    className?: string;
    isLoading?: boolean;
    onDateClick?: (date: string, data: HeatmapDataPoint | undefined) => void;
}

const INTENSITY_COLORS = {
    0: "bg-muted/20", // No data
    1: "bg-emerald-100 dark:bg-emerald-900/30", // Low
    2: "bg-emerald-300 dark:bg-emerald-700/50", // Medium
    3: "bg-emerald-500 dark:bg-emerald-600", // High
    4: "bg-emerald-700 dark:bg-emerald-500", // Very High
};

const getIntensity = (value: number): keyof typeof INTENSITY_COLORS => {
    if (value === 0) return 0;
    if (value <= 2) return 1;
    if (value <= 5) return 2;
    if (value <= 10) return 3;
    return 4;
};

export function HeatmapCalendar({
    data,
    title = "Leave Density",
    description,
    className,
    isLoading = false,
    onDateClick,
}: HeatmapCalendarProps) {
    const [currentMonth, setCurrentMonth] = React.useState(new Date());

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const monthStart = startOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const daysInMonth = getDaysInMonth(currentMonth);

    // Generate calendar grid
    const calendarDays = [];
    let day = startDate;

    // Create 6 weeks grid to cover all possible month layouts
    for (let i = 0; i < 42; i++) {
        calendarDays.push(day);
        day = addDays(day, 1);
    }

    const getDataForDate = (date: Date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        return data.find((d) => d.date === dateStr);
    };

    if (isLoading) {
        return (
            <GlassCard className={className}>
                <GlassCardHeader>
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                </GlassCardHeader>
                <GlassCardContent>
                    <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: 35 }).map((_, i) => (
                            <Skeleton key={i} className="aspect-square w-full rounded-md" />
                        ))}
                    </div>
                </GlassCardContent>
            </GlassCard>
        );
    }

    return (
        <GlassCard className={className}>
            <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="space-y-1">
                    <GlassCardTitle>{title}</GlassCardTitle>
                    {description && (
                        <p className="text-sm text-muted-foreground">{description}</p>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="icon" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="font-semibold min-w-[100px] text-center">
                        {format(currentMonth, "MMMM yyyy")}
                    </div>
                    <Button variant="outline" size="icon" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </GlassCardHeader>
            <GlassCardContent>
                <div className="grid grid-cols-7 gap-2 mb-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                        <div
                            key={day}
                            className="text-center text-xs font-medium text-muted-foreground"
                        >
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((date, i) => {
                        const dateData = getDataForDate(date);
                        const intensity = dateData ? getIntensity(dateData.value) : 0;
                        const isCurrentMonth = isSameMonth(date, currentMonth);
                        const isToday = isSameDay(date, new Date());

                        return (
                            <div
                                key={i}
                                className={cn(
                                    "aspect-square w-full rounded-md border p-1 transition-all hover:scale-105 cursor-pointer relative group",
                                    INTENSITY_COLORS[intensity],
                                    !isCurrentMonth && "opacity-30",
                                    isToday && "ring-2 ring-primary ring-offset-2"
                                )}
                                onClick={() => onDateClick?.(format(date, "yyyy-MM-dd"), dateData)}
                            >
                                <span className="text-xs font-medium text-foreground/80">
                                    {format(date, "d")}
                                </span>

                                {/* Tooltip with glass effect */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-max max-w-[200px]">
                                    <div className="bg-card/80 backdrop-blur-xl text-foreground text-xs rounded-xl border border-border/50 shadow-lg p-3">
                                        <div className="font-semibold mb-1">{format(date, "MMM d, yyyy")}</div>
                                        {dateData ? (
                                            <div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-muted-foreground">Leaves:</span>
                                                    <span className="font-semibold">{dateData.value}</span>
                                                </div>
                                                {dateData.details && dateData.details.length > 0 && (
                                                    <div className="mt-2 pt-2 border-t border-border/50 text-[10px] space-y-1">
                                                        {dateData.details.slice(0, 3).map((d: any, idx) => (
                                                            <div key={idx} className="flex items-center gap-1">
                                                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                                                <span>{d.name || d.requester?.name}</span>
                                                            </div>
                                                        ))}
                                                        {dateData.details.length > 3 && (
                                                            <div className="text-muted-foreground italic">
                                                                +{dateData.details.length - 3} more
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-muted-foreground">No leaves scheduled</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="mt-6 flex items-center justify-end space-x-2 text-xs text-muted-foreground">
                    <span>Less</span>
                    {[0, 1, 2, 3, 4].map((level) => (
                        <div
                            key={level}
                            className={cn(
                                "h-3 w-3 rounded-sm",
                                INTENSITY_COLORS[level as keyof typeof INTENSITY_COLORS]
                            )}
                        />
                    ))}
                    <span>More</span>
                </div>
            </GlassCardContent>
        </GlassCard>
    );
}
