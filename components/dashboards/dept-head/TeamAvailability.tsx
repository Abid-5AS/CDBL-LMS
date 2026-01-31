"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getTeamAvailability, type TeamAvailabilityData } from "@/app/actions/dashboard-actions";
import { CalendarDays, UserMinus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function TeamAvailability() {
    const [data, setData] = useState<TeamAvailabilityData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetch() {
            try {
                const result = await getTeamAvailability();
                if (result.success && result.data) {
                    setData(result.data);
                } else {
                    setError(result.error || "Failed to load data");
                }
            } catch (err) {
                setError("An error occurred");
            } finally {
                setLoading(false);
            }
        }
        fetch();
    }, []);

    if (loading) return <AvailabilitySkeleton />;
    if (error) return <div className="text-sm text-red-500">{error}</div>;

    return (
        <div className="space-y-6">
            {/* On Leave Today */}
            <Card className="rounded-2xl border-l-[6px] border-l-amber-500 bg-card/50 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <UserMinus className="h-5 w-5 text-amber-500" />
                        Absent Today
                    </CardTitle>
                    <CardDescription>
                        {data?.onLeaveToday.length === 0
                            ? "Full team is present today"
                            : `${data?.onLeaveToday.length} member${data?.onLeaveToday.length !== 1 ? 's' : ''} away`}
                    </CardDescription>
                </CardHeader>
                {data && data.onLeaveToday.length > 0 && (
                    <CardContent className="space-y-4">
                        {data.onLeaveToday.map((person) => (
                            <div key={person.id} className="flex items-center justify-between p-3 bg-background rounded-xl border border-border/50">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9 border border-amber-200">
                                        <AvatarFallback className="bg-amber-100 text-amber-700">
                                            {person.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium text-sm">{person.name}</p>
                                        <p className="text-xs text-muted-foreground">{person.leaveType}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                                        Returning {new Date(person.returnDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                )}
            </Card>

            {/* Upcoming */}
            <Card className="rounded-2xl border-l-[6px] border-l-blue-500 bg-card/50 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <CalendarDays className="h-5 w-5 text-blue-500" />
                        Upcoming (7 Days)
                    </CardTitle>
                    <CardDescription>
                        {data?.upcomingLeaves.length === 0
                            ? "No planned leaves this week"
                            : `${data?.upcomingLeaves.length} planned absence${data?.upcomingLeaves.length !== 1 ? 's' : ''}`}
                    </CardDescription>
                </CardHeader>
                {data && data.upcomingLeaves.length > 0 && (
                    <CardContent className="space-y-4">
                        {data.upcomingLeaves.map((leave, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-background rounded-xl border border-border/50">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8 border border-blue-200">
                                        <AvatarFallback className="bg-blue-100 text-blue-700">
                                            {leave.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium text-sm">{leave.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(leave.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} • {leave.duration} day{leave.duration > 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md capitalize">
                                        {leave.leaveType.toLowerCase().replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                )}
            </Card>
        </div>
    );
}

function AvailabilitySkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
    );
}
