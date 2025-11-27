"use client";

import * as React from "react";
import { AlertTriangle, Calendar, Clock, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface BehavioralPatterns {
    preferredDays: Record<string, number>; // e.g., { Mon: 5, Fri: 10 }
    avgAdvanceNotice: number;
    seasonality: Record<string, number>; // e.g., { Q1: 2, Q2: 5 }
}

interface Anomaly {
    date: string;
    type: string;
    description: string;
    severity: "low" | "medium" | "high";
}

interface BehavioralInsightsProps {
    patterns: BehavioralPatterns;
    anomalies: Anomaly[];
    className?: string;
}

export function BehavioralInsights({ patterns, anomalies, className }: BehavioralInsightsProps) {
    const dayData = Object.entries(patterns.preferredDays).map(([day, count]) => ({
        day,
        count,
    }));

    return (
        <div className={className}>
            <div className="grid gap-4 md:grid-cols-2">
                {/* Preferred Days Chart */}
                <GlassCard>
                    <GlassCardHeader>
                        <GlassCardTitle className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Day of Week Preference
                        </GlassCardTitle>
                    </GlassCardHeader>
                    <GlassCardContent>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dayData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="day" tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: "transparent" }}
                                        contentStyle={{ borderRadius: "8px" }}
                                    />
                                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </GlassCardContent>
                </GlassCard>

                {/* Planning Habits */}
                <GlassCard>
                    <GlassCardHeader>
                        <GlassCardTitle className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Planning Habits
                        </GlassCardTitle>
                    </GlassCardHeader>
                    <GlassCardContent className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                                <p className="text-sm font-medium">Avg. Advance Notice</p>
                                <p className="text-xs text-muted-foreground">Days before leave start</p>
                            </div>
                            <div className="text-2xl font-bold">{patterns.avgAdvanceNotice.toFixed(1)}</div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium">Planning Rating</p>
                            <div className="flex items-center gap-2">
                                <Badge variant={patterns.avgAdvanceNotice > 7 ? "default" : "secondary"}>
                                    {patterns.avgAdvanceNotice > 14 ? "Excellent Planner" : patterns.avgAdvanceNotice > 7 ? "Good Planner" : "Last Minute"}
                                </Badge>
                            </div>
                        </div>
                    </GlassCardContent>
                </GlassCard>
            </div>

            {/* Anomaly Alerts */}
            {anomalies.length > 0 && (
                <div className="mt-4 space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Detected Patterns & Anomalies</h3>
                    {anomalies.map((anomaly, index) => (
                        <Alert key={index} variant={anomaly.severity === "high" ? "destructive" : "default"} className="bg-background/50 backdrop-blur">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle className="capitalize">{anomaly.type.replace("_", " ")}</AlertTitle>
                            <AlertDescription>
                                {anomaly.description} <span className="text-xs text-muted-foreground">({anomaly.date})</span>
                            </AlertDescription>
                        </Alert>
                    ))}
                </div>
            )}
        </div>
    );
}
