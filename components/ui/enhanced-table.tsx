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
    <Card className={cn("overflow-hidden border border-outline/60 dark:border-border bg-surface-1 shadow-card", containerClassName)}>
      <CardContent className="p-0">
        <Table 
          className={cn(
            "w-full caption-bottom text-sm text-foreground",
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
        "[&_tr]:border-b [&_tr]:border-outline/60 dark:[&_tr]:border-border/60",
        "[&_tr]:bg-surface-2",
        "[&_tr]:sticky [&_tr]:top-0 [&_tr]:z-10",
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
        "text-muted-foreground",
        "whitespace-nowrap [&:has([role=checkbox])]:pr-0",
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
        "[&_tr:hover]:bg-surface-2",
        "[&_tr:nth-child(even)]:bg-surface-1",
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
        "border-b border-outline/60 dark:border-border/60",
        "hover:bg-surface-2",
        "transition-colors duration-150",
        "data-[state=selected]:bg-surface-3",
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
        "text-foreground",
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
