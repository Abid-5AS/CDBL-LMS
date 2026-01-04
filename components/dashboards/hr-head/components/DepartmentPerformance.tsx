"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, AlertCircle } from "lucide-react";

interface DepartmentPerformanceProps {
    data: Array<{
        name: string;
        pending: number;
    }>;
}

export function DepartmentPerformance({ data }: DepartmentPerformanceProps) {
    const maxPending = Math.max(...data.map(d => d.pending), 1);

    return (
        <Card className="surface-card h-full">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-500" />
                    Department Workload
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-5">
                    {data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                            <AlertCircle className="w-10 h-10 mb-2 opacity-20" />
                            <p>No department data available</p>
                        </div>
                    ) : (
                        data.slice(0, 5).map((dept, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-medium text-foreground">{dept.name}</span>
                                    <Badge variant={dept.pending > 10 ? "destructive" : "secondary"}>
                                        {dept.pending} pending
                                    </Badge>
                                </div>
                                <div className="h-2.5 w-full bg-muted/50 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                                        style={{ width: `${(dept.pending / maxPending) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
