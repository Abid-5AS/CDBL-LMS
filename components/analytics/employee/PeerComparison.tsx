"use client";

import * as React from "react";
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from "recharts";

import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";

interface ComparisonMetric {
    subject: string;
    A: number; // Employee
    B: number; // Department Avg
    fullMark: number;
}

interface PeerComparisonProps {
    data: ComparisonMetric[];
    className?: string;
}

export function PeerComparison({ data, className }: PeerComparisonProps) {
    return (
        <GlassCard className={className}>
            <GlassCardHeader>
                <GlassCardTitle>Peer Comparison</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} />
                            <Radar
                                name="Employee"
                                dataKey="A"
                                stroke="#8884d8"
                                fill="#8884d8"
                                fillOpacity={0.6}
                            />
                            <Radar
                                name="Dept Avg"
                                dataKey="B"
                                stroke="#82ca9d"
                                fill="#82ca9d"
                                fillOpacity={0.6}
                            />
                            <Legend />
                            <Tooltip />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </GlassCardContent>
        </GlassCard>
    );
}
