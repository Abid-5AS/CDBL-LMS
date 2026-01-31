"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users } from "lucide-react";
import { format, startOfWeek, addDays } from "date-fns";

interface DailyCapacity {
    date: Date;
    capacityPercentage: number;
    absentCount: number;
    totalStrength: number;
}

interface CapacityWidgetProps {
    data: DailyCapacity[];
}

export function CapacityWidget({ data }: CapacityWidgetProps) {
    const today = new Date();
    const currentCapacity = data.find((d) =>
        format(d.date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")
    );

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    Team Capacity (Today)
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {currentCapacity ? `${currentCapacity.capacityPercentage}%` : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">
                    {currentCapacity
                        ? `${currentCapacity.absentCount} absent out of ${currentCapacity.totalStrength}`
                        : "No data available"}
                </p>

                <div className="mt-4 space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground">This Week</h4>
                    {data.slice(0, 5).map((day, i) => (
                        <div key={i} className="space-y-1">
                            <div className="flex justify-between text-xs">
                                <span>{format(day.date, "EEE")}</span>
                                <span className={day.capacityPercentage < 80 ? "text-destructive" : ""}>
                                    {day.capacityPercentage}%
                                </span>
                            </div>
                            <Progress
                                value={day.capacityPercentage}
                                className="h-1.5"
                                indicatorClassName={day.capacityPercentage < 80 ? "bg-destructive" : ""}
                            />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
