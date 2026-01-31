"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CriticalAttentionProps {
    pendingCount: number;
    returnedCount: number;
}

export function CriticalAttention({ pendingCount, returnedCount }: CriticalAttentionProps) {
    const hasAlerts = pendingCount > 20 || returnedCount > 0;

    if (!hasAlerts) {
        return (
            <Card className="surface-card bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/50 h-full">
                <CardContent className="flex flex-col items-center justify-center h-full py-10 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                        <ShieldCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-200">System Healthy</h3>
                    <p className="text-emerald-700 dark:text-emerald-400 mt-1 max-w-[250px]">
                        No critical backlogs or escalations requiring your immediate attention.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4 h-full">
            {pendingCount > 20 && (
                <Card className="surface-card border-l-4 border-l-red-500 shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-foreground">High Approval Backlog</h4>
                                <p className="text-sm text-muted-foreground mt-1 mb-3">
                                    {pendingCount} requests are pending. This exceeds the recommended threshold.
                                </p>
                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                    Review Queue <ArrowRight className="w-3 h-3 ml-2" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {returnedCount > 0 && (
                <Card className="surface-card border-l-4 border-l-amber-500 shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-foreground">Recent Returns</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {returnedCount} requests were returned for modification recently.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
