"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface DepartmentMetric {
    id: string;
    name: string;
    utilization: number;
    avgApprovalTime: number; // hours
    rejectionRate: number; // percentage
    trend: "up" | "down" | "neutral";
}

interface DepartmentBenchmarkProps {
    data: DepartmentMetric[];
    className?: string;
}

export function DepartmentBenchmark({ data, className }: DepartmentBenchmarkProps) {
    return (
        <GlassCard className={className}>
            <GlassCardHeader>
                <GlassCardTitle>Department Benchmarking</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Department</TableHead>
                            <TableHead className="text-right">Utilization</TableHead>
                            <TableHead className="text-right">Avg Approval</TableHead>
                            <TableHead className="text-right">Rejection Rate</TableHead>
                            <TableHead className="text-center">Trend</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((dept) => (
                            <TableRow key={dept.id}>
                                <TableCell className="font-medium">{dept.name}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <div className="h-2 w-16 rounded-full bg-secondary">
                                            <div
                                                className="h-full rounded-full bg-primary"
                                                style={{ width: `${dept.utilization}%` }}
                                            />
                                        </div>
                                        <span>{dept.utilization}%</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">{dept.avgApprovalTime}h</TableCell>
                                <TableCell className="text-right">
                                    <Badge variant={dept.rejectionRate > 10 ? "destructive" : "secondary"}>
                                        {dept.rejectionRate}%
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    {dept.trend === "up" ? (
                                        <ArrowUp className="mx-auto h-4 w-4 text-red-500" />
                                    ) : dept.trend === "down" ? (
                                        <ArrowDown className="mx-auto h-4 w-4 text-emerald-500" />
                                    ) : (
                                        <Minus className="mx-auto h-4 w-4 text-muted-foreground" />
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </GlassCardContent>
        </GlassCard>
    );
}
