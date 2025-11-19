"use client";

import { Download, FileText } from "lucide-react";
import type { ComponentProps } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Holiday } from "../hooks/useHolidaysData";

type PDFExportButtonProps = ComponentProps<typeof Button> & {
  label?: string;
  holidays?: Holiday[];
};

async function generatePDF(holidays: Holiday[] | undefined) {
  if (!holidays) {
    console.error("No holidays to export");
    return;
  }

  try {
    // Dynamically import jsPDF and autotable to avoid SSR issues
    const { default: jsPDF } = await import("jspdf");
    await import("jspdf-autotable");

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Title
    pdf.setFontSize(18);
    pdf.text("Company Holidays", pageWidth / 2, 15, { align: "center" });

    // Subtitle with generation date
    pdf.setFontSize(10);
    pdf.setTextColor(100);
    const generatedDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    pdf.text(`Generated on ${generatedDate}`, pageWidth / 2, 22, {
      align: "center",
    });

    // Table data
    const tableData = holidays.map((holiday) => [
      holiday.name,
      new Date(holiday.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      new Date(holiday.date).toLocaleDateString("en-US", { weekday: "long" }),
      holiday.isOptional ? "Optional" : "Mandatory",
    ]);

    // Add table using autotable
    (pdf as any).autoTable({
      head: [["Holiday Name", "Date", "Day", "Type"]],
      body: tableData,
      startY: 30,
      styles: {
        fontSize: 11,
        cellPadding: 8,
        halign: "left",
      },
      headStyles: {
        fillColor: [79, 70, 229], // Indigo color
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "left",
      },
      alternateRowStyles: {
        fillColor: [245, 245, 250], // Light indigo
      },
      margin: { left: 10, right: 10 },
    });

    // Footer
    const pageCount = (pdf as any).internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(9);
      pdf.setTextColor(150);
      pdf.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
    }

    // Download the PDF
    pdf.save("company-holidays.pdf");
  } catch (error) {
    console.error("Error generating PDF:", error);
  }
}

async function generateICalendar(holidays: Holiday[] | undefined) {
  if (!holidays) {
    console.error("No holidays to export");
    return;
  }

  try {
    let icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Company Holidays//Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Company Holidays
X-WR-TIMEZONE:UTC
X-WR-CALDESC:Company holidays calendar
BEGIN:VTIMEZONE
TZID:UTC
BEGIN:STANDARD
DTSTART:19700101T000000Z
TZOFFSETFROM:+0000
TZOFFSETTO:+0000
END:STANDARD
END:VTIMEZONE
`;

    holidays.forEach((holiday) => {
      const date = new Date(holiday.date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateStr = `${year}${month}${day}`;

      icalContent += `BEGIN:VEVENT
DTSTART;VALUE=DATE:${dateStr}
DTEND;VALUE=DATE:${dateStr}
DTSTAMP:${dateStr}T000000Z
UID:holiday-${holiday.id}@company.com
CREATED:${dateStr}T000000Z
DESCRIPTION:${holiday.isOptional ? "Optional holiday" : "Mandatory holiday"}
LAST-MODIFIED:${dateStr}T000000Z
SUMMARY:${holiday.name}
STATUS:CONFIRMED
TRANSP:TRANSPARENT
END:VEVENT
`;
    });

    icalContent += `END:VCALENDAR`;

    // Create blob and download
    const blob = new Blob([icalContent], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "company-holidays.ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error generating iCalendar:", error);
  }
}

export function PDFExportButton({
  variant = "outline",
  size = "sm",
  className,
  label = "Export",
  holidays,
  ...props
}: PDFExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!holidays || holidays.length === 0) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={cn("gap-2 rounded-xl", className)}
        aria-label="Export holidays (no data available)"
        {...props}
      >
        <Download className="h-4 w-4" />
        <span className="whitespace-nowrap">{label}</span>
      </Button>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn("gap-2 rounded-xl", className)}
          aria-label="Export holidays in different formats"
          {...props}
        >
          <Download className="h-4 w-4" />
          <span className="whitespace-nowrap">{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => {
            generatePDF(holidays);
            setIsOpen(false);
          }}
        >
          <FileText className="w-4 h-4 mr-2" />
          PDF Document
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            generateICalendar(holidays);
            setIsOpen(false);
          }}
        >
          <FileText className="w-4 h-4 mr-2" />
          iCalendar (.ics)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
