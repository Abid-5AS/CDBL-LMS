"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  AlertTriangle,
  Calendar,
  Building2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { leaveTypeLabel } from "@/lib/ui";
import { LeaveType } from "@prisma/client";
import { StatusBadge } from "@/components/shared/StatusBadge";

type TeamImpactCardProps = {
  overlappingLeaves: Array<{
    id: number;
    type: LeaveType;
    startDate: Date;
    endDate: Date;
    workingDays: number;
    status: string;
    requester: {
      name: string;
      email: string;
      department: string | null;
    };
  }>;
};

export function TeamImpactCard({ overlappingLeaves }: TeamImpactCardProps) {
  const approvedCount = overlappingLeaves.filter(
    (l) => l.status === "APPROVED"
  ).length;
  const pendingCount = overlappingLeaves.filter((l) =>
    ["PENDING", "SUBMITTED"].includes(l.status)
  ).length;

  // Group by department
  const departmentGroups = overlappingLeaves.reduce((acc, leave) => {
    const dept = leave.requester.department || "Unassigned";
    if (!acc[dept]) {
      acc[dept] = [];
    }
    acc[dept].push(leave);
    return acc;
  }, {} as Record<string, typeof overlappingLeaves>);

  const affectedDepartments = Object.keys(departmentGroups).length;

  return (
    <Card className="rounded-2xl border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Impact
        </CardTitle>
        <CardDescription>
          {overlappingLeaves.length} employees on leave during same period
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warning Banner */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-100 dark:bg-yellow-950/50 border border-yellow-300 dark:border-yellow-800">
          <AlertTriangle className="h-5 w-5 text-yellow-700 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
              Multiple Team Members on Leave
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
              {approvedCount} already approved, {pendingCount} pending approval
              {affectedDepartments > 1 &&
                ` across ${affectedDepartments} departments`}
            </p>
          </div>
        </div>

        {/* Overlapping Leave List */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Overlapping Leave Requests
          </p>
          {overlappingLeaves.map((leave) => (
            <div
              key={leave.id}
              className="p-3 rounded-lg border border-muted bg-card"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {leave.requester.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {leave.requester.email}
                  </p>
                </div>
                <StatusBadge status={leave.status} />
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                <Badge variant="outline" className="text-xs">
                  {leaveTypeLabel[leave.type] ?? leave.type}
                </Badge>
                {leave.requester.department && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {leave.requester.department}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {leave.workingDays} days
                </span>
              </div>

              <div className="mt-2 text-xs text-muted-foreground">
                {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
              </div>
            </div>
          ))}
        </div>

        {/* Impact Summary */}
        <div className="pt-3 border-t border-muted">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <p className="text-lg font-bold text-foreground">
                {affectedDepartments}
              </p>
              <p className="text-xs text-muted-foreground">
                {affectedDepartments === 1 ? "Department" : "Departments"}
              </p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <p className="text-lg font-bold text-foreground">
                {overlappingLeaves.reduce((sum, l) => sum + l.workingDays, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Total Days</p>
            </div>
          </div>
        </div>

        {/* Decision Guidance */}
        <div className="pt-3 border-t border-muted">
          <p className="text-xs text-muted-foreground italic">
            💡 Consider staffing levels and workload distribution when approving this request
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
