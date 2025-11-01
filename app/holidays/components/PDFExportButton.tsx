"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function PDFExportButton() {
  const handleExport = () => {
    // TODO: Implement actual PDF export
    window.print();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      className="rounded-full"
      aria-label="Export holidays calendar as PDF"
    >
      <Download className="h-4 w-4 mr-2" />
      Export PDF
    </Button>
  );
}

