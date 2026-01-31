"use client";

import useSWR from "swr";
import { useRouter } from "next/navigation";
import { apiFetcher } from "@/lib/apiClient";
import {
    Users,
    Activity,
    Shield,
    Settings,
    Database,
    AlertCircle,
    Server,
    FileText,
    UserPlus,
    Building2,
    Calendar
} from "lucide-react";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Shared Patterns
import { RoleBasedDashboard, RoleKPICard } from "../shared/RoleBasedDashboard";
import { ResponsiveDashboardGrid, DashboardSection } from "../shared/ResponsiveDashboardGrid";
import { KPIGridSkeleton } from "@/components/shared/skeletons";
import { Role } from "@/lib/enums";
import { formatDistanceToNow } from "date-fns";

// Charts
import { AnalyticsPieChart, AnalyticsBarChart } from "@/components/dashboards/shared";

interface AdminStats {
    totalUsers: number;
    privilegedUsers: number;
    totalPolicies: number;
    upcomingHolidays: number;
    usersByRole: Array<{ role: string; count: number }>;
    recentLogs: Array<{
        id: string;
        action: string;
        target: string;
        details: any;
        createdAt: string;
        user: string;
    }>;
    systemHealth: {
        status: "healthy" | "degraded";
        latency: number;
        message: string;
    };
}

export function SystemAdminDashboard() {
    const router = useRouter();

    const { data: stats, isLoading } = useSWR<AdminStats>(
        "/api/dashboard/admin/stats",
        apiFetcher,
        { refreshInterval: 30000 }
    );

    return (
        <RoleBasedDashboard
            role={Role.SYSTEM_ADMIN}
            title="System Console"
            description="System health, user management, and configuration"
            animate={true}
            backgroundVariant="transparent"
        >
            <div className="space-y-8">
                {/* 1. Quick Administration - Top Priority */}
                <DashboardSection title="Administration">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Button
                            className="h-auto py-4 flex flex-col items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 shadow-none dark:bg-primary/20 dark:hover:bg-primary/30"
                            onClick={() => router.push("/employees?action=create")}
                        >
                            <UserPlus className="w-6 h-6" />
                            <span>Create New User</span>
                        </Button>
                        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => router.push("/employees")}>
                            <Users className="w-6 h-6 text-blue-500" />
                            <span>User Directory</span>
                        </Button>
                        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => router.push("/admin/departments")}>
                            <Building2 className="w-6 h-6 text-orange-500" />
                            <span>Departments</span>
                        </Button>
                        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => router.push("/holidays")}>
                            <Calendar className="w-6 h-6 text-emerald-500" />
                            <span>Holidays</span>
                        </Button>
                    </div>
                </DashboardSection>

                {/* 2. System Health & Metrics */}
                <DashboardSection
                    title="System Health & Metrics"
                    description="Real-time operational status"
                    loadingFallback={<KPIGridSkeleton />}
                >
                    <ResponsiveDashboardGrid columns="1:2:4:4" gap="md">
                        {/* 1. System Health */}
                        <RoleKPICard
                            title="System Status"
                            value={stats?.systemHealth.status === "healthy" ? "Healthy" : "Degraded"}
                            subtitle={`${stats?.systemHealth.latency || 0}ms db latency`}
                            icon={stats?.systemHealth.status === "healthy" ? Activity : AlertCircle}
                            role={Role.SYSTEM_ADMIN}
                            color={stats?.systemHealth.status === "healthy" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}
                            bgColor={stats?.systemHealth.status === "healthy" ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-red-50 dark:bg-red-900/20"}
                            variant={stats?.systemHealth.status !== "healthy" ? "highlight" : "default"}
                        />

                        {/* 2. Total Users */}
                        <RoleKPICard
                            title="Total Users"
                            value={stats?.totalUsers || 0}
                            subtitle={`${stats?.privilegedUsers || 0} privileged accounts`}
                            icon={Users}
                            role={Role.SYSTEM_ADMIN}
                            color="text-blue-600 dark:text-blue-400"
                            bgColor="bg-blue-50 dark:bg-blue-900/20"
                            onClick={() => router.push("/employees")}
                            clickLabel="Manage Users"
                        />

                        {/* 3. Policies */}
                        <RoleKPICard
                            title="Active Policies"
                            value={stats?.totalPolicies || 0}
                            subtitle="Leave configuration rules"
                            icon={Shield}
                            role={Role.SYSTEM_ADMIN}
                            color="text-purple-600 dark:text-purple-400"
                            bgColor="bg-purple-50 dark:bg-purple-900/20"
                        />

                        {/* 4. Infrastructure */}
                        <RoleKPICard
                            title="Infrastructure"
                            value="Online"
                            subtitle="Database & API operational"
                            icon={Server}
                            role={Role.SYSTEM_ADMIN}
                            color="text-slate-600 dark:text-slate-400"
                            bgColor="bg-slate-50 dark:bg-slate-900/20"
                        />
                    </ResponsiveDashboardGrid>
                </DashboardSection>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">

                    {/* Left Column: Charts (7 cols) */}
                    <div className="xl:col-span-7 space-y-6">
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                    <Users className="w-5 h-5 text-primary" />
                                    User Distribution
                                </CardTitle>
                                <CardDescription>Active users by system role</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {stats && stats.usersByRole.length > 0 ? (
                                    <div className="space-y-6 py-4">
                                        {stats.usersByRole.map((role, index) => {
                                            const total = stats.usersByRole.reduce((sum, r) => sum + r.count, 0);
                                            const percentage = ((role.count / total) * 100).toFixed(1);
                                            const colors = [
                                                "bg-blue-500",
                                                "bg-emerald-500",
                                                "bg-purple-500",
                                                "bg-amber-500",
                                                "bg-pink-500",
                                                "bg-cyan-500"
                                            ];

                                            return (
                                                <div key={role.role} className="space-y-2">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                                                            <span className="font-medium text-foreground">
                                                                {role.role.replace(/_/g, " ")}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-muted-foreground">{percentage}%</span>
                                                            <span className="font-semibold text-foreground min-w-[3ch] text-right">
                                                                {role.count}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${colors[index % colors.length]} transition-all duration-500`}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div className="pt-4 mt-4 border-t border-border">
                                            <div className="flex items-center justify-between text-sm font-semibold">
                                                <span className="text-foreground">Total Users</span>
                                                <span className="text-foreground">
                                                    {stats.usersByRole.reduce((sum, r) => sum + r.count, 0)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                                        Loading user data...
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Audit Logs (5 cols) */}
                    <div className="xl:col-span-5 space-y-6">
                        <Card className="h-full flex flex-col">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-amber-500" />
                                        Assessment Logs
                                    </CardTitle>
                                    <CardDescription>Recent system activities</CardDescription>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => router.push("/admin/audit")}>
                                    View All
                                </Button>
                            </CardHeader>
                            <CardContent className="flex-1 p-0">
                                <ScrollArea className="h-[400px]">
                                    <div className="space-y-1 p-4 pt-0">
                                        {stats?.recentLogs.map((log) => (
                                            <div key={log.id} className="flex flex-col space-y-1 border-b last:border-0 border-border pb-3 mb-3 last:pb-0 last:mb-0">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-foreground">
                                                        {log.action}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-5">
                                                        {log.user}
                                                    </Badge>
                                                    <span>•</span>
                                                    <span className="truncate max-w-[200px]">{log.target}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {(!stats || stats.recentLogs.length === 0) && (
                                            <div className="text-center py-10 text-muted-foreground text-sm">
                                                No recent logs found
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                </div>

            </div>
        </RoleBasedDashboard>
    );
}
