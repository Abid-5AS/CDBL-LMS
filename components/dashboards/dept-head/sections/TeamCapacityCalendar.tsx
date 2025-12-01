"use client";

import { useEffect, useState } from "react";
import { Calendar, AlertTriangle, Users, Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui";
import type { TeamCapacityAnalysis } from "@/lib/services/team-capacity.service";

type TeamCapacityCalendarProps = {
  department?: string;
  daysAhead?: number;
};

export function TeamCapacityCalendar({
  department,
  daysAhead = 30,
}: TeamCapacityCalendarProps) {
  const [capacityData, setCapacityData] = useState<TeamCapacityAnalysis | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCapacity = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          daysAhead: daysAhead.toString(),
        });
        if (department) {
          params.append("department", department);
        }

        const response = await fetch(`/api/team/capacity?${params}`);
        if (response.ok) {
          const data = await response.json();
          setCapacityData(data);
        }
      } catch (error) {
        console.error("Error fetching team capacity:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCapacity();
  }, [department, daysAhead]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Capacity Calendar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!capacityData) {
    return null;
  }

  // Filter to show only days with capacity concerns or leaves
  const daysWithActivity = capacityData.dailyCapacity.filter(
    (day) => day.onLeaveCount > 0 || day.capacityPercent < 80
  );

  // Group critical days
  const criticalDays = capacityData.dailyCapacity.filter(
    (day) => day.capacityPercent < 50
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Team Capacity Calendar
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Learn about team capacity"
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground"
                >
                  <Info className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="text-sm">
                  Shows your team's capacity over the next {daysAhead} days.
                  Days below 50% capacity are highlighted as critical.
                </p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Team Size</p>
            <p className="text-lg font-semibold">{capacityData.teamSize}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">On Leave Today</p>
            <p className="text-lg font-semibold text-orange-600">
              {capacityData.dailyCapacity[0]?.onLeaveCount || 0}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Capacity</p>
            <p className="text-lg font-semibold text-green-600">
              {capacityData.dailyCapacity[0]?.capacityPercent.toFixed(0) || 100}
              %
            </p>
          </div>
        </div>

        {/* Critical Days Warning */}
        {criticalDays.length > 0 && (
          <div className="p-3 rounded bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1 flex-1">
                <p className="text-xs font-medium text-red-900 dark:text-red-100">
                  {criticalDays.length} Critical Day
                  {criticalDays.length !== 1 ? "s" : ""} Ahead
                </p>
                <p className="text-xs text-red-700 dark:text-red-300">
                  Team capacity will drop below 50% on these days. Consider
                  staggering leave approvals.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Days with Activity */}
        {daysWithActivity.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Next {Math.min(10, daysWithActivity.length)} Days
            </p>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {daysWithActivity.slice(0, 10).map((day, idx) => {
                const isCritical = day.capacityPercent < 50;
                const isLow = day.capacityPercent < 80 && day.capacityPercent >= 50;

                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2 rounded border ${
                      isCritical
                        ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                        : isLow
                        ? "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800"
                        : "bg-muted/30 border-border"
                    }`}
                  >
                    <div className="flex-1">
                      <p className="text-xs font-medium">
                        {new Date(day.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {day.onLeaveCount} on leave
                        </span>
                        {day.onLeave.length > 0 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="text-xs text-blue-600 hover:underline"
                              >
                                View
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs">
                              <p className="text-sm font-medium mb-1">
                                Team members on leave:
                              </p>
                              <ul className="text-xs space-y-1">
                                {day.onLeave.slice(0, 5).map((person, i) => (
                                  <li key={i}>
                                    {person.name} ({person.type})
                                  </li>
                                ))}
                                {day.onLeave.length > 5 && (
                                  <li className="text-muted-foreground">
                                    +{day.onLeave.length - 5} more
                                  </li>
                                )}
                              </ul>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          isCritical
                            ? "destructive"
                            : isLow
                            ? "warning"
                            : "secondary"
                        }
                      >
                        {day.capacityPercent.toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Full team capacity for the next {daysAhead} days</p>
          </div>
        )}

        {/* Recommendations */}
        {capacityData.recommendations.length > 0 && (
          <div className="space-y-1 p-3 rounded bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
              Recommendations
            </p>
            {capacityData.recommendations.slice(0, 2).map((rec, idx) => (
              <p
                key={idx}
                className="text-xs text-blue-700 dark:text-blue-300"
              >
                • {rec}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
