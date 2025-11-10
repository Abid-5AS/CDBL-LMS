"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface AnalyticsData {
    label: string;
    current: number;
    target: number;
    color: string;
    size: number;
    unit: string;
    trend?: "up" | "down" | "stable";
}

interface AnalyticsCircleProps {
    data: AnalyticsData;
    index: number;
}

const AnalyticsCircle = ({ data, index }: AnalyticsCircleProps) => {
    const percentage = Math.min((data.current / data.target) * 100, 100);
    const circumference = 2 * Math.PI * (data.size / 2 - 8);
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const animationDelay = index * 0.15;

    const getTrendIcon = () => {
        switch (data.trend) {
            case "up": return "↗";
            case "down": return "↘";
            default: return "→";
        }
    };

    const getTrendColor = () => {
        switch (data.trend) {
            case "up": return "text-green-500";
            case "down": return "text-red-500";
            default: return "text-gray-400";
        }
    };

    return (
        <div className="relative flex items-center justify-center">
            <motion.svg
                width={data.size}
                height={data.size}
                className="transform -rotate-90"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: -90 }}
                transition={{
                    duration: 0.8,
                    delay: animationDelay,
                    type: "spring",
                    stiffness: 120,
                    damping: 12,
                }}
            >
                {/* Background circle */}
                <circle
                    cx={data.size / 2}
                    cy={data.size / 2}
                    r={data.size / 2 - 8}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    className="text-gray-200 dark:text-gray-700 opacity-20"
                />
                
                {/* Progress circle */}
                <motion.circle
                    cx={data.size / 2}
                    cy={data.size / 2}
                    r={data.size / 2 - 8}
                    fill="none"
                    stroke={data.color}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{
                        duration: 1.8,
                        delay: animationDelay + 0.4,
                        ease: [0.4, 0, 0.2, 1],
                    }}
                    className="filter drop-shadow-sm"
                />

                {/* Glow effect for high values */}
                {percentage > 80 && (
                    <motion.circle
                        cx={data.size / 2}
                        cy={data.size / 2}
                        r={data.size / 2 - 8}
                        fill="none"
                        stroke={data.color}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        transition={{
                            duration: 1.8,
                            delay: animationDelay + 0.6,
                        }}
                        className="filter blur-sm"
                    />
                )}
            </motion.svg>

            {/* Center content */}
            <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center text-center"
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                    duration: 0.7,
                    delay: animationDelay + 0.6,
                    type: "spring",
                    stiffness: 200,
                }}
            >
                <div className="text-lg font-bold text-foreground">
                    {data.current}
                </div>
                <div className="text-[10px] text-muted-foreground font-medium">
                    {data.unit}
                </div>
                {data.trend && (
                    <div className={cn("text-xs mt-0.5", getTrendColor())}>
                        {getTrendIcon()}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

interface HRAnalyticsCardProps {
    title?: string;
    metrics: AnalyticsData[];
    className?: string;
    subtitle?: string;
}

export function HRAnalyticsCard({
    title = "HR Analytics",
    metrics,
    className,
    subtitle,
}: HRAnalyticsCardProps) {
    const overallEfficiency = metrics.length > 0 
        ? Math.round(metrics.reduce((sum, metric) => 
            sum + (metric.current / metric.target * 100), 0) / metrics.length)
        : 0;

    return (
        <div
            className={cn(
                "relative w-full p-6 rounded-2xl border bg-card",
                "shadow-sm hover:shadow-md transition-shadow duration-300",
                className
            )}
        >
            <div className="flex flex-col gap-5">
                {/* Header */}
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h3 className="text-lg font-semibold text-foreground">
                        {title}
                    </h3>
                    {subtitle && (
                        <p className="text-sm text-muted-foreground mt-1">
                            {subtitle}
                        </p>
                    )}
                </motion.div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 place-items-center">
                    {metrics.map((metric, index) => (
                        <div key={metric.label} className="flex flex-col items-center gap-2">
                            <AnalyticsCircle data={metric} index={index} />
                            <motion.div
                                className="text-center"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.15 + 0.8 }}
                            >
                                <div className="text-xs font-medium text-foreground">
                                    {metric.label}
                                </div>
                                <div
                                    className="text-[10px] font-semibold mt-0.5"
                                    style={{ color: metric.color }}
                                >
                                    {metric.current}/{metric.target}
                                </div>
                            </motion.div>
                        </div>
                    ))}
                </div>

                {/* Overall Summary */}
                <motion.div
                    className="flex items-center justify-center gap-4 pt-3 border-t border-border"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 1.0 }}
                >
                    <div className="text-center">
                        <div className="text-xs text-muted-foreground">Overall Efficiency</div>
                        <div className={cn(
                            "text-sm font-bold mt-0.5",
                            overallEfficiency >= 80 ? "text-green-600" :
                            overallEfficiency >= 60 ? "text-yellow-600" : "text-red-600"
                        )}>
                            {overallEfficiency}%
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

// Helper function to create HR analytics data
export function createHRAnalyticsData(data: {
    pendingApprovals: number;
    maxPendingTarget: number;
    processedToday: number;
    dailyTarget: number;
    teamUtilization: number;
    utilizationTarget: number;
    complianceScore: number;
    complianceTarget: number;
}): AnalyticsData[] {
    return [
        {
            label: "Pending",
            current: data.pendingApprovals,
            target: data.maxPendingTarget,
            color: "#FF6B6B", // Red for pending items (lower is better)
            size: 80,
            unit: "requests",
            trend: data.pendingApprovals > data.maxPendingTarget * 0.8 ? "up" : 
                   data.pendingApprovals < data.maxPendingTarget * 0.3 ? "down" : "stable"
        },
        {
            label: "Processed",
            current: data.processedToday,
            target: data.dailyTarget,
            color: "#4ECDC4", // Teal for processed items
            size: 80,
            unit: "today",
            trend: data.processedToday >= data.dailyTarget ? "up" : "down"
        },
        {
            label: "Utilization",
            current: data.teamUtilization,
            target: data.utilizationTarget,
            color: "#45B7D1", // Blue for utilization
            size: 80,
            unit: "%",
            trend: data.teamUtilization >= data.utilizationTarget * 0.9 ? "up" : "down"
        },
        {
            label: "Compliance",
            current: data.complianceScore,
            target: data.complianceTarget,
            color: "#96CEB4", // Green for compliance
            size: 80,
            unit: "score",
            trend: data.complianceScore >= data.complianceTarget * 0.95 ? "up" : 
                   data.complianceScore < data.complianceTarget * 0.8 ? "down" : "stable"
        },
    ];
}