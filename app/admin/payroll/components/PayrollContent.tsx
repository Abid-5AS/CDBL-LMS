"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

export function PayrollContent() {
    const { t } = useTranslation("admin");
    const [month, setMonth] = useState<string>(new Date().getMonth().toString());
    const [year, setYear] = useState<string>(new Date().getFullYear().toString());
    const [isLoading, setIsLoading] = useState(false);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

    const handleExport = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/payroll/export?month=${month}&year=${year}`);

            if (!response.ok) {
                throw new Error("Failed to generate report");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `payroll_export_${months[parseInt(month)]}_${year}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success("Payroll report downloaded successfully");
        } catch (error) {
            console.error("Export error:", error);
            toast.error("Failed to download payroll report");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Payroll Management</h1>
                    <p className="text-muted-foreground mt-2">
                        Generate and download monthly leave reports for payroll processing.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5 text-primary" />
                            Monthly Report
                        </CardTitle>
                        <CardDescription>
                            Export leave data including LWP and encashment details.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="month">Month</Label>
                                <Select value={month} onValueChange={setMonth}>
                                    <SelectTrigger id="month">
                                        <SelectValue placeholder="Select month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {months.map((m, i) => (
                                            <SelectItem key={i} value={i.toString()}>
                                                {m}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="year">Year</Label>
                                <Select value={year} onValueChange={setYear}>
                                    <SelectTrigger id="year">
                                        <SelectValue placeholder="Select year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {years.map((y) => (
                                            <SelectItem key={y} value={y}>
                                                {y}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Button
                            className="w-full"
                            onClick={handleExport}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download CSV
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="opacity-50">
                    <CardHeader>
                        <CardTitle>Payroll Integration</CardTitle>
                        <CardDescription>Direct integration with payroll software</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Coming soon in Phase 2. Will support direct API sync with major payroll providers.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
