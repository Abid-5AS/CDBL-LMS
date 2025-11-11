"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "@/components/ui/table";

interface EnhancedTableProps extends React.ComponentProps<typeof Table> {
  containerClassName?: string;
}

function EnhancedTable({ 
  className, 
  containerClassName,
  children,
  ...props 
}: EnhancedTableProps) {
  return (
    <Card className={cn("overflow-hidden border shadow-sm", containerClassName)}>
      <CardContent className="p-0">
        <Table 
          className={cn(
            "w-full caption-bottom text-sm",
            className
          )} 
          {...props}
        >
          {children}
        </Table>
      </CardContent>
    </Card>
  );
}

// Enhanced header with better styling
function EnhancedTableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <TableHeader
      className={cn(
        "[&_tr]:border-b [&_tr]:bg-bg-muted/30 dark:[&_tr]:bg-bg-muted/20",
        "[&_tr]:border-border-strong dark:[&_tr]:border-border-strong/20",
        "[&_tr]:sticky [&_tr]:top-0 [&_tr]:z-10 [&_tr]:backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}

// Enhanced head cell with professional styling
function EnhancedTableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <TableHead
      className={cn(
        "text-foreground h-12 px-4 text-left align-middle font-medium text-xs",
        "text-text-secondary dark:text-text-secondary",
        "whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        "bg-bg-muted/30 dark:bg-bg-muted/20",
        className
      )}
      {...props}
    />
  );
}

// Enhanced body with alternating rows
function EnhancedTableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <TableBody
      className={cn(
        "[&_tr:last-child]:border-0",
        "[&_tr:hover]:bg-bg-secondary/50 dark:[&_tr:hover]:bg-bg-secondary/30",
        "[&_tr:nth-child(even)]:bg-bg-primary dark:[&_tr:nth-child(even)]:bg-bg-secondary/20",
        className
      )}
      {...props}
    />
  );
}

// Enhanced row with better hover states
function EnhancedTableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <TableRow
      className={cn(
        "border-b border-border-strong/20 dark:border-border-strong/10",
        "hover:bg-bg-secondary/50 dark:hover:bg-bg-secondary/30",
        "transition-colors duration-150",
        "data-[state=selected]:bg-card-action/10 dark:data-[state=selected]:bg-card-action/20",
        className
      )}
      {...props}
    />
  );
}

// Enhanced cell with consistent padding
function EnhancedTableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <TableCell
      className={cn(
        "px-4 py-3 align-middle text-sm",
        "text-text-secondary dark:text-text-primary",
        "[&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  );
}

export {
  EnhancedTable,
  EnhancedTableHeader,
  EnhancedTableBody,
  EnhancedTableHead,
  EnhancedTableRow,
  EnhancedTableCell,
};

export { TableFooter as EnhancedTableFooter } from "@/components/ui/table";
export { TableCaption as EnhancedTableCaption } from "@/components/ui/table";