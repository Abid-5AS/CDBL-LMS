"use client";

import * as React from "react";
import {
    ComposedChart,
    Line,
    Area,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Legend,
} from "recharts";

import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";

interface ForecastDataPoint {
    period: string;
    actual?: number;
    forecast?: number;
    confidenceLower?: number;
    confidenceUpper?: number;
}

interface ForecastChartProps {
    data: ForecastDataPoint[];
    className?: string;
}

export function ForecastChart({ data, className }: ForecastChartProps) {
    return (
        <GlassCard className={className}>
            <GlassCardHeader>
                <GlassCardTitle>Leave Volume Forecast (Next 3 Months)</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="period" tickLine={false} axisLine={false} />
                            <YAxis tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ borderRadius: "8px" }} />
                            <Legend />

                            {/* Confidence Interval Area */}
                            <Area
                                type="monotone"
                                dataKey="confidenceUpper"
                                stroke="none"
                                fill="#8884d8"
                                fillOpacity={0.1}
                                name="Confidence Interval"
                            />

                            {/* Actual Data Line */}
                            <Line
                                type="monotone"
                                dataKey="actual"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                name="Actual"
                            />

                            {/* Forecast Data Line (Dashed) */}
                            <Line
                                type="monotone"
                                dataKey="forecast"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={{ r: 4 }}
                                name="Forecast"
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </GlassCardContent>
        </GlassCard>
    );
}
