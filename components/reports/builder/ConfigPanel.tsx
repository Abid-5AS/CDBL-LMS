"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface ReportConfig {
    metric: string;
    dimension: string;
    filter?: {
        field: string;
        operator: string;
        value: string;
    };
    chartType: "bar" | "line" | "pie" | "table";
}

interface ConfigPanelProps {
    config: ReportConfig;
    onChange: (config: ReportConfig) => void;
    className?: string;
}

const METRICS = [
    { value: "leave_count", label: "Leave Count" },
    { value: "leave_days", label: "Total Leave Days" },
    { value: "avg_duration", label: "Average Duration" },
    { value: "approval_time", label: "Approval Time" },
];

const DIMENSIONS = [
    { value: "department", label: "Department" },
    { value: "leave_type", label: "Leave Type" },
    { value: "month", label: "Month" },
    { value: "employee", label: "Employee" },
    { value: "status", label: "Status" },
];

const CHART_TYPES = [
    { value: "bar", label: "Bar Chart" },
    { value: "line", label: "Line Chart" },
    { value: "pie", label: "Pie Chart" },
    { value: "table", label: "Data Table" },
];

export function ConfigPanel({ config, onChange, className }: ConfigPanelProps) {
    const handleChange = (field: keyof ReportConfig, value: string) => {
        onChange({ ...config, [field]: value });
    };

    return (
        <GlassCard className={className}>
            <GlassCardHeader>
                <GlassCardTitle>Report Configuration</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-6">
                {/* Metric Selection */}
                <div className="space-y-2">
                    <Label>Metric (Y-Axis)</Label>
                    <Select value={config.metric} onValueChange={(v) => handleChange("metric", v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select metric" />
                        </SelectTrigger>
                        <SelectContent>
                            {METRICS.map((m) => (
                                <SelectItem key={m.value} value={m.value}>
                                    {m.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Dimension Selection */}
                <div className="space-y-2">
                    <Label>Dimension (X-Axis / Group By)</Label>
                    <Select value={config.dimension} onValueChange={(v) => handleChange("dimension", v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select dimension" />
                        </SelectTrigger>
                        <SelectContent>
                            {DIMENSIONS.map((d) => (
                                <SelectItem key={d.value} value={d.value}>
                                    {d.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Chart Type Selection */}
                <div className="space-y-2">
                    <Label>Visualization Type</Label>
                    <div className="grid grid-cols-2 gap-2">
                        {CHART_TYPES.map((type) => (
                            <Button
                                key={type.value}
                                variant={config.chartType === type.value ? "default" : "outline"}
                                className="justify-start"
                                onClick={() => handleChange("chartType", type.value)}
                            >
                                {type.label}
                            </Button>
                        ))}
                    </div>
                </div>
            </GlassCardContent>
        </GlassCard>
    );
}
