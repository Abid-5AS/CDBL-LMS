"use client";

import { Avatar, AvatarFallback, Badge, Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui";
import { getRoleBadgeClasses, getRoleLabel } from "@/lib/ui/ui-utils";
import { cn, formatDate } from "@/lib/utils";
import { Mail, Phone, Calendar, Briefcase, User as UserIcon, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import type { EmployeeRecord } from "./EmployeeList";

interface EmployeeCardProps {
    employee: EmployeeRecord;
}

export function EmployeeCard({ employee }: EmployeeCardProps) {
    const isOnLeave = employee.leaves && employee.leaves.length > 0;
    const leaveInfo = isOnLeave ? employee.leaves[0] : null;

    // Generate initials for avatar
    const initials = useMemo(() => {
        return employee.name
            .split(" ")
            .map((n: string) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
    }, [employee.name]);

    // Generate a consistent gradient based on name length/char code roughly
    const gradientClass = useMemo(() => {
        const gradients = [
            "from-indigo-500 to-purple-500",
            "from-pink-500 to-rose-500",
            "from-blue-500 to-cyan-500",
            "from-emerald-500 to-teal-500",
            "from-orange-500 to-amber-500",
            "from-violet-500 to-fuchsia-500",
        ];
        const index = employee.name.length % gradients.length;
        return gradients[index];
    }, [employee.name]);

    return (
        <div className="group relative flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
            <div className="flex items-start justify-between">
                <div className="flex gap-4">
                    <Avatar className={cn("h-14 w-14 border-2 border-background shadow-sm bg-gradient-to-br", gradientClass)}>
                        <AvatarFallback className="bg-transparent text-white font-semibold">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="font-semibold text-lg leading-tight truncate max-w-[180px]" title={employee.name}>
                            {employee.name}
                        </h3>
                        <div className="mt-1 flex items-center gap-2">
                            <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5", getRoleBadgeClasses(employee.role))}>
                                {getRoleLabel(employee.role)}
                            </Badge>
                            {isOnLeave ? (
                                <Badge variant="default" className="text-[10px] h-5 px-1.5 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-200">
                                    On Leave
                                </Badge>
                            ) : (
                                <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                                    <span className="block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    Active
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-5 space-y-2.5">
                <div className="flex items-center text-sm text-muted-foreground gap-2.5">
                    <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                    <span className="truncate">{employee.department || "No Department"}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground gap-2.5">
                    <Mail className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                    <span className="truncate" title={employee.email}>{employee.email}</span>
                </div>
                {employee.profile?.phone && (
                    <div className="flex items-center text-sm text-muted-foreground gap-2.5">
                        <Phone className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                        <span className="truncate">{employee.profile.phone}</span>
                    </div>
                )}
                {isOnLeave && leaveInfo && (
                    <div className="mt-2 rounded-md bg-amber-500/5 border border-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-500 flex items-start gap-2">
                        <Calendar className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span>
                            On {leaveInfo.type} leave until <strong>{formatDate(leaveInfo.endDate)}</strong>
                        </span>
                    </div>
                )}
            </div>

            <div className="mt-5 pt-4 border-t border-border/50 flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-mono">
                    {employee.empCode || ""}
                </span>

                <Link href={`/employees/${employee.id}`} className="absolute inset-0 z-10" aria-label="View profile">
                    <span className="sr-only">View Profile</span>
                </Link>

                <Button variant="ghost" size="sm" className="h-7 px-0 text-primary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    View Profile <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
}
