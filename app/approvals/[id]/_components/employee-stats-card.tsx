"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  TrendingUp,
  Calendar,
  Building2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { leaveTypeLabel } from "@/lib/ui";
import { Balance, LeaveType, LeaveStatus } from "@prisma/client";
import { StatusBadge } from "@/components/shared/StatusBadge";

type EmployeeStatsCardProps = {
  employee: {
    id: number;
    name: string;
    email: string;
    role: string;
    department: string | null;
  };
  balances: Balance[];
  leaveHistory: Array<{
    id: number;
    type: LeaveType;
    startDate: Date;
    endDate: Date;
    workingDays: number;
    status: LeaveStatus;
    createdAt: Date;
  }>;
};

export function EmployeeStatsCard({
  employee,
  balances,
  leaveHistory,
}: EmployeeStatsCardProps) {
  // Calculate total leaves and stats
  const totalLeaves = leaveHistory.length;
  const approvedLeaves = leaveHistory.filter((l) => l.status === "APPROVED").length;
  const rejectedLeaves = leaveHistory.filter((l) => l.status === "REJECTED").length;
  const pendingLeaves = leaveHistory.filter((l) =>
    ["PENDING", "SUBMITTED"].includes(l.status)
  ).length;

  // Get balance for each leave type
  const getBalance = (type: LeaveType) => {
    const balance = balances.find((b) => b.type === type);
    if (!balance) return { available: 0, used: 0 };

    const available =
      (balance.opening || 0) + (balance.accrued || 0) - (balance.used || 0);
    return {
      available: Math.max(0, available),
      used: balance.used || 0,
    };
  };

  const casualBalance = getBalance("CASUAL");
  const earnedBalance = getBalance("EARNED");
  const medicalBalance = getBalance("MEDICAL");

  return (
    <Card className="rounded-2xl border-muted shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Employee Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Employee Info */}
        <div className="space-y-2">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {employee.name}
            </p>
            <p className="text-xs text-muted-foreground">{employee.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {employee.role}
            </Badge>
            {employee.department && (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {employee.department}
              </Badge>
            )}
          </div>
        </div>

        {/* Leave Balances */}
        <div className="pt-4 border-t border-muted">
          <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Current Leave Balances
          </p>
          <div className="space-y-2">
            {/* Casual Leave */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Casual Leave (CL)</span>
              <div className="text-right">
                <span className="font-semibold text-foreground">
                  {casualBalance.available}
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  days
                </span>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{
                  width: `${
                    casualBalance.used
                      ? Math.min(
                          100,
                          ((casualBalance.available + casualBalance.used) /
                            (casualBalance.available + casualBalance.used)) *
                            100 -
                            (casualBalance.used /
                              (casualBalance.available + casualBalance.used)) *
                              100
                        )
                      : 100
                  }%`,
                }}
              />
            </div>

            {/* Earned Leave */}
            <div className="flex items-center justify-between text-sm mt-3">
              <span className="text-muted-foreground">Earned Leave (EL)</span>
              <div className="text-right">
                <span className="font-semibold text-foreground">
                  {earnedBalance.available}
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  days
                </span>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{
                  width: `${
                    earnedBalance.used
                      ? Math.min(
                          100,
                          ((earnedBalance.available + earnedBalance.used) /
                            (earnedBalance.available + earnedBalance.used)) *
                            100 -
                            (earnedBalance.used /
                              (earnedBalance.available + earnedBalance.used)) *
                              100
                        )
                      : 100
                  }%`,
                }}
              />
            </div>

            {/* Medical Leave */}
            <div className="flex items-center justify-between text-sm mt-3">
              <span className="text-muted-foreground">Medical Leave (ML)</span>
              <div className="text-right">
                <span className="font-semibold text-foreground">
                  {medicalBalance.available}
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  days
                </span>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-amber-600 h-2 rounded-full transition-all"
                style={{
                  width: `${
                    medicalBalance.used
                      ? Math.min(
                          100,
                          ((medicalBalance.available + medicalBalance.used) /
                            (medicalBalance.available + medicalBalance.used)) *
                            100 -
                            (medicalBalance.used /
                              (medicalBalance.available + medicalBalance.used)) *
                              100
                        )
                      : 100
                  }%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Leave History Summary */}
        <div className="pt-4 border-t border-muted">
          <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Leave History ({totalLeaves} requests)
          </p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-2 rounded-lg bg-green-100 dark:bg-green-950">
              <p className="text-lg font-bold text-green-700 dark:text-green-400">
                {approvedLeaves}
              </p>
              <p className="text-xs text-green-600 dark:text-green-500">Approved</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-red-100 dark:bg-red-950">
              <p className="text-lg font-bold text-red-700 dark:text-red-400">
                {rejectedLeaves}
              </p>
              <p className="text-xs text-red-600 dark:text-red-500">Rejected</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-blue-100 dark:bg-blue-950">
              <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                {pendingLeaves}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-500">Pending</p>
            </div>
          </div>

          {/* Recent Leaves */}
          {leaveHistory.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Recent Requests
              </p>
              {leaveHistory.slice(0, 5).map((leave) => (
                <div
                  key={leave.id}
                  className="flex items-center justify-between text-xs p-2 rounded-md bg-muted/50"
                >
                  <div className="flex-1">
                    <Badge variant="outline" className="text-xs mb-1">
                      {leaveTypeLabel[leave.type] ?? leave.type}
                    </Badge>
                    <p className="text-muted-foreground">
                      {formatDate(leave.startDate)} -{" "}
                      {formatDate(leave.endDate)}
                    </p>
                  </div>
                  <StatusBadge status={leave.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
