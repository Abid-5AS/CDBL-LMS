"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr"; // Assuming useSWR is used elsewhere, or just useEffect fetch
import { apiFetcher } from "@/lib/apiClient";
import { User, Bell, Search, Filter, Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle, Users, FileText, ArrowUpRight, TrendingUp } from "lucide-react"; // Icons
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardPendingList } from "@/components/dashboards/dept-head/components/DashboardPendingList";
import { usePendingRequests } from "@/components/dashboards/dept-head/hooks/usePendingRequests";
import { EncashmentRequests } from "./sections/EncashmentRequests";
import { useUser } from "@/lib";

// Types
interface HRAdminStats {
    pendingRequests: number;
    employeesOnLeave: number;
    processedToday: number;
    avgApprovalTime: number;
    // ... other fields from original ...
    totalLeavesThisYear: number;
    dailyTarget: number;
    dailyProgress: number;
}

interface ModernHRAdminDashboardProps {
    initialStats?: any;
    initialKpis?: any;
    initialEncashmentRequests?: any[];
}

export function ModernHRAdminDashboard({
    initialStats,
    initialKpis,
    initialEncashmentRequests = [],
}: ModernHRAdminDashboardProps) {
    const user = useUser();
    const router = useRouter();
    const userName = user?.name?.split(" ")[0] || "Admin";

    // Fetch Pending Requests (Using shared hook)
    const {
        requests: pendingRequests,
        isLoading: isPendingLoading,
        totalRequests
    } = usePendingRequests({
        autoFetch: true,
        initialFilters: { status: 'PENDING' }
    });

    // Fetch Stats (Reusing the API endpoint)
    const { data: stats, isLoading } = useSWR<HRAdminStats>(
        "/api/dashboard/hr-admin/stats",
        apiFetcher,
        {
            fallbackData: initialStats,
            refreshInterval: 30000
        }
    );

    const pendingCount = totalRequests || stats?.pendingRequests || 0;

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900/50 p-6 lg:p-10 space-y-8">
            {/* 1. Hero Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Good Morning, {userName} <span className="text-2xl">👋</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
                        Here's what's happening in your organization today.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button size="lg" className="rounded-full shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white">
                        <User className="mr-2 h-4 w-4" />
                        New Employee
                    </Button>
                    <Button variant="outline" size="lg" className="rounded-full shadow-sm">
                        <FileText className="mr-2 h-4 w-4" />
                        Reports
                    </Button>
                </div>
            </div>

            {/* 2. KPI Cards - Vibrant Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Card 1: Pending Approvals (Primary Focus) */}
                <Card className="rounded-[24px] border-none shadow-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white relative overflow-hidden group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Clock className="w-24 h-24" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-indigo-100 font-medium text-sm uppercase tracking-wider">Pending Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-bold">{pendingCount}</span>
                            <span className="text-indigo-100/80 font-medium">requests</span>
                        </div>
                        <p className="text-indigo-100 mt-4 flex items-center gap-2 text-sm font-medium bg-black/10 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                            <AlertCircle className="w-4 h-4" />
                            Requires attention
                        </p>
                    </CardContent>
                </Card>

                {/* Card 2: Employees on Leave */}
                <Card className="rounded-[24px] border-none shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Who's Out Today</CardTitle>
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                            <Users className="w-4 h-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                            {stats?.employeesOnLeave || 0}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Employees absent
                        </p>
                        <div className="mt-4 flex -space-x-2 overflow-hidden">
                            {stats?.whoIsOut?.map((person) => (
                                <Avatar key={person.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-800 bg-slate-200">
                                    <AvatarImage src={person.image || undefined} alt={person.name} />
                                    <AvatarFallback>{person.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                            ))}
                            {(stats?.employeesOnLeave || 0) > (stats?.whoIsOut?.length || 0) && (
                                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-800 bg-slate-100 flex items-center justify-center text-xs text-slate-500 font-medium">
                                    +{(stats?.employeesOnLeave || 0) - (stats?.whoIsOut?.length || 0)}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Card 3: Processed Today */}
                <Card className="rounded-[24px] border-none shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Processed Today</CardTitle>
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                            {stats?.processedToday || 0}
                        </div>
                        <div className="mt-4 w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                            <div
                                className="bg-emerald-500 h-2 rounded-full transition-all duration-1000"
                                style={{ width: `${stats?.dailyProgress || 0}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-2 flex justify-between">
                            <span>{stats?.dailyProgress || 0}% of target</span>
                            <span>Goal: {stats?.dailyTarget || 10}</span>
                        </p>
                    </CardContent>
                </Card>

                {/* Card 4: Efficiency (Avg Time) */}
                <Card className="rounded-[24px] border-none shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Approval Speed</CardTitle>
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                            {stats?.avgApprovalTime?.toFixed(1) || "0.0"} <span className="text-lg font-normal text-slate-500">days</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Average turnaround time
                        </p>
                        <div className="mt-4 flex items-center gap-2">
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                                Target: ≤ 3.0 days
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* 3. Main Content - Pending Queue */}
                <div className="xl:col-span-2 space-y-6">
                    <DashboardPendingList
                        requests={pendingRequests || []}
                        isLoading={isPendingLoading}
                        totalPending={totalRequests}
                    />

                    {/* Encashment Requests */}
                    {initialEncashmentRequests.length > 0 && (
                        <div className="mt-8 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-emerald-500" />
                                    Encashment Requests
                                </h2>
                            </div>
                            <EncashmentRequests requests={initialEncashmentRequests} />
                        </div>
                    )}
                </div>

                {/* 4. Sidebar - Activity & Quick Info */}
                <div className="xl:col-span-1 space-y-6">
                    <Card className="border-none shadow-sm rounded-[24px] bg-white dark:bg-slate-800">
                        <CardHeader>
                            <CardTitle className="text-lg">Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[400px] w-full px-6 pb-6">
                                <div className="space-y-6">
                                    {stats?.recentActivity?.map((activity, i) => (
                                        <div key={activity.id || i} className="flex gap-4 relative">
                                            <div className="flex flex-col items-center">
                                                <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 ring-4 ring-white dark:ring-slate-800" />
                                                {i !== (stats.recentActivity.length - 1) && <div className="w-0.5 h-full bg-slate-100 dark:bg-slate-700 my-1" />}
                                            </div>
                                            <div className="pb-1">
                                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                    <span className="font-semibold">{activity.user}</span> {activity.action} leave for <span className="text-slate-600 dark:text-slate-400">{activity.target}</span>
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {new Date(activity.time).toLocaleDateString()} • {new Date(activity.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
                                        <div className="text-sm text-slate-500 text-center py-4">No recent activity</div>
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm rounded-[24px] bg-indigo-900 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <CalendarIcon className="w-32 h-32" />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-lg">Need Help?</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-indigo-200 text-sm mb-4">
                                Check the HR policy guide or contact system support if you're facing issues.
                            </p>
                            <Button
                                variant="secondary"
                                className="w-full bg-white text-indigo-900 hover:bg-indigo-50"
                                onClick={() => router.push("/guidelines")}
                            >
                                View Guidelines
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
