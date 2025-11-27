"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

import { LeaveProfile } from "@/components/analytics/employee/LeaveProfile";
import { LeaveTimeline } from "@/components/analytics/employee/LeaveTimeline";
import { BehavioralInsights } from "@/components/analytics/employee/BehavioralInsights";
import { PeerComparison } from "@/components/analytics/employee/PeerComparison";
import { HeatmapCalendar } from "@/components/charts/HeatmapCalendar";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export default function EmployeeAnalyticsPage() {
    const params = useParams();
    const id = params?.id as string;

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch patterns and peer data in parallel
                const [patternsRes, peersRes] = await Promise.all([
                    fetch(`/api/analytics/employee/${id}/patterns`),
                    fetch(`/api/analytics/employee/${id}/peers`)
                ]);

                if (!patternsRes.ok || !peersRes.ok) {
                    throw new Error("Failed to fetch analytics data");
                }

                const patternsData = await patternsRes.json();
                const peersData = await peersRes.json();

                setData({
                    ...patternsData,
                    ...peersData,
                });
            } catch (err) {
                console.error(err);
                setError("Failed to load analytics data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
                <p className="text-destructive">{error || "Employee not found"}</p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto space-y-8 p-6">
            <PageHeader
                title="Employee Analytics"
                description="Detailed insights into leave behavior and patterns"
            />

            {/* 1. Profile & Key Metrics */}
            <LeaveProfile
                employeeName={data.employee?.name || "Employee"}
                department={data.employee?.department || "Department"}
                metrics={{
                    totalLeaves: data.employee?.totalLeaves || 0,
                    avgDuration: data.employee?.avgDuration || 0,
                    leaveBalance: data.employee?.balance || 0,
                    utilizationRate: data.employee?.utilization || 0,
                    percentileRank: data.percentile || 50,
                }}
                distribution={data.patterns?.leaveTypeFrequency || []}
            />

            {/* 2. Timeline & Heatmap */}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <LeaveTimeline events={data.timeline || []} />
                </div>
                <div className="lg:col-span-1">
                    <HeatmapCalendar
                        data={data.heatmap || []}
                        title="Attendance Heatmap"
                        className="h-full"
                    />
                </div>
            </div>

            {/* 3. Behavioral Insights & Peer Comparison */}
            <div className="grid gap-6 lg:grid-cols-2">
                <BehavioralInsights
                    patterns={data.patterns || { preferredDays: {}, avgAdvanceNotice: 0, seasonality: {} }}
                    anomalies={data.anomalies || []}
                />
                <PeerComparison
                    data={[
                        { subject: "Frequency", A: data.employee?.frequencyScore || 0, B: data.department?.frequencyScore || 0, fullMark: 100 },
                        { subject: "Duration", A: data.employee?.durationScore || 0, B: data.department?.durationScore || 0, fullMark: 100 },
                        { subject: "Notice", A: data.employee?.noticeScore || 0, B: data.department?.noticeScore || 0, fullMark: 100 },
                        { subject: "Approval", A: data.employee?.approvalScore || 0, B: data.department?.approvalScore || 0, fullMark: 100 },
                        { subject: "Utilization", A: data.employee?.utilization || 0, B: data.department?.utilization || 0, fullMark: 100 },
                    ]}
                />
            </div>
        </div>
    );
}
