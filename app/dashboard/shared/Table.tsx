"use client";

import { useState, useMemo, ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TabFilter = {
  value: string;
  label: string;
  count?: number;
};

type TableProps<T> = {
  data: T[];
  columns: {
    key: string;
    header: string;
    render: (row: T) => ReactNode;
    className?: string;
  }[];
  filters?: TabFilter[];
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  summary?: string;
  className?: string;
  stickyHeader?: boolean;
  onRowClick?: (row: T) => void;
};

/**
 * Shared table component with tab-chip filtering
 * Material 3 style with sticky header and hover effects
 */
export function Table<T extends Record<string, any>>({
  data,
  columns,
  filters,
  activeFilter = "all",
  onFilterChange,
  emptyMessage = "No data available",
  emptyIcon,
  summary,
  className,
  stickyHeader = true,
  onRowClick,
}: TableProps<T>) {
  const filteredData = useMemo(() => {
    if (!filters || activeFilter === "all") return data;
    // Filter logic can be customized per implementation
    return data;
  }, [data, activeFilter, filters]);

  return (
    <Card className={cn("glass-card rounded-2xl", className)}>
      {(filters || summary) && (
        <CardHeader className="px-6 pt-6">
          <div className="flex items-center justify-between gap-4">
            {summary && (
              <p className="text-sm text-muted-foreground">{summary}</p>
            )}
            {filters && filters.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {filters.map((filter) => {
                  const isActive = activeFilter === filter.value;
                  return (
                    <motion.button
                      key={filter.value}
                      onClick={() => onFilterChange?.(filter.value)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "relative whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                      aria-pressed={isActive}
                      aria-label={`Filter by ${filter.label}`}
                    >
                      {filter.label}
                      {filter.count !== undefined && (
                        <span
                          className={cn(
                            "ml-2 rounded-full px-1.5 py-0.5 text-xs",
                            isActive
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-background/50 text-muted-foreground"
                          )}
                        >
                          {filter.count}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className="px-0">
        {filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            {emptyIcon}
            <p className="mt-4 text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <TableComponent>
              <TableHeader
                className={cn(
                  "bg-muted/50",
                  stickyHeader && "sticky top-0 z-10"
                )}
              >
                <TableRow className="border-b border-border/50 hover:bg-transparent">
                  {columns.map((column) => (
                    <TableHead
                      key={column.key}
                      className={cn(
                        "h-12 px-6 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                        column.className
                      )}
                    >
                      {column.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((row, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className={cn(
                      "border-b border-border/30 transition-colors",
                      index % 2 === 0 ? "bg-background" : "bg-muted/30",
                      onRowClick && "cursor-pointer hover:bg-muted/50"
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        className={cn("px-6 py-4", column.className)}
                      >
                        {column.render(row)}
                      </TableCell>
                    ))}
                  </motion.tr>
                ))}
              </TableBody>
            </TableComponent>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

