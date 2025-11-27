"use client";

import * as React from "react";
import {
    ResponsiveContainer,
    FunnelChart as RechartsFunnelChart,
    Funnel,
    LabelList,
    Tooltip,
    Cell,
} from "recharts";

import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "next-themes";

interface FunnelDataPoint {
    name: string;
    value: number;
    fill?: string;
}

interface FunnelChartProps {
    data: FunnelDataPoint[];
    title?: string;
    description?: string;
    className?: string;
    isLoading?: boolean;
    colors?: string[];
}

const DEFAULT_COLORS = [
    "#3b82f6", // Blue 500
    "#6366f1", // Indigo 500
    "#8b5cf6", // Violet 500
    "#a855f7", // Purple 500
    "#d946ef", // Fuchsia 500
];

export function FunnelChart({
    data,
    title,
    description,
    className,
    isLoading = false,
    colors = DEFAULT_COLORS,
}: FunnelChartProps) {
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

    // Assign colors if not present
    const coloredData = data.map((entry, index) => ({
        ...entry,
        fill: entry.fill || colors[index % colors.length],
    }));

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
                        <RechartsFunnelChart>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: isDark ? "rgba(31, 41, 55, 0.9)" : "rgba(255, 255, 255, 0.9)",
                                    borderRadius: "8px",
                                    border: "1px solid rgba(128, 128, 128, 0.2)",
                                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                                }}
                                itemStyle={{ color: isDark ? "#e5e7eb" : "#1f2937" }}
                            />
                            <Funnel
                                dataKey="value"
                                data={coloredData}
                                isAnimationActive
                            >
                                <LabelList
                                    position="right"
                                    fill={isDark ? "#e5e7eb" : "#1f2937"}
                                    stroke="none"
                                    dataKey="name"
                                />
                                {coloredData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Funnel>
                        </RechartsFunnelChart>
                    </ResponsiveContainer>
                </div>
            </GlassCardContent>
        </GlassCard>
    );
}
