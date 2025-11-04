"use client";

import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, AlertCircle, XCircle, Calendar } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import StatusBadge from "@/app/dashboard/components/status-badge";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface LeaveRequest {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  status: "SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "RETURNED" | "CANCELLATION_REQUESTED" | "RECALLED" | "OVERSTAY_PENDING";
}

/**
 * ActiveRequestsTimeline Component
 * 
 * Displays up to 3 most recent active leave requests (pending or approved, upcoming or recent).
 * Shows:
 * - Status badge
 * - Leave type
 * - Date range
 * - Days until start (for upcoming leaves)
 * 
 * API Endpoint: GET /api/leaves?mine=1
 * 
 * Filters:
 * - Status: PENDING, APPROVED, or SUBMITTED
 * - End date >= today (upcoming or recent)
 * - Limited to 3 most recent
 */
export function ActiveRequestsTimeline() {
  const { data, error, isLoading } = useSWR("/api/leaves?mine=1", fetcher, {
    revalidateOnFocus: true,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return null;
  }

  const leaves: LeaveRequest[] = Array.isArray(data.items) ? data.items : [];
  
  // Filter for active requests (pending or approved, upcoming or recent)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const activeLeaves = leaves.filter((leave) => {
    const isPendingOrApproved = leave.status === "PENDING" || leave.status === "APPROVED" || leave.status === "SUBMITTED";
    const endDate = new Date(leave.endDate);
    endDate.setHours(0, 0, 0, 0);
    const isRecentOrUpcoming = endDate >= today;
    return isPendingOrApproved && isRecentOrUpcoming;
  }).slice(0, 3); // Limit to 3 most recent

  if (activeLeaves.length === 0) {
    return null;
  }

  return (
    <Card className="border-2 border-blue-100 bg-blue-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-slate-900">Active Requests</CardTitle>
          <Button asChild variant="ghost" size="sm" className="text-blue-600 font-medium">
            <Link href="/leaves">View All</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {activeLeaves.map((leave, index) => {
            const startDate = new Date(leave.startDate);
            const endDate = new Date(leave.endDate);
            const isUpcoming = startDate >= today;
            const daysUntil = isUpcoming 
              ? Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
              : null;

            return (
              <div
                key={leave.id}
                className="flex items-center justify-between gap-4 p-4 rounded-lg bg-white border-2 border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <StatusBadge status={leave.status} />
                    <span className="text-base font-bold text-slate-900 capitalize">
                      {leave.type} Leave
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-slate-700 mb-1">
                    {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                  </div>
                  {daysUntil !== null && (
                    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-100 px-2.5 py-1 rounded-full">
                      <Calendar className="h-3 w-3 flex-shrink-0 mt-0.5" strokeWidth={2} />
                      <span>
                        {daysUntil === 0 
                          ? "Starting today" 
                          : daysUntil === 1 
                          ? "Starts tomorrow" 
                          : `Starts in ${daysUntil} days`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

