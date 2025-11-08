"use client";

import { Download } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PDFExportButtonProps = ComponentProps<typeof Button> & {
  label?: string;
};

export function PDFExportButton({
  variant = "outline",
  size = "sm",
  className,
  label = "Export PDF",
  ...props
}: PDFExportButtonProps) {
  const handleExport = () => {
    // TODO: Implement actual PDF export
    window.print();
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      className={cn("gap-2 rounded-xl", className)}
      aria-label="Export holidays calendar as PDF"
      {...props}
    >
      <Download className="h-4 w-4" />
      <span className="whitespace-nowrap">{label}</span>
    </Button>
  );
}
