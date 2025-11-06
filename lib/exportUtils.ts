/**
 * Unified Export Utilities for CDBL Leave Management System
 * Handles PDF and CSV exports with consistent error handling
 */

import { toast } from "sonner";

export type ExportType = "pdf" | "csv";
export type ExportContext = "reports" | "leaves" | "approvals" | "holidays";

export interface ExportPayload {
  duration?: "month" | "quarter" | "year";
  department?: string | null;
  leaveType?: string | null;
  status?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  [key: string]: unknown;
}

/**
 * Exports a report in the specified format
 * @param type - Export format (pdf or csv)
 * @param context - Context of the export (reports, leaves, approvals, holidays)
 * @param payload - Optional payload with filters and parameters
 * @returns Promise that resolves when export is complete
 */
export async function exportReport(
  type: ExportType,
  context: ExportContext = "reports",
  payload?: ExportPayload
): Promise<void> {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    params.set("type", type);
    params.set("context", context);

    // Add payload parameters if provided
    if (payload) {
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          params.append(key, String(value));
        }
      });
    }

    const toastId = toast.loading(`Generating ${type.toUpperCase()} report...`);

    const response = await fetch(`/api/reports/export?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      let errorData: { message?: string; error?: string } = {};
      try {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          errorData = await response.json();
        }
      } catch {
        // If JSON parsing fails, use status text
        errorData = { message: response.statusText || "Unknown error" };
      }

      const errorMessage = errorData.message || errorData.error || `Export failed with status ${response.status}`;
      toast.error(errorMessage, { id: toastId });
      throw new Error(errorMessage);
    }

    // Check content type
    const contentType = response.headers.get("content-type");
    const expectedType = type === "pdf" ? "application/pdf" : "text/csv";
    
    if (!contentType || !contentType.includes(type === "pdf" ? "pdf" : "csv")) {
      const errorMessage = `Invalid response format. Expected ${expectedType}, got ${contentType}`;
      toast.error(errorMessage, { id: toastId });
      throw new Error(errorMessage);
    }

    // Get blob and create download
    const blob = await response.blob();

    // Verify blob is not empty
    if (blob.size === 0) {
      toast.error("Received empty file", { id: toastId });
      throw new Error("Received empty file");
    }

    // Generate filename
    const timestamp = new Date().toISOString().split("T")[0];
    const contextLabel = context === "reports" ? "report" : context;
    const filename = `cdbl-${contextLabel}-${timestamp}.${type}`;

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);

    toast.success(`Report exported as ${type.toUpperCase()}`, { id: toastId });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to export report";
    console.error("Export error:", error);
    throw new Error(errorMessage);
  }
}

/**
 * Convenience function for exporting PDF reports
 */
export async function exportPDF(
  context: ExportContext = "reports",
  payload?: ExportPayload
): Promise<void> {
  return exportReport("pdf", context, payload);
}

/**
 * Convenience function for exporting CSV reports
 */
export async function exportCSV(
  context: ExportContext = "reports",
  payload?: ExportPayload
): Promise<void> {
  return exportReport("csv", context, payload);
}

