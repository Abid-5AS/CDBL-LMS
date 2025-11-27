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
} from "recharts";

import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";

interface CostDataPoint {
    month: string;
    estimatedCost: number;
}

interface CostTrendsProps {
    data: CostDataPoint[];
    className?: string;
}

export function CostTrends({ data, className }: CostTrendsProps) {
    const totalCost = data.reduce((acc, curr) => acc + curr.estimatedCost, 0);

    return (
        <GlassCard className={className}>
            <GlassCardHeader className="flex flex-row items-center justify-between">
                <GlassCardTitle>Estimated Leave Cost</GlassCardTitle>
                <div className="text-right">
                    <p className="text-sm text-muted-foreground">YTD Total</p>
                    <p className="text-xl font-bold">৳{totalCost.toLocaleString()}</p>
                </div>
            </GlassCardHeader>
            <GlassCardContent>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="month" tickLine={false} axisLine={false} />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `৳${value / 1000}k`}
                            />
                            <Tooltip
                                formatter={(value: number) => [`৳${value.toLocaleString()}`, "Cost"]}
                                contentStyle={{ borderRadius: "8px" }}
                            />
                            <Area
                                type="monotone"
                                dataKey="estimatedCost"
                                stroke="#f59e0b"
                                fillOpacity={1}
                                fill="url(#colorCost)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </GlassCardContent>
        </GlassCard>
    );
}
