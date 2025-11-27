"use client";

import * as React from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";

interface YoYDataPoint {
    period: string; // e.g., "Jan", "Q1"
    current: number;
    previous: number;
}

interface YoYChartProps {
    data: YoYDataPoint[];
    currentYearLabel?: string;
    previousYearLabel?: string;
    title?: string;
    description?: string;
    className?: string;
    isLoading?: boolean;
}

export function YoYChart({
    data,
    currentYearLabel = "Current Year",
    previousYearLabel = "Previous Year",
    title = "Year-over-Year Comparison",
    description,
    className,
    isLoading = false,
}: YoYChartProps) {
    if (isLoading) {
        return (
            <GlassCard className={className}>
                <GlassCardHeader>
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                </GlassCardHeader>
                <GlassCardContent>
                    <Skeleton className="h-[300px] w-full rounded-md" />
                </GlassCardContent>
            </GlassCard>
        );
    }

    return (
        <GlassCard className={className}>
            <GlassCardHeader>
                <GlassCardTitle>{title}</GlassCardTitle>
                {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                )}
            </GlassCardHeader>
            <GlassCardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="period" tickLine={false} axisLine={false} />
                            <YAxis tickLine={false} axisLine={false} />
                            <Tooltip
                                cursor={{ fill: "transparent" }}
                                contentStyle={{ borderRadius: "8px" }}
                            />
                            <Legend />
                            <Bar dataKey="previous" name={previousYearLabel} fill="#94a3b8" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="current" name={currentYearLabel} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </GlassCardContent>
        </GlassCard>
    );
}
