"use client";

import * as React from "react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Brush,
    Legend,
} from "recharts";

import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "next-themes";

interface EnhancedAreaChartProps {
    data: any[];
    categories: string[]; // Keys for the areas (e.g., ["EARNED", "CASUAL"])
    indexKey: string; // Key for X-axis (e.g., "date")
    title?: string;
    description?: string;
    className?: string;
    isLoading?: boolean;
    colors?: string[];
    showBrush?: boolean;
    height?: number;
}

const DEFAULT_COLORS = [
    "#10b981", // Emerald 500
    "#3b82f6", // Blue 500
    "#f59e0b", // Amber 500
    "#ef4444", // Red 500
    "#8b5cf6", // Violet 500
    "#ec4899", // Pink 500
];

export function EnhancedAreaChart({
    data,
    categories,
    indexKey,
    title,
    description,
    className,
    isLoading = false,
    colors = DEFAULT_COLORS,
    showBrush = true,
    height = 400,
}: EnhancedAreaChartProps) {
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
                    <Skeleton className="w-full rounded-md" style={{ height }} />
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
                <div style={{ width: "100%", height }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <defs>
                                {categories.map((category, index) => (
                                    <linearGradient
                                        key={category}
                                        id={`color${category}`}
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor={colors[index % colors.length]}
                                            stopOpacity={0.8}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor={colors[index % colors.length]}
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                ))}
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke={isDark ? "#374151" : "#e5e7eb"}
                                vertical={false}
                            />
                            <XAxis
                                dataKey={indexKey}
                                stroke={isDark ? "#9ca3af" : "#6b7280"}
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke={isDark ? "#9ca3af" : "#6b7280"}
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: isDark ? "rgba(31, 41, 55, 0.9)" : "rgba(255, 255, 255, 0.9)",
                                    borderRadius: "8px",
                                    border: "1px solid rgba(128, 128, 128, 0.2)",
                                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                                }}
                                itemStyle={{ color: isDark ? "#e5e7eb" : "#1f2937" }}
                            />
                            <Legend />
                            {categories.map((category, index) => (
                                <Area
                                    key={category}
                                    type="monotone"
                                    dataKey={category}
                                    stroke={colors[index % colors.length]}
                                    fillOpacity={1}
                                    fill={`url(#color${category})`}
                                    stackId="1"
                                />
                            ))}
                            {showBrush && (
                                <Brush
                                    dataKey={indexKey}
                                    height={30}
                                    stroke={isDark ? "#10b981" : "#059669"}
                                    fill={isDark ? "#1f2937" : "#f3f4f6"}
                                />
                            )}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </GlassCardContent>
        </GlassCard>
    );
}
