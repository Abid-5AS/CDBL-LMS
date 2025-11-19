"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks } from "date-fns";

/**
 * Team Member Data Interface
 */
export interface TeamMemberData {
  employeeId: string | number;
  employeeName: string;
  leaveCount: number;
  riskLevel: "low" | "medium" | "high";
  department?: string;
  leaves?: {
    date: Date | string;
    type: string;
    status: string;
  }[];
}

/**
 * TeamCapacityHeatmap Props
 *
 * @interface TeamCapacityHeatmapProps
 * @property {TeamMemberData[]} teamData - Array of team members with leave data
 * @property {Object} [dateRange] - Date range to display
 * @property {'week'|'month'|'none'} [groupBy] - Time period grouping
 * @property {(employee: TeamMemberData, date?: Date) => void} [onCellClick] - Cell click handler
 */
export interface TeamCapacityHeatmapProps {
  teamData: TeamMemberData[];
  dateRange?: {
    start: Date | string;
    end: Date | string;
  };
  groupBy?: "week" | "month" | "none";
  onCellClick?: (employee: TeamMemberData, date?: Date) => void;
  isLoading?: boolean;
  className?: string;
  title?: string;
  description?: string;
}

const riskLevelStyles = {
  low: {
    bg: "bg-green-100 dark:bg-green-950",
    border: "border-green-300 dark:border-green-800",
    text: "text-green-800 dark:text-green-300",
    hover: "hover:bg-green-200 dark:hover:bg-green-900",
  },
  medium: {
    bg: "bg-yellow-100 dark:bg-yellow-950",
    border: "border-yellow-300 dark:border-yellow-800",
    text: "text-yellow-800 dark:text-yellow-300",
    hover: "hover:bg-yellow-200 dark:hover:bg-yellow-900",
  },
  high: {
    bg: "bg-red-100 dark:bg-red-950",
    border: "border-red-300 dark:border-red-800",
    text: "text-red-800 dark:text-red-300",
    hover: "hover:bg-red-200 dark:hover:bg-red-900",
  },
};

/**
 * TeamCapacityHeatmap Component
 *
 * Visual representation of team's leave coverage/availability.
 * Color-coded by risk level with interactive cells.
 *
 * @example
 * ```tsx
 * <TeamCapacityHeatmap
 *   teamData={[
 *     {
 *       employeeId: '1',
 *       employeeName: 'John Doe',
 *       leaveCount: 3,
 *       riskLevel: 'medium',
 *       department: 'Engineering'
 *     }
 *   ]}
 *   groupBy="week"
 *   onCellClick={(employee, date) => console.log(employee, date)}
 * />
 * ```
 */
export function TeamCapacityHeatmap({
  teamData,
  dateRange,
  groupBy = "none",
  onCellClick,
  isLoading = false,
  className,
  title = "Team Capacity Overview",
  description = "Leave distribution and availability tracking",
}: TeamCapacityHeatmapProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string | number | null>(null);

  // Calculate default date range if not provided
  const defaultStart = startOfWeek(new Date());
  const defaultEnd = endOfWeek(addWeeks(new Date(), 3));

  const start = dateRange?.start ? new Date(dateRange.start) : defaultStart;
  const end = dateRange?.end ? new Date(dateRange.end) : defaultEnd;

  const handleCellClick = (employee: TeamMemberData, date?: Date) => {
    setSelectedEmployee(employee.employeeId);
    if (onCellClick) {
      onCellClick(employee, date);
    }
  };

  if (isLoading) {
    return (
      <Card className={cn("bg-card border-border", className)}>
        <CardHeader className="pb-3">
          <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-gray-100 dark:bg-gray-800 animate-pulse rounded"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!teamData || teamData.length === 0) {
    return (
      <Card className={cn("bg-card border-border", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No team data available
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort by risk level and leave count
  const sortedTeamData = [...teamData].sort((a, b) => {
    const riskOrder = { high: 0, medium: 1, low: 2 };
    if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
      return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    }
    return b.leaveCount - a.leaveCount;
  });

  // Calculate team statistics
  const totalMembers = teamData.length;
  const highRiskCount = teamData.filter((m) => m.riskLevel === "high").length;
  const mediumRiskCount = teamData.filter((m) => m.riskLevel === "medium").length;
  const lowRiskCount = teamData.filter((m) => m.riskLevel === "low").length;
  const totalLeaves = teamData.reduce((sum, m) => sum + m.leaveCount, 0);
  const avgLeavesPerMember = (totalLeaves / totalMembers).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn("bg-card border-border", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
              {description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {description}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                {totalMembers} members
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Total Leaves
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {totalLeaves}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800">
              <p className="text-xs text-red-600 dark:text-red-400 mb-1">High Risk</p>
              <p className="text-2xl font-bold text-red-800 dark:text-red-300">
                {highRiskCount}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-800">
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-1">
                Medium Risk
              </p>
              <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-300">
                {mediumRiskCount}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-600 dark:text-green-400 mb-1">Low Risk</p>
              <p className="text-2xl font-bold text-green-800 dark:text-green-300">
                {lowRiskCount}
              </p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 border border-border">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Risk Levels:
            </span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-200 dark:bg-green-900 border border-green-300 dark:border-green-800" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Low (0-2 leaves)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-200 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-800" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Medium (3-5 leaves)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-200 dark:bg-red-900 border border-red-300 dark:border-red-800" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                High (6+ leaves)
              </span>
            </div>
          </div>

          {/* Heatmap Grid */}
          <div className="space-y-2">
            {sortedTeamData.map((member, index) => {
              const styles = riskLevelStyles[member.riskLevel];
              const isSelected = selectedEmployee === member.employeeId;

              return (
                <TooltipProvider key={member.employeeId}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          "p-4 rounded-lg border-2 transition-all duration-200",
                          styles.bg,
                          styles.border,
                          onCellClick && styles.hover,
                          onCellClick && "cursor-pointer",
                          isSelected && "ring-2 ring-blue-500 dark:ring-blue-400"
                        )}
                        onClick={() => handleCellClick(member)}
                        role={onCellClick ? "button" : undefined}
                        tabIndex={onCellClick ? 0 : undefined}
                        onKeyDown={
                          onCellClick
                            ? (e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  handleCellClick(member);
                                }
                              }
                            : undefined
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className={cn("font-semibold text-sm", styles.text)}>
                              {member.employeeName}
                            </p>
                            {member.department && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                {member.department}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className={cn("text-2xl font-bold", styles.text)}>
                                {member.leaveCount}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {member.leaveCount === 1 ? "leave" : "leaves"}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn("text-xs uppercase", styles.text, styles.border)}
                            >
                              {member.riskLevel}
                            </Badge>
                          </div>
                        </div>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        <p className="font-semibold">{member.employeeName}</p>
                        {member.department && (
                          <p className="text-xs text-gray-400">{member.department}</p>
                        )}
                        <p className="text-xs">
                          {member.leaveCount} {member.leaveCount === 1 ? "leave" : "leaves"} -{" "}
                          {member.riskLevel} risk
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>

          {/* Footer Stats */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              Average {avgLeavesPerMember} leaves per team member
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * TeamCapacityHeatmap Skeleton Loader
 */
export function TeamCapacityHeatmapSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700", className)}>
      <CardHeader className="pb-3">
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-20 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg"
            />
          ))}
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 bg-gray-100 dark:bg-gray-800 animate-pulse rounded"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
