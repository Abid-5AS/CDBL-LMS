"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet } from "lucide-react";
import { exportReport, type ExportContext, type ExportPayload } from "@/lib/exportUtils";

type ExportSectionProps = {
  context?: ExportContext;
  payload?: ExportPayload;
  title?: string;
  description?: string;
  showFilters?: boolean;
};

/**
 * Unified Export Section Component
 * Replaces components/reports/ExportSection.tsx
 * Uses lib/exportUtils.ts for consistent export handling
 */
export function ExportSection({
  context = "reports",
  payload,
  title = "Report Export",
  description = "Download comprehensive reports for audit and record-keeping purposes",
  showFilters = true,
}: ExportSectionProps) {
  const handleExport = async (type: "pdf" | "csv") => {
    try {
      await exportReport(type, context, payload);
    } catch (error) {
      // Error handling is done in exportUtils
      console.error("Export failed:", error);
    }
  };

  // Build filter summary text
  const filterSummary = payload
    ? [
        payload.duration && `Duration: ${payload.duration === "month" ? "This Month" : payload.duration === "quarter" ? "This Quarter" : "This Year"}`,
        payload.department && "Department filtered",
        payload.leaveType && "Leave type filtered",
        payload.status && "Status filtered",
      ]
        .filter(Boolean)
        .join(" • ")
    : null;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => handleExport("csv")}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export as CSV
          </Button>
          <Button
            onClick={() => handleExport("pdf")}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Export as PDF
          </Button>
          {showFilters && filterSummary && (
            <p className="text-sm text-muted-foreground ml-auto">
              {filterSummary}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

