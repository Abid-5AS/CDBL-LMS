"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Calendar, Plus, ExternalLink } from "lucide-react";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from "@/components/ui";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";

type LeaveWithFormatting = {
  id: number;
  type: string;
  typeLabel: string;
  formattedDates: string;
  workingDays: number;
  status: string;
};

type EmployeeRecentActivityProps = {
  leaves: LeaveWithFormatting[];
  isLoading: boolean;
};

export function EmployeeRecentActivity({
  leaves,
  isLoading,
}: EmployeeRecentActivityProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <Card className="rounded-[20px] border border-border shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Recent Leave History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center space-x-4">
              <div className="h-10 bg-muted rounded w-full"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Improved Empty State
  if (leaves.length === 0) {
    return (
      <Card className="rounded-[20px] border border-border/60 shadow-md overflow-hidden h-full">
        <CardHeader>
          <CardTitle className="text-lg">Recent Leave History</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-4">
            <Calendar
              className="size-8 text-primary/40"
              aria-hidden="true"
            />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">
            No recent activity
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-[250px]">
            You haven't requested any leave recently. Need time off?
          </p>
          <Button
            onClick={() => router.push("/leaves/apply")}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Apply for Leave
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Compact Table Layout
  return (
    <Card className="rounded-[20px] border border-border/60 shadow-md overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-border/40">
        <CardTitle className="text-lg">Recent Leave History</CardTitle>
        <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => router.push("/leaves")}>
          View All <ExternalLink className="ml-1.5 h-3 w-3" />
        </Button>
      </CardHeader>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-[140px]">Type</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead className="w-[80px] text-center">Days</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaves.slice(0, 5).map((leave) => (
              <TableRow
                key={leave.id}
                className="cursor-pointer hover:bg-muted/40"
                onClick={() => router.push(`/leaves/${leave.id}`)}
              >
                <TableCell className="font-medium text-foreground py-3">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "h-2 w-2 rounded-full",
                      leave.typeLabel.includes("Medical") ? "bg-rose-500" :
                        leave.typeLabel.includes("Casual") ? "bg-blue-500" : "bg-emerald-500"
                    )} />
                    {leave.typeLabel}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground py-3">
                  {leave.formattedDates}
                </TableCell>
                <TableCell className="text-center font-medium py-3">
                  {leave.workingDays}
                </TableCell>
                <TableCell className="py-3">
                  <StatusBadge status={leave.status as any} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
