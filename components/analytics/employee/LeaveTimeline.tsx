"use client";

import * as React from "react";
import { format, differenceInDays, addDays, isSameDay } from "date-fns";
import { Info } from "lucide-react";

import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface TimelineEvent {
    id: number;
    startDate: string;
    endDate: string;
    type: string;
    status: string;
    reason?: string;
}

interface LeaveTimelineProps {
    events: TimelineEvent[];
    className?: string;
}

const TYPE_COLORS: Record<string, string> = {
    EARNED: "bg-emerald-500",
    CASUAL: "bg-blue-500",
    MEDICAL: "bg-red-500",
    MATERNITY: "bg-pink-500",
    PATERNITY: "bg-indigo-500",
    DEFAULT: "bg-gray-500",
};

export function LeaveTimeline({ events, className }: LeaveTimelineProps) {
    // Sort events by date
    const sortedEvents = [...events].sort((a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    if (sortedEvents.length === 0) {
        return (
            <GlassCard className={className}>
                <GlassCardHeader>
                    <GlassCardTitle>Leave Timeline</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                    <div className="flex h-[150px] items-center justify-center text-muted-foreground">
                        No leave history available
                    </div>
                </GlassCardContent>
            </GlassCard>
        );
    }

    const startDate = new Date(new Date().getFullYear(), 0, 1); // Jan 1st
    const endDate = new Date(new Date().getFullYear(), 11, 31); // Dec 31st
    const totalDays = differenceInDays(endDate, startDate) + 1;

    // Generate months for header
    const months = [];
    let currentMonth = new Date(startDate);
    while (currentMonth <= endDate) {
        months.push(new Date(currentMonth));
        currentMonth.setMonth(currentMonth.getMonth() + 1);
    }

    return (
        <GlassCard className={className}>
            <GlassCardHeader>
                <div className="flex items-center justify-between">
                    <GlassCardTitle>Leave Timeline (Current Year)</GlassCardTitle>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {Object.entries(TYPE_COLORS).slice(0, 3).map(([type, color]) => (
                            <div key={type} className="flex items-center gap-1">
                                <div className={cn("h-2 w-2 rounded-full", color)} />
                                <span>{type}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </GlassCardHeader>
            <GlassCardContent>
                <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                    <div className="relative min-w-[800px] p-4">
                        {/* Month Header */}
                        <div className="mb-4 flex border-b pb-2">
                            {months.map((month) => (
                                <div key={month.toString()} className="flex-1 text-center text-sm font-medium text-muted-foreground">
                                    {format(month, "MMM")}
                                </div>
                            ))}
                        </div>

                        {/* Timeline Track */}
                        <div className="relative h-12 rounded-full bg-muted/30">
                            {sortedEvents.map((event) => {
                                const eventStart = new Date(event.startDate);
                                const eventEnd = new Date(event.endDate);

                                // Calculate position and width percentages
                                // Clamp dates to current year view
                                const effectiveStart = eventStart < startDate ? startDate : eventStart;
                                const effectiveEnd = eventEnd > endDate ? endDate : eventEnd;

                                if (effectiveStart > endDate || effectiveEnd < startDate) return null;

                                const startOffset = differenceInDays(effectiveStart, startDate);
                                const duration = differenceInDays(effectiveEnd, effectiveStart) + 1;

                                const left = (startOffset / totalDays) * 100;
                                const width = (duration / totalDays) * 100;

                                const color = TYPE_COLORS[event.type] || TYPE_COLORS.DEFAULT;

                                return (
                                    <TooltipProvider key={event.id}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div
                                                    className={cn(
                                                        "absolute top-1/2 h-6 -translate-y-1/2 rounded-md transition-all hover:h-8 hover:z-10 cursor-pointer",
                                                        color
                                                    )}
                                                    style={{
                                                        left: `${left}%`,
                                                        width: `${Math.max(width, 0.5)}%`, // Min width for visibility
                                                    }}
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <div className="text-xs">
                                                    <p className="font-semibold">{event.type}</p>
                                                    <p>{format(eventStart, "MMM d")} - {format(eventEnd, "MMM d")}</p>
                                                    <p className="text-muted-foreground">{event.reason}</p>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                );
                            })}
                        </div>
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </GlassCardContent>
        </GlassCard>
    );
}
