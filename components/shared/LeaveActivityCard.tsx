"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface LeaveActivityData {
    label: string;
    type: 'EARNED' | 'CASUAL' | 'MEDICAL';
    used: number;
    total: number;
    color: string;
    size: number;
    unit: string;
}

interface CircleProgressProps {
    data: LeaveActivityData;
    index: number;
}

const CircleProgress = ({ data, index }: CircleProgressProps) => {
    const percentage = Math.min((data.used / data.total) * 100, 100);
    const circumference = 2 * Math.PI * (data.size / 2 - 10);
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    // Animation delay based on index
    const animationDelay = index * 0.2;

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
                    stiffness: 100,
                    damping: 15,
                }}
            >
                {/* Background circle */}
                <circle
                    cx={data.size / 2}
                    cy={data.size / 2}
                    r={data.size / 2 - 10}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-gray-200 dark:text-gray-700 opacity-30"
                />
                
                {/* Progress circle */}
                <motion.circle
                    cx={data.size / 2}
                    cy={data.size / 2}
                    r={data.size / 2 - 10}
                    fill="none"
                    stroke={data.color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{
                        duration: 1.5,
                        delay: animationDelay + 0.3,
                        ease: "easeOut",
                    }}
                    className="drop-shadow-lg"
                />
            </motion.svg>

            {/* Center content */}
            <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center text-center"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                    duration: 0.6,
                    delay: animationDelay + 0.5,
                }}
            >
                <div className="text-lg font-bold text-foreground">{data.used}</div>
                <div className="text-xs text-muted-foreground font-medium">
                    of {data.total} {data.unit}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                    {Math.round(percentage)}%
                </div>
            </motion.div>
        </div>
    );
};

interface LeaveActivityCardProps {
    title?: string;
    activities: LeaveActivityData[];
    className?: string;
}

export function LeaveActivityCard({
    title = "Leave Balance Overview",
    activities,
    className,
}: LeaveActivityCardProps) {
    return (
        <div
            className={cn(
                "relative w-full p-6 rounded-2xl border bg-card",
                "shadow-lg dark:shadow-none",
                className
            )}
        >
            <div className="flex flex-col items-center gap-6">
                <motion.h3
                    className="text-xl font-semibold text-foreground"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {title}
                </motion.h3>

                <div className="flex items-center justify-center gap-4 flex-wrap">
                    {activities.map((activity, index) => (
                        <div key={activity.type} className="flex flex-col items-center gap-3">
                            <CircleProgress data={activity} index={index} />
                            <motion.div
                                className="text-center"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.2 + 0.8 }}
                            >
                                <div className="text-sm font-medium text-foreground">
                                    {activity.label}
                                </div>
                                <div
                                    className="text-xs font-semibold mt-1"
                                    style={{ color: activity.color }}
                                >
                                    {activity.used}/{activity.total} {activity.unit}
                                </div>
                            </motion.div>
                        </div>
                    ))}
                </div>

                {/* Summary */}
                <motion.div
                    className="flex items-center justify-center gap-6 text-sm text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 1.2 }}
                >
                    <div className="text-center">
                        <div className="font-medium">Total Used</div>
                        <div className="text-foreground font-semibold">
                            {activities.reduce((sum, act) => sum + act.used, 0)} days
                        </div>
                    </div>
                    <div className="w-px h-6 bg-border"></div>
                    <div className="text-center">
                        <div className="font-medium">Remaining</div>
                        <div className="text-foreground font-semibold">
                            {activities.reduce((sum, act) => sum + (act.total - act.used), 0)} days
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

// Helper function to create leave activity data
export function createLeaveActivityData(balances: {
    earnedUsed: number;
    earnedTotal: number;
    casualUsed: number;
    casualTotal: number;
    medicalUsed: number;
    medicalTotal: number;
}): LeaveActivityData[] {
    return [
        {
            label: "Earned Leave",
            type: 'EARNED',
            used: balances.earnedUsed,
            total: balances.earnedTotal,
            color: "#FF2D55", // Red for primary leave type
            size: 120,
            unit: "days",
        },
        {
            label: "Casual Leave", 
            type: 'CASUAL',
            used: balances.casualUsed,
            total: balances.casualTotal,
            color: "#A3F900", // Green for casual leave
            size: 100,
            unit: "days",
        },
        {
            label: "Medical Leave",
            type: 'MEDICAL',
            used: balances.medicalUsed,
            total: balances.medicalTotal,
            color: "#04C7DD", // Blue for medical leave
            size: 80,
            unit: "days",
        },
    ];
}