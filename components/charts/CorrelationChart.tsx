"use client";

import * as React from "react";
import {
    ResponsiveContainer,
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    ZAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";

import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "next-themes";

interface CorrelationDataPoint {
    x: number;
    y: number;
    z?: number; // Optional size for bubble chart
    name?: string; // Optional label for tooltip
    group?: string; // Optional grouping for coloring
}

interface CorrelationChartProps {
    data: CorrelationDataPoint[];
    xAxisLabel: string;
    yAxisLabel: string;
    title?: string;
    description?: string;
    className?: string;
    isLoading?: boolean;
    color?: string;
}

export function CorrelationChart({
    data,
    xAxisLabel,
    yAxisLabel,
    title,
    description,
    className,
    isLoading = false,
    color = "#8884d8",
}: CorrelationChartProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

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
                {title && <GlassCardTitle>{title}</GlassCardTitle>}
                {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                )}
            </GlassCardHeader>
            <GlassCardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart
                            margin={{
                                top: 20,
                                right: 20,
                                bottom: 20,
                                left: 20,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
                            <XAxis
                                type="number"
                                dataKey="x"
                                name={xAxisLabel}
                                stroke={isDark ? "#9ca3af" : "#6b7280"}
                                label={{ value: xAxisLabel, position: 'bottom', offset: 0, fill: isDark ? "#9ca3af" : "#6b7280" }}
                            />
                            <YAxis
                                type="number"
                                dataKey="y"
                                name={yAxisLabel}
                                stroke={isDark ? "#9ca3af" : "#6b7280"}
                                label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', fill: isDark ? "#9ca3af" : "#6b7280" }}
                            />
                            <ZAxis type="number" dataKey="z" range={[60, 400]} name="Size" />
                            <Tooltip
                                cursor={{ strokeDasharray: '3 3' }}
                                contentStyle={{
                                    backgroundColor: isDark ? "rgba(31, 41, 55, 0.9)" : "rgba(255, 255, 255, 0.9)",
                                    borderRadius: "8px",
                                    border: "1px solid rgba(128, 128, 128, 0.2)",
                                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                                }}
                                itemStyle={{ color: isDark ? "#e5e7eb" : "#1f2937" }}
                                formatter={(value: any, name: any, props: any) => {
                                    if (name === xAxisLabel) return [value, xAxisLabel];
                                    if (name === yAxisLabel) return [value, yAxisLabel];
                                    if (name === "Size") return [value, "Size"];
                                    return [value, name];
                                }}
                            />
                            <Legend />
                            <Scatter name={title || "Correlation"} data={data} fill={color} />
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </GlassCardContent>
        </GlassCard>
    );
}
