"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { apiFetcher } from "@/lib/apiClient";
import {
    LayoutDashboard,
    TrendingUp,
    AlertTriangle,
    Users,
    CheckCircle,
    Clock,
    ChevronRight,
    ArrowUp,
    ArrowDown
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    PendingApprovals as PendingLeaveRequestsTable,
} from "@/components/dashboards/hr-admin/sections";
import { useUser } from "@/lib";

// Chart Components (Lazy loaded in original, importing strictly if available for now or simplified)
// Use simple placeholders for charts in this iteration to ensure stability unless we confirm imports.
// Original used: import { AnalyticsBarChart } from "@/components/dashboards/shared/AnalyticsChart";

interface HRHeadStats {
    pending: number;
    onLeave: number;
    returned: number;
    upcoming: number;
    monthlyRequests: number;
    newHires: number;
    complianceScore: number;
    totalEmployees: number;
    avgCasualDays: number;
    // ... other fields
    departmentPerformance: Array<{
        name: string;
        pending: number;
        // other fields if needed for future
    }>;
    recentActivity: Array<{
        id: number;
        action: string;
        approver: string;
        employee: string;
        leaveType: string;
        decidedAt: string;
    }>;
}

export function ModernHRHeadDashboard() {
    const user = useUser();
    const { data: stats, isLoading } = useSWR<HRHeadStats>(
        "/api/dashboard/hr-head/stats",
        apiFetcher,
        { refreshInterval: 60000 }
    );

    const complianceColor = (score: number) => {
        if (score >= 90) return "text-emerald-500";
        if (score >= 75) return "text-amber-500";
        return "text-red-500";
    };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900/50 p-6 lg:p-10 space-y-8">
            {/* 1. Strategic Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Strategic Overview
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
                        Organization health and workforce analytics.
                    </p>
                </div>
                <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-2 rounded-full shadow-sm px-6 border border-slate-200 dark:border-slate-700">
                    <div className="text-sm font-medium text-slate-500">System Health</div>
                    <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
                    <div className={`text-lg font-bold flex items-center gap-1 ${isLoading ? 'opacity-50' : complianceColor(stats?.complianceScore || 0)}`}>
                        {stats?.complianceScore || "--"}%
                        <span className="text-xs font-normal text-slate-500">Compliance</span>
                    </div>
                </div>
            </div>

            {/* 2. Insight Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">

                {/* Metric 1: On Leve (Contextual) */}
                <Card className="rounded-[24px] border-none shadow-sm bg-white dark:bg-slate-800 p-2">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-[20px] p-6 h-full flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Users className="w-32 h-32 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-blue-900 dark:text-blue-100 font-medium">Workforce Active</h3>
                            <div className="text-4xl font-bold text-blue-700 dark:text-blue-300 mt-2">
                                {stats ? ((stats.totalEmployees - stats.onLeave) / stats.totalEmployees * 100).toFixed(0) : "--"}%
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                            <span className="font-semibold">{stats?.onLeave || 0}</span> on leave today
                        </div>
                    </div>
                </Card>

                {/* Metric 2: Monthly Volume */}
                <Card className="rounded-[24px] border-none shadow-sm bg-white dark:bg-slate-800 p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <h3 className="text-slate-500 font-medium">Monthly Requests</h3>
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-none">
                                <ArrowUp className="w-3 h-3 mr-1" />
                                12%
                            </Badge>
                        </div>
                        <div className="text-4xl font-bold text-slate-900 dark:text-slate-100 mt-3">
                            {stats?.monthlyRequests || 0}
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                        vs last month
                    </p>
                </Card>

                {/* Metric 3: Pending Decisions */}
                <Card className={`rounded-[24px] border-none shadow-sm p-6 flex flex-col justify-between ${stats?.pending && stats.pending > 10 ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200' : 'bg-white dark:bg-slate-800'}`}>
                    <div>
                        <div className="flex items-center justify-between">
                            <h3 className={`${stats?.pending && stats.pending > 10 ? 'text-amber-800 dark:text-amber-200' : 'text-slate-500'} font-medium`}>
                                Pending Review
                            </h3>
                            <Clock className={`w-5 h-5 ${stats?.pending && stats.pending > 10 ? 'text-amber-600' : 'text-slate-400'}`} />
                        </div>
                        <div className="text-4xl font-bold text-slate-900 dark:text-slate-100 mt-3">
                            {stats?.pending || 0}
                        </div>
                    </div>
                    <div className="mt-4">
                        <Button size="sm" variant="link" className="p-0 h-auto text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                            Go to Approvals <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </Card>

                {/* Metric 4: New Hires */}
                <Card className="rounded-[24px] border-none shadow-sm bg-purple-50 dark:bg-purple-900/10 p-6 flex flex-col justify-between md:col-span-3 xl:col-span-1">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-purple-800 dark:text-purple-200 font-medium">New Hires</h3>
                            <div className="text-4xl font-bold text-purple-900 dark:text-purple-100 mt-2">
                                +{stats?.newHires || 0}
                            </div>
                        </div>
                        <div className="bg-white dark:bg-purple-900/50 p-3 rounded-xl">
                            <Users className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                    <p className="text-sm text-purple-700 dark:text-purple-300 mt-2">
                        Joined this month
                    </p>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 3. Alerts & Escalations (Left Column) */}
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        Critical Attention
                    </h2>

                    {(stats?.pending && stats.pending > 20) && (
                        <Card className="rounded-[20px] bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/50 shadow-sm">
                            <CardContent className="p-5 flex gap-4">
                                <div className="shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-red-900 dark:text-red-200">High Backlog detected</h4>
                                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                        There are over 20 pending requests. Consider delegating certain approval chains.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Placeholder for Escalation List from stats if we had real props */}
                    <Card className="rounded-[24px] border-none shadow-sm bg-white dark:bg-slate-800">
                        <CardHeader>
                            <CardTitle className="text-lg">Returned Requests</CardTitle>
                            <CardDescription>Recently sent back for modification</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
                                No recent escalations
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 4. Trends & Analysis (Middle & Right - Spanning 2 cols) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <LayoutDashboard className="w-5 h-5 text-indigo-500" />
                            Department Analytics
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Department Performance Chart Wrapper */}
                        <Card className="rounded-[24px] border-none shadow-sm bg-white dark:bg-slate-800 md:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-lg">Pending by Department</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {/* Simple visual bar chart using CSS grids if no library available */}
                                <div className="space-y-4">
                                    {stats?.departmentPerformance?.slice(0, 5).map((dept, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-medium text-slate-700 dark:text-slate-300">{dept.name}</span>
                                                <span className="text-slate-500">{dept.pending} pending</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-500 rounded-full"
                                                    style={{ width: `${Math.min((dept.pending / 20) * 100, 100)}%` }} // Arbitrary scale
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    {(!stats?.departmentPerformance || stats.departmentPerformance.length === 0) && (
                                        <div className="h-40 flex items-center justify-center text-slate-400">Loading data...</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="rounded-[24px] border-none shadow-sm bg-white dark:bg-slate-800">
                        <CardHeader>
                            <CardTitle className="text-lg">Your Approval Queue</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <PendingLeaveRequestsTable hideHeader />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
