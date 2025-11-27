"use client";

import * as React from "react";
import { BarChart3, FileText, PieChart, TrendingUp } from "lucide-react";

import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { ReportConfig } from "./ConfigPanel";

interface TemplatesProps {
    onSelect: (config: ReportConfig) => void;
    className?: string;
}

const TEMPLATES: { name: string; icon: any; config: ReportConfig; description: string }[] = [
    {
        name: "Department Leave Summary",
        icon: BarChart3,
        description: "Total leave days breakdown by department",
        config: {
            metric: "leave_days",
            dimension: "department",
            chartType: "bar",
        },
    },
    {
        name: "Leave Type Distribution",
        icon: PieChart,
        description: "Percentage split of different leave types",
        config: {
            metric: "leave_count",
            dimension: "leave_type",
            chartType: "pie",
        },
    },
    {
        name: "Monthly Trend",
        icon: TrendingUp,
        description: "Leave volume trend over the year",
        config: {
            metric: "leave_count",
            dimension: "month",
            chartType: "line",
        },
    },
    {
        name: "Detailed Leave Report",
        icon: FileText,
        description: "Tabular view of employee leave data",
        config: {
            metric: "leave_days",
            dimension: "employee",
            chartType: "table",
        },
    },
];

export function Templates({ onSelect, className }: TemplatesProps) {
    return (
        <div className={className}>
            <h3 className="mb-4 text-lg font-semibold">Quick Templates</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {TEMPLATES.map((template) => (
                    <GlassCard
                        key={template.name}
                        className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
                        onClick={() => onSelect(template.config)}
                    >
                        <GlassCardContent className="p-6">
                            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <template.icon className="h-5 w-5" />
                            </div>
                            <h4 className="mb-1 font-semibold">{template.name}</h4>
                            <p className="text-xs text-muted-foreground">{template.description}</p>
                        </GlassCardContent>
                    </GlassCard>
                ))}
            </div>
        </div>
    );
}
