"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, Clock, User } from "lucide-react";

import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BottleneckStep {
    stepName: string;
    avgTime: number; // hours
    slaLimit: number; // hours
    pendingCount: number;
}

interface SlowApprover {
    name: string;
    avgTime: number; // hours
    pendingCount: number;
}

interface BottleneckAnalysisProps {
    steps: BottleneckStep[];
    approvers: SlowApprover[];
    className?: string;
}

export function BottleneckAnalysis({ steps, approvers, className }: BottleneckAnalysisProps) {
    return (
        <div className={className}>
            <div className="grid gap-4 md:grid-cols-2">
                {/* Workflow Steps Analysis */}
                <GlassCard>
                    <GlassCardHeader>
                        <GlassCardTitle className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Workflow Stage Performance
                        </GlassCardTitle>
                    </GlassCardHeader>
                    <GlassCardContent className="space-y-6">
                        {steps.map((step, index) => {
                            const isOverSLA = step.avgTime > step.slaLimit;
                            const percentage = Math.min(100, (step.avgTime / (step.slaLimit * 2)) * 100);

                            return (
                                <div key={index} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">{step.stepName}</span>
                                        <div className="flex items-center gap-2">
                                            <span className={isOverSLA ? "text-destructive font-bold" : "text-muted-foreground"}>
                                                {step.avgTime.toFixed(1)}h
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                (SLA: {step.slaLimit}h)
                                            </span>
                                        </div>
                                    </div>
                                    <Progress
                                        value={percentage}
                                        className={isOverSLA ? "bg-destructive/20 [&>div]:bg-destructive" : ""}
                                    />
                                    {step.pendingCount > 0 && (
                                        <p className="text-xs text-muted-foreground">
                                            {step.pendingCount} requests currently pending
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </GlassCardContent>
                </GlassCard>

                {/* Approver Performance */}
                <GlassCard>
                    <GlassCardHeader>
                        <GlassCardTitle className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Approver Insights
                        </GlassCardTitle>
                    </GlassCardHeader>
                    <GlassCardContent>
                        <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-4">
                                {approvers.map((approver, index) => (
                                    <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                                {approver.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{approver.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {approver.pendingCount} pending
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant={approver.avgTime > 48 ? "destructive" : "secondary"}>
                                                {approver.avgTime.toFixed(1)}h avg
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                                {approvers.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                        <CheckCircle2 className="mb-2 h-8 w-8 text-emerald-500" />
                                        <p>No bottlenecks detected</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </GlassCardContent>
                </GlassCard>
            </div>
        </div>
    );
}
