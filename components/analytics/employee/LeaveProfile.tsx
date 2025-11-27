"use client";

import * as React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Calendar, Clock, TrendingUp, Users } from "lucide-react";

import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface LeaveTypeDistribution {
    name: string;
    value: number;
    color: string;
}

interface EmployeeMetrics {
    totalLeaves: number;
    avgDuration: number;
    leaveBalance: number;
    utilizationRate: number;
    percentileRank: number;
}

interface LeaveProfileProps {
    employeeName: string;
    department: string;
    metrics: EmployeeMetrics;
    distribution: LeaveTypeDistribution[];
    isLoading?: boolean;
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

export function LeaveProfile({
    employeeName,
    department,
    metrics,
    distribution,
    isLoading = false,
}: LeaveProfileProps) {
    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <GlassCard key={i}>
                        <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-[100px]" />
                            <Skeleton className="h-4 w-4" />
                        </GlassCardHeader>
                        <GlassCardContent>
                            <Skeleton className="h-8 w-[60px]" />
                        </GlassCardContent>
                    </GlassCard>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{employeeName}</h2>
                    <p className="text-muted-foreground">{department}</p>
                </div>
                <Badge variant={metrics.utilizationRate > 80 ? "destructive" : "secondary"}>
                    {metrics.utilizationRate}% Utilization
                </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <GlassCard>
                    <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <GlassCardTitle className="text-sm font-medium">
                            Total Leaves
                        </GlassCardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </GlassCardHeader>
                    <GlassCardContent>
                        <div className="text-2xl font-bold">{metrics.totalLeaves}</div>
                        <p className="text-xs text-muted-foreground">
                            Days taken this year
                        </p>
                    </GlassCardContent>
                </GlassCard>
                <GlassCard>
                    <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <GlassCardTitle className="text-sm font-medium">
                            Avg Duration
                        </GlassCardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </GlassCardHeader>
                    <GlassCardContent>
                        <div className="text-2xl font-bold">{metrics.avgDuration} days</div>
                        <p className="text-xs text-muted-foreground">
                            Per leave request
                        </p>
                    </GlassCardContent>
                </GlassCard>
                <GlassCard>
                    <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <GlassCardTitle className="text-sm font-medium">
                            Balance Remaining
                        </GlassCardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </GlassCardHeader>
                    <GlassCardContent>
                        <div className="text-2xl font-bold">{metrics.leaveBalance}</div>
                        <p className="text-xs text-muted-foreground">
                            Days available
                        </p>
                    </GlassCardContent>
                </GlassCard>
                <GlassCard>
                    <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <GlassCardTitle className="text-sm font-medium">
                            Peer Rank
                        </GlassCardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </GlassCardHeader>
                    <GlassCardContent>
                        <div className="text-2xl font-bold">Top {metrics.percentileRank}%</div>
                        <p className="text-xs text-muted-foreground">
                            vs Department avg
                        </p>
                    </GlassCardContent>
                </GlassCard>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <GlassCard className="col-span-1">
                    <GlassCardHeader>
                        <GlassCardTitle>Leave Distribution</GlassCardTitle>
                    </GlassCardHeader>
                    <GlassCardContent>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={distribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {distribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            {distribution.map((item, index) => (
                                <div key={item.name} className="flex items-center gap-2">
                                    <div
                                        className="h-3 w-3 rounded-full"
                                        style={{ backgroundColor: item.color || COLORS[index % COLORS.length] }}
                                    />
                                    <span className="text-sm text-muted-foreground">
                                        {item.name} ({item.value})
                                    </span>
                                </div>
                            ))}
                        </div>
                    </GlassCardContent>
                </GlassCard>

                <GlassCard className="col-span-1">
                    <GlassCardHeader>
                        <GlassCardTitle>Yearly Utilization</GlassCardTitle>
                    </GlassCardHeader>
                    <GlassCardContent className="space-y-8">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span>Used vs Total</span>
                                <span className="text-muted-foreground">{metrics.utilizationRate}%</span>
                            </div>
                            <Progress value={metrics.utilizationRate} />
                        </div>
                        {/* Add more detailed breakdown if needed */}
                    </GlassCardContent>
                </GlassCard>
            </div>
        </div>
    );
}
