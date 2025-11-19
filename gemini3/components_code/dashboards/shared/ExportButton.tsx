"use client";

import { useState } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";

interface ExportButtonProps {
  data: any[];
  filename?: string;
  title?: string;
  columns?: { header: string; key: string }[];
  formats?: ("csv" | "pdf" | "json")[];
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function ExportButton({
  data,
  filename = "export",
  title = "Data Export",
  columns,
  formats = ["csv", "pdf"],
  variant = "outline",
  size = "default",
  className,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  // Auto-detect columns if not provided
  const detectedColumns =
    columns ||
    (data.length > 0
      ? Object.keys(data[0]).map((key) => ({
          header: key.charAt(0).toUpperCase() + key.slice(1),
          key,
        }))
      : []);

  const exportToCSV = () => {
    try {
      setIsExporting(true);

      // Prepare data
      const csvData = data.map((item) =>
        detectedColumns.reduce((obj, col) => {
          obj[col.header] = item[col.key];
          return obj;
        }, {} as any)
      );

      // Generate CSV
      const csv = Papa.unparse(csvData);

      // Download
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}.csv`);
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("CSV exported successfully");
    } catch (error) {
      console.error("CSV export error:", error);
      toast.error("Failed to export CSV");
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = () => {
    try {
      setIsExporting(true);

      const doc = new jsPDF();

      // Add title
      doc.setFontSize(16);
      doc.text(title, 14, 15);

      // Add date
      doc.setFontSize(10);
      doc.text(
        `Generated: ${new Date().toLocaleString()}`,
        14,
        22
      );

      // Prepare table data
      const tableHeaders = detectedColumns.map((col) => col.header);
      const tableData = data.map((item) =>
        detectedColumns.map((col) => String(item[col.key] || ""))
      );

      // Add table
      autoTable(doc, {
        head: [tableHeaders],
        body: tableData,
        startY: 28,
        theme: "grid",
        headStyles: {
          fillColor: [59, 130, 246], // blue-500
          fontSize: 10,
          fontStyle: "bold",
        },
        bodyStyles: {
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251], // gray-50
        },
        margin: { top: 28 },
      });

      // Save
      doc.save(`${filename}.pdf`);

      toast.success("PDF exported successfully");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const exportToJSON = () => {
    try {
      setIsExporting(true);

      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], {
        type: "application/json;charset=utf-8;",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}.json`);
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("JSON exported successfully");
    } catch (error) {
      console.error("JSON export error:", error);
      toast.error("Failed to export JSON");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = (format: "csv" | "pdf" | "json") => {
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }

    switch (format) {
      case "csv":
        exportToCSV();
        break;
      case "pdf":
        exportToPDF();
        break;
      case "json":
        exportToJSON();
        break;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          disabled={isExporting || data.length === 0}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {formats.includes("csv") && (
          <DropdownMenuItem
            onClick={() => handleExport("csv")}
            disabled={isExporting}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export as CSV
          </DropdownMenuItem>
        )}

        {formats.includes("pdf") && (
          <DropdownMenuItem
            onClick={() => handleExport("pdf")}
            disabled={isExporting}
          >
            <FileText className="h-4 w-4 mr-2" />
            Export as PDF
          </DropdownMenuItem>
        )}

        {formats.includes("json") && (
          <DropdownMenuItem
            onClick={() => handleExport("json")}
            disabled={isExporting}
          >
            <FileText className="h-4 w-4 mr-2" />
            Export as JSON
          </DropdownMenuItem>
        )}

        {data.length === 0 && (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
            No data to export
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Simplified export for single-click CSV export
export function ExportCSVButton({
  data,
  filename = "export",
  variant = "outline",
  size = "default",
  className,
}: Pick<
  ExportButtonProps,
  "data" | "filename" | "variant" | "size" | "className"
>) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      setIsExporting(true);

      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}.csv`);
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("CSV exported successfully");
    } catch (error) {
      console.error("CSV export error:", error);
      toast.error("Failed to export CSV");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleExport}
      disabled={isExporting || data.length === 0}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <FileSpreadsheet className="h-4 w-4 mr-2" />
      )}
      Export CSV
    </Button>
  );
}
