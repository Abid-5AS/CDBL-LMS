"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
} from "@/components/ui";
import { FileText, FileSpreadsheet } from "lucide-react";
import {
  exportReport,
  type ExportContext,
  type ExportPayload,
} from "@/lib/exportUtils";

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
        payload.duration &&
          `Duration: ${
            payload.duration === "month"
              ? "This Month"
              : payload.duration === "quarter"
              ? "This Quarter"
              : "This Year"
          }`,
        payload.department && "Department filtered",
        payload.leaveType && "Leave type filtered",
        payload.status && "Status filtered",
      ]
        .filter(Boolean)
        .join(" • ")
    : null;

  return (
    <Card className="neo-card">
      <CardHeader className="border-b border-[var(--shell-card-border)]">
        <CardTitle className="text-lg font-semibold text-[var(--color-text-primary)]">
          {title}
        </CardTitle>
        <CardDescription className="text-sm text-[var(--color-text-secondary)]">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => handleExport("csv")}
            variant="outline"
            className="neo-button flex items-center gap-2 rounded-xl border-[var(--shell-card-border)] hover:border-[rgb(91,94,252)]/50 hover:bg-[rgba(91,94,252,0.05)] transition-all duration-200"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export as CSV
          </Button>
          <Button
            onClick={() => handleExport("pdf")}
            variant="outline"
            className="neo-button flex items-center gap-2 rounded-xl border-[var(--shell-card-border)] hover:border-[rgb(91,94,252)]/50 hover:bg-[rgba(91,94,252,0.05)] transition-all duration-200"
          >
            <FileText className="h-4 w-4" />
            Export as PDF
          </Button>
          {showFilters && filterSummary && (
            <p className="text-sm text-[var(--color-text-secondary)] ml-auto font-medium">
              {filterSummary}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
