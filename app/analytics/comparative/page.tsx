"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { YoYChart } from "@/components/analytics/comparative/YoYChart";
import { DepartmentBenchmark } from "@/components/analytics/comparative/DepartmentBenchmark";
import { CostTrends } from "@/components/analytics/comparative/CostTrends";
import { ForecastChart } from "@/components/analytics/predictive/ForecastChart";
import { PageHeader } from "@/components/ui/page-header";

export default function ComparativeAnalyticsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch all comparative data
                // In a real app, these would be separate endpoints or a consolidated one
                const [yoyRes, forecastRes] = await Promise.all([
                    fetch("/api/analytics/comparative/yoy"),
                    fetch("/api/analytics/forecast")
                ]);

                const yoyData = yoyRes.ok ? await yoyRes.json() : null;
                const forecastData = forecastRes.ok ? await forecastRes.json() : null;

                setData({
                    yoy: yoyData,
                    forecast: forecastData,
                    // Mocking other data for now as endpoints aren't built yet
                    benchmarks: [
                        { id: "1", name: "Engineering", utilization: 75, avgApprovalTime: 4.2, rejectionRate: 5, trend: "up" },
                        { id: "2", name: "HR", utilization: 60, avgApprovalTime: 2.1, rejectionRate: 2, trend: "neutral" },
                        { id: "3", name: "Sales", utilization: 45, avgApprovalTime: 5.5, rejectionRate: 12, trend: "down" },
                    ],
                    costs: [
                        { month: "Jan", estimatedCost: 150000 },
                        { month: "Feb", estimatedCost: 120000 },
                        { month: "Mar", estimatedCost: 180000 },
                        { month: "Apr", estimatedCost: 160000 },
                    ]
                });
            } catch (error) {
                console.error("Failed to load comparative analytics", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto space-y-8 p-6">
            <PageHeader
                title="Comparative & Predictive Analytics"
                description="Strategic insights and future projections"
            />

            {/* YoY & Forecast */}
            <div className="grid gap-6 lg:grid-cols-2">
                <YoYChart data={data?.yoy?.chartData || []} />
                <ForecastChart data={data?.forecast?.chartData || []} />
            </div>

            {/* Benchmarks & Costs */}
            <div className="grid gap-6 lg:grid-cols-2">
                <DepartmentBenchmark data={data?.benchmarks || []} />
                <CostTrends data={data?.costs || []} />
            </div>
        </div>
    );
}
