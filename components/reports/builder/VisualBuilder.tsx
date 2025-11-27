"use client";

import * as React from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import { ReportConfig } from "./ConfigPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface VisualBuilderProps {
    config: ReportConfig;
    data: any[];
    isLoading?: boolean;
    className?: string;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export function VisualBuilder({ config, data, isLoading, className }: VisualBuilderProps) {
    if (isLoading) {
        return (
            <GlassCard className={className}>
                <GlassCardHeader>
                    <GlassCardTitle>Preview</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                    <Skeleton className="h-[400px] w-full rounded-md" />
                </GlassCardContent>
            </GlassCard>
        );
    }

    if (!data || data.length === 0) {
        return (
            <GlassCard className={className}>
                <GlassCardHeader>
                    <GlassCardTitle>Preview</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                    <div className="flex h-[400px] items-center justify-center text-muted-foreground border-2 border-dashed rounded-md">
                        No data available for this configuration
                    </div>
                </GlassCardContent>
            </GlassCard>
        );
    }

    const renderChart = () => {
        switch (config.chartType) {
            case "bar":
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="label" />
                            <YAxis />
                            <Tooltip cursor={{ fill: "transparent" }} />
                            <Legend />
                            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name={config.metric} />
                        </BarChart>
                    </ResponsiveContainer>
                );
            case "line":
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="label" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} name={config.metric} />
                        </LineChart>
                    </ResponsiveContainer>
                );
            case "pie":
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                                nameKey="label"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                );
            case "table":
                return (
                    <div className="overflow-auto h-full">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{config.dimension}</TableHead>
                                    <TableHead className="text-right">{config.metric}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((row, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{row.label}</TableCell>
                                        <TableCell className="text-right">{row.value}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <GlassCard className={className}>
            <GlassCardHeader>
                <GlassCardTitle>Report Preview</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
                <div className="h-[400px] w-full">
                    {renderChart()}
                </div>
            </GlassCardContent>
        </GlassCard>
    );
}
