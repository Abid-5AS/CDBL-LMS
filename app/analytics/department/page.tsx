"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { HeatmapCalendar } from "@/components/charts/HeatmapCalendar";
import { EnhancedAreaChart } from "@/components/charts/EnhancedAreaChart";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import { useAnalyticsStream } from "@/hooks/useAnalyticsStream";

export default function DepartmentAnalyticsPage() {
    const [heatmapData, setHeatmapData] = useState<any[]>([]);
    const [trendsData, setTrendsData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Connect to real-time stream
    const { lastUpdate } = useAnalyticsStream();

    const fetchData = async () => {
        try {
            setLoading(true);
            const today = new Date();
            const startOfYear = new Date(today.getFullYear(), 0, 1).toISOString().slice(0, 10);
            const endOfYear = new Date(today.getFullYear(), 11, 31).toISOString().slice(0, 10);

            const [heatmapRes, trendsRes] = await Promise.all([
                fetch(`/api/analytics/heatmap?startDate=${startOfYear}&endDate=${endOfYear}`),
                fetch(`/api/analytics/trends/seasonal?year=${today.getFullYear()}`)
            ]);

            if (heatmapRes.ok) setHeatmapData(await heatmapRes.json());
            if (trendsRes.ok) setTrendsData(await trendsRes.json());
        } catch (error) {
            console.error("Failed to fetch department analytics", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [lastUpdate]); // Refetch when real-time update occurs

    if (loading && !heatmapData.length) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto space-y-8 p-6">
            <PageHeader
                title="Department Analytics"
                description="Overview of department leave patterns and utilization"
            />

            {/* Heatmap Section */}
            <div className="space-y-4">
                <HeatmapCalendar
                    data={heatmapData}
                    title="Department Leave Density"
                    description="Visualizing leave concentration across the year"
                />
            </div>

            {/* Trends Section */}
            <div className="grid gap-6 lg:grid-cols-2">
                <GlassCard>
                    <GlassCardHeader>
                        <GlassCardTitle>Monthly Leave Trends</GlassCardTitle>
                    </GlassCardHeader>
                    <GlassCardContent>
                        {trendsData?.monthlyTrends && (
                            <EnhancedAreaChart
                                data={trendsData.monthlyTrends}
                                categories={["count"]}
                                indexKey="month"
                                height={300}
                                colors={["#3b82f6"]}
                            />
                        )}
                    </GlassCardContent>
                </GlassCard>

                <GlassCard>
                    <GlassCardHeader>
                        <GlassCardTitle>Peak Periods</GlassCardTitle>
                    </GlassCardHeader>
                    <GlassCardContent>
                        <div className="space-y-4">
                            {trendsData?.peaks?.map((peak: any, i: number) => (
                                <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0">
                                    <div>
                                        <p className="font-medium">{peak.month}</p>
                                        <p className="text-xs text-muted-foreground">{peak.reason}</p>
                                    </div>
                                    <div className="text-xl font-bold">{peak.count}</div>
                                </div>
                            ))}
                            {(!trendsData?.peaks || trendsData.peaks.length === 0) && (
                                <p className="text-muted-foreground">No significant peaks detected.</p>
                            )}
                        </div>
                    </GlassCardContent>
                </GlassCard>
            </div>
        </div>
    );
}
