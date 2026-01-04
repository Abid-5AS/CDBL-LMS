"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, ExternalLink, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import {
    Button,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Badge,
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate, cn } from "@/lib/utils";
import { leaveTypeLabel } from "@/lib/ui/ui";

type PendingRequest = {
    id: number;
    type: string;
    startDate: string;
    endDate: string;
    workingDays: number;
    reason: string;
    status: string;
    requester: {
        name: string;
        email: string;
        avatar?: string;
    };
};

type DashboardPendingListProps = {
    requests: PendingRequest[];
    isLoading: boolean;
    totalPending: number;
};

export function DashboardPendingList({
    requests,
    isLoading,
    totalPending,
}: DashboardPendingListProps) {
    const router = useRouter();

    if (isLoading) {
        return (
            <Card className="rounded-[20px] border border-border/60 shadow-md h-full">
                <CardHeader>
                    <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                </CardHeader>
                <CardContent className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center space-x-4 animate-pulse">
                            <div className="h-10 w-10 bg-muted rounded-full" />
                            <div className="space-y-2 flex-1">
                                <div className="h-4 w-1/3 bg-muted rounded" />
                                <div className="h-3 w-1/2 bg-muted rounded" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    // Empty State
    if (requests.length === 0) {
        return (
            <Card className="rounded-[20px] border border-border/60 shadow-md h-full flex flex-col items-center justify-center p-8 text-center bg-card/50 backdrop-blur-sm">
                <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-foreground">All Caught Up!</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">
                    You have no pending leave requests to review at this time.
                </p>
            </Card>
        );
    }

    return (
        <Card className="rounded-[20px] border border-border/60 shadow-md bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-border/40 bg-muted/20">
                <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                        Pending Reviews
                        {totalPending > 0 && (
                            <Badge variant="secondary" className="rounded-full px-2 h-5 text-xs">
                                {totalPending}
                            </Badge>
                        )}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Requests awaiting your approval
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-8 gap-1.5"
                    onClick={() => router.push("/approvals")}
                >
                    View All <ExternalLink className="h-3 w-3" />
                </Button>
            </CardHeader>

            <div>
                <Table>
                    <TableHeader className="bg-muted/30 sticky top-0 z-10">
                        <TableRow className="hover:bg-transparent border-border/40">
                            <TableHead className="w-[180px]">Employee</TableHead>
                            <TableHead>Request Details</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests.slice(0, 5).map((req) => (
                            <TableRow
                                key={req.id}
                                className="cursor-pointer hover:bg-muted/40 border-border/40 transition-colors"
                                onClick={() => router.push(`/approvals/${req.id}`)}
                            >
                                <TableCell className="py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">
                                            {req.requester.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm text-foreground">
                                                {req.requester.name}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                                                {req.requester.email}
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="py-3">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "h-1.5 w-1.5 rounded-full",
                                                req.type === "MEDICAL" ? "bg-rose-500" :
                                                    req.type === "CASUAL" ? "bg-amber-500" : "bg-emerald-500"
                                            )} />
                                            <span className="text-sm font-medium">
                                                {leaveTypeLabel[req.type] || req.type}
                                            </span>
                                            <span className="text-muted-foreground text-xs">
                                                • {req.workingDays} days
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {formatDate(req.startDate)} → {formatDate(req.endDate)}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="py-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // In real implementation, this would open quick approve dialog
                                                router.push(`/approvals/${req.id}?action=approve`);
                                            }}
                                            title="Quick Approve"
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/approvals/${req.id}?action=return`);
                                            }}
                                            title="Return"
                                        >
                                            <RotateCcw className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            {requests.length > 5 && (
                <div className="p-3 bg-muted/20 border-t border-border/40 text-center">
                    <Button variant="link" size="sm" className="text-xs text-muted-foreground h-auto p-0" onClick={() => router.push("/approvals")}>
                        View {requests.length - 5} more requests
                    </Button>
                </div>
            )}
        </Card>
    );
}
