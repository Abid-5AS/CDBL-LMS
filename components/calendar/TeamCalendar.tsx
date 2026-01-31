"use client";

import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, isSameDay } from "date-fns";
import { useTranslation } from "@/hooks/useTranslation";

interface LeaveEvent {
    id: number;
    employeeName: string;
    leaveType: string;
    startDate: Date;
    endDate: Date;
    status: string;
}

interface TeamCalendarProps {
    events: LeaveEvent[];
    className?: string;
}

export function TeamCalendar({ events, className }: TeamCalendarProps) {
    const { t } = useTranslation("dashboard");
    const [month, setMonth] = useState<Date>(new Date());

    const getEventsForDay = (day: Date) => {
        return events.filter((event) => {
            const start = new Date(event.startDate);
            const end = new Date(event.endDate);
            return day >= start && day <= end;
        });
    };

    const modifiers = {
        hasEvent: (date: Date) => getEventsForDay(date).length > 0,
    };

    const modifiersStyles = {
        hasEvent: {
            fontWeight: "bold",
        },
    };

    return (
        <Card className={cn("w-full", className)}>
            <CardHeader>
                <CardTitle>{t("teamCalendar")}</CardTitle>
            </CardHeader>
            <CardContent>
                <DayPicker
                    mode="single"
                    month={month}
                    onMonthChange={setMonth}
                    modifiers={modifiers}
                    modifiersStyles={modifiersStyles}
                    // @ts-ignore
                    components={{
                        DayContent: (props: any) => {
                            const { date } = props;
                            const dayEvents = getEventsForDay(date);

                            return (
                                <div className="relative w-full h-full flex items-center justify-center">
                                    <span>{format(date, "d")}</span>
                                    {dayEvents.length > 0 && (
                                        <div className="absolute bottom-1 flex gap-0.5">
                                            {dayEvents.slice(0, 3).map((_, i) => (
                                                <div key={i} className="w-1 h-1 rounded-full bg-primary" />
                                            ))}
                                        </div>
                                    )}
                                    {dayEvents.length > 0 && (
                                        <HoverCard>
                                            <HoverCardTrigger asChild>
                                                <button className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                            </HoverCardTrigger>
                                            <HoverCardContent className="w-64 p-3">
                                                <div className="space-y-2">
                                                    <h4 className="text-sm font-semibold">{format(date, "MMMM d, yyyy")}</h4>
                                                    <div className="space-y-1">
                                                        {dayEvents.map((event) => (
                                                            <div key={event.id} className="flex justify-between items-center text-xs">
                                                                <span className="font-medium">{event.employeeName}</span>
                                                                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                                                                    {event.leaveType}
                                                                </Badge>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </HoverCardContent>
                                        </HoverCard>
                                    )}
                                </div>
                            );
                        },
                    }}
                    className="w-full"
                    classNames={{
                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                        month: "space-y-4 w-full",
                        caption: "flex justify-center pt-1 relative items-center",
                        caption_label: "text-sm font-medium",
                        nav: "space-x-1 flex items-center",
                        nav_button: cn(
                            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                        ),
                        nav_button_previous: "absolute left-1",
                        nav_button_next: "absolute right-1",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex",
                        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                        row: "flex w-full mt-2",
                        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        day: cn(
                            "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
                        ),
                        day_range_end: "day-range-end",
                        day_selected:
                            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                        day_today: "bg-accent text-accent-foreground",
                        day_outside:
                            "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                        day_disabled: "text-muted-foreground opacity-50",
                        day_range_middle:
                            "aria-selected:bg-accent aria-selected:text-accent-foreground",
                        day_hidden: "invisible",
                    }}
                />
            </CardContent>
        </Card>
    );
}
