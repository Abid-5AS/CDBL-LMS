"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

type ExportSectionProps = {
  duration: string;
  department: string | null;
  leaveType: string | null;
};

export function ExportSection({ duration, department, leaveType }: ExportSectionProps) {
  const handleExport = async (format: "csv" | "pdf") => {
    try {
      // Build query params
      const params = new URLSearchParams();
      params.set("duration", duration);
      if (department) params.set("department", department);
      if (leaveType) params.set("leaveType", leaveType);
      params.set("format", format);

      toast.loading(`Generating ${format.toUpperCase()} report...`, { id: "export" });

      const response = await fetch(`/api/reports/export?${params.toString()}`);
      
      // Safe null check for response
      if (!response) {
        throw new Error("No response from server");
      }

      if (!response.ok) {
        // Try to get error message from JSON, but handle cases where response is not JSON
        let errorData: { message?: string } = {};
        try {
          const contentType = response.headers.get("content-type");
          if (contentType?.includes("application/json")) {
            errorData = await response.json();
          }
        } catch {
          // If JSON parsing fails, use status text
          errorData = { message: response.statusText || "Unknown error" };
        }
        throw new Error(errorData.message || `Export failed with status ${response.status}`);
      }

      // Check content type
      const contentType = response.headers.get("content-type");
      const expectedType = format === "pdf" ? "application/pdf" : "text/csv";
      if (!contentType || !contentType.includes(format === "pdf" ? "pdf" : "csv")) {
        throw new Error(`Invalid response format. Expected ${expectedType}, got ${contentType}`);
      }

      // Get blob and create download
      const blob = await response.blob();
      
      // Verify blob is not empty
      if (blob.size === 0) {
        throw new Error("Received empty file");
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leave-report-${duration}-${new Date().toISOString().split("T")[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Report exported as ${format.toUpperCase()}`, { id: "export" });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to export report";
      toast.error(errorMessage, { id: "export" });
      console.error("Export error:", error);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Report Export</CardTitle>
        <CardDescription>
          Download comprehensive reports for audit and record-keeping purposes
        </CardDescription>
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
          <p className="text-sm text-muted-foreground ml-auto">
            Current filters: {duration === "month" ? "This Month" : duration === "quarter" ? "This Quarter" : "This Year"}
            {department && " • Department filtered"}
            {leaveType && " • Leave type filtered"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

