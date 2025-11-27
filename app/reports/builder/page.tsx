"use client";

import React, { useState } from "react";
import { Save, Play } from "lucide-react";
import { toast } from "sonner";

import { ConfigPanel, ReportConfig } from "@/components/reports/builder/ConfigPanel";
import { VisualBuilder } from "@/components/reports/builder/VisualBuilder";
import { Templates } from "@/components/reports/builder/Templates";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

export default function ReportBuilderPage() {
    const [config, setConfig] = useState<ReportConfig>({
        metric: "leave_count",
        dimension: "department",
        chartType: "bar",
    });

    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const handleExecute = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/reports/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ config }),
            });

            if (!res.ok) throw new Error("Failed to execute report");

            const result = await res.json();
            setData(result.data);
            toast.success("Report generated successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate report");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        // Placeholder for save functionality
        toast.info("Save functionality coming soon!");
    };

    return (
        <div className="container mx-auto space-y-8 p-6">
            <PageHeader
                title="Report Builder"
                description="Create custom reports and analytics"
            >
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Report
                    </Button>
                    <Button onClick={handleExecute} disabled={loading}>
                        <Play className="mr-2 h-4 w-4" />
                        {loading ? "Generating..." : "Generate Report"}
                    </Button>
                </div>
            </PageHeader>

            <Templates onSelect={(c) => {
                setConfig(c);
                // Optionally auto-execute
            }} />

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1">
                    <ConfigPanel config={config} onChange={setConfig} />
                </div>
                <div className="lg:col-span-2">
                    <VisualBuilder config={config} data={data} isLoading={loading} />
                </div>
            </div>
        </div>
    );
}
