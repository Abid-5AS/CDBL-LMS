"use client";

import React from "react";
import { AlertTriangle, Users, Calendar, TrendingDown, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface TeamMemberOnLeave {
  id: number;
  name: string;
  department: string | null;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  workingDays: number;
}

export interface ConflictWarningData {
  hasConflict: boolean;
  teamOnLeave: TeamMemberOnLeave[];
  totalTeamSize: number;
  availableMembers: number;
  capacityPercentage: number;
  severity: "low" | "medium" | "high" | "critical";
  suggestedAlternativeDates?: {
    startDate: Date;
    endDate: Date;
    capacity: number;
  }[];
  warningMessage?: string;
  blockSubmission: boolean;
}

interface ConflictWarningCardProps {
  data: ConflictWarningData;
  onSelectAlternativeDate?: (startDate: Date, endDate: Date) => void;
  className?: string;
}

const severityConfig = {
  low: {
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    borderColor: "border-green-200 dark:border-green-800",
    icon: Info,
    label: "Good Capacity",
  },
  medium: {
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    icon: AlertTriangle,
    label: "Moderate Capacity",
  },
  high: {
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-200 dark:border-orange-800",
    icon: AlertTriangle,
    label: "Low Capacity",
  },
  critical: {
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/20",
    borderColor: "border-red-200 dark:border-red-800",
    icon: AlertTriangle,
    label: "Critical Capacity",
  },
};

export function ConflictWarningCard({
  data,
  onSelectAlternativeDate,
  className,
}: ConflictWarningCardProps) {
  const config = severityConfig[data.severity];
  const Icon = config.icon;

  // Don't show if no conflict and good capacity
  if (!data.hasConflict && data.severity === "low") {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className={className}
      >
        <Alert
          className={cn(
            config.bgColor,
            config.borderColor,
            "border-l-4"
          )}
        >
          <Icon className={cn("h-5 w-5", config.color)} />
          <AlertTitle className={cn("font-semibold", config.color)}>
            Team Capacity: {data.capacityPercentage}%
            <Badge variant="secondary" className="ml-2">
              {config.label}
            </Badge>
          </AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            {/* Warning Message */}
            {data.warningMessage && (
              <p className="text-sm text-foreground/80">
                {data.warningMessage}
              </p>
            )}

            {/* Team Capacity Stats */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground/70">
                  {data.availableMembers} / {data.totalTeamSize} available
                </span>
              </div>
              {data.blockSubmission && (
                <Badge variant="destructive" className="text-xs">
                  Submission Blocked
                </Badge>
              )}
            </div>

            {/* Team Members on Leave */}
            {data.teamOnLeave.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-foreground/70">
                  Team members on leave:
                </p>
                <div className="space-y-1">
                  {data.teamOnLeave.slice(0, 5).map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between text-xs bg-background/50 rounded-md p-2"
                    >
                      <span className="font-medium text-foreground">
                        {member.name}
                      </span>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {member.leaveType}
                        </Badge>
                        <span>
                          {format(new Date(member.startDate), "MMM d")} -{" "}
                          {format(new Date(member.endDate), "MMM d")}
                        </span>
                      </div>
                    </div>
                  ))}
                  {data.teamOnLeave.length > 5 && (
                    <p className="text-xs text-muted-foreground italic">
                      +{data.teamOnLeave.length - 5} more...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Suggested Alternative Dates */}
            {data.suggestedAlternativeDates &&
              data.suggestedAlternativeDates.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-foreground/70 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Suggested alternative dates with better capacity:
                  </p>
                  <div className="space-y-2">
                    {data.suggestedAlternativeDates.map((suggestion, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-background rounded-md p-2 border border-border"
                      >
                        <div className="flex items-center gap-2 text-xs">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">
                            {format(
                              new Date(suggestion.startDate),
                              "MMM d, yyyy"
                            )}{" "}
                            -{" "}
                            {format(new Date(suggestion.endDate), "MMM d, yyyy")}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {suggestion.capacity}% capacity
                          </Badge>
                        </div>
                        {onSelectAlternativeDate && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() =>
                              onSelectAlternativeDate(
                                new Date(suggestion.startDate),
                                new Date(suggestion.endDate)
                              )
                            }
                          >
                            Use these dates
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Blocking Message */}
            {data.blockSubmission && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  <AlertTriangle className="inline-block h-4 w-4 mr-1 mb-0.5" /> This leave request cannot be submitted due to insufficient
                  team capacity. Please select an alternative date or contact HR.
                </p>
              </div>
            )}
          </AlertDescription>
        </Alert>
      </motion.div>
    </AnimatePresence>
  );
}
