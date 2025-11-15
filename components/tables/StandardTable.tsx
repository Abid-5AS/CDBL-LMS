"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUp,
  ArrowDown,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface StandardTableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
}

export interface StandardTableActionButton<T = any> {
  label: string;
  onClick: (row: T) => void;
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost";
  icon?: React.ReactNode;
  className?: string;
  disabled?: (row: T) => boolean;
}

export interface StandardTableProps<T = any> {
  rows: T[];
  columns: StandardTableColumn<T>[];
  pageSize?: number;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  actionButtons?: StandardTableActionButton<T>[];
  selectable?: boolean;
  onSelectionChange?: (selectedRows: T[]) => void;
  getRowId?: (row: T) => string | number;
  stickyHeader?: boolean;
  zebra?: boolean;
  compact?: boolean;
  className?: string;
}

export function StandardTable<T = any>({
  rows,
  columns,
  pageSize = 10,
  onRowClick,
  isLoading = false,
  emptyMessage = "No data available",
  emptyDescription = "There are no records to display at this time.",
  actionButtons,
  selectable = false,
  onSelectionChange,
  getRowId = (row: any) => row.id,
  stickyHeader = false,
  zebra = true,
  compact = false,
  className,
}: StandardTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string | number>>(
    new Set()
  );

  // Sorting logic
  const sortedRows = useMemo(() => {
    if (!sortConfig) return rows;

    return [...rows].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key];
      const bValue = (b as any)[sortConfig.key];

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [rows, sortConfig]);

  // Pagination logic
  const totalPages = Math.ceil(sortedRows.length / pageSize);
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  // Handle sort
  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (!current || current.key !== key) {
        return { key, direction: "asc" };
      }
      if (current.direction === "asc") {
        return { key, direction: "desc" };
      }
      return null;
    });
  };

  // Handle row selection
  const handleSelectRow = (rowId: string | number) => {
    setSelectedRowIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }

      if (onSelectionChange) {
        const selectedRows = rows.filter((row) => newSet.has(getRowId(row)));
        onSelectionChange(selectedRows);
      }

      return newSet;
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedRowIds.size === paginatedRows.length) {
      setSelectedRowIds(new Set());
      onSelectionChange?.([]);
    } else {
      const allIds = new Set(paginatedRows.map(getRowId));
      setSelectedRowIds(allIds);
      onSelectionChange?.(paginatedRows);
    }
  };

  // Reset page when rows change
  useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [rows, currentPage, totalPages]);

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 min-h-[300px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading data...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 min-h-[300px] text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <svg
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          {emptyMessage}
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Table wrapper with horizontal scroll */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className={cn(stickyHeader && "sticky top-0 z-10 bg-muted/95 backdrop-blur")}>
              <TableRow className="hover:bg-transparent border-b border-border">
                {selectable && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        paginatedRows.length > 0 &&
                        selectedRowIds.size === paginatedRows.length
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                )}
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    style={{ width: column.width }}
                    className={cn(
                      "font-semibold text-foreground",
                      column.sortable && "cursor-pointer select-none hover:bg-muted/50",
                      column.className
                    )}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center">
                      {column.label}
                      {column.sortable && getSortIcon(column.key)}
                    </div>
                  </TableHead>
                ))}
                {actionButtons && actionButtons.length > 0 && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRows.map((row, index) => {
                const rowId = getRowId(row);
                const isSelected = selectedRowIds.has(rowId);

                return (
                  <TableRow
                    key={rowId}
                    className={cn(
                      "border-b border-border transition-colors",
                      onRowClick && "cursor-pointer hover:bg-muted/50",
                      zebra && index % 2 === 0 && "bg-muted/20",
                      isSelected && "bg-primary/5 hover:bg-primary/10",
                      compact ? "h-12" : "h-16"
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {selectable && (
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleSelectRow(rowId)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => {
                      const value = (row as any)[column.key];
                      return (
                        <TableCell
                          key={column.key}
                          className={cn("text-sm", column.className)}
                        >
                          {column.render ? column.render(value, row) : value}
                        </TableCell>
                      );
                    })}
                    {actionButtons && actionButtons.length > 0 && (
                      <TableCell className="text-right">
                        <div
                          className="flex items-center justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {actionButtons.map((action, idx) => (
                            <Button
                              key={idx}
                              variant={action.variant || "ghost"}
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                action.onClick(row);
                              }}
                              disabled={action.disabled?.(row)}
                              className={cn("h-8", action.className)}
                            >
                              {action.icon}
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, rows.length)} of {rows.length}{" "}
            results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-3">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Selection info */}
      {selectable && selectedRowIds.size > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-primary/10 px-4 py-2 text-sm">
          <span className="text-primary font-medium">
            {selectedRowIds.size} row(s) selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedRowIds(new Set());
              onSelectionChange?.([]);
            }}
          >
            Clear selection
          </Button>
        </div>
      )}
    </div>
  );
}

// Helper component for rendering status badges
export function StatusBadge({
  status,
  variant,
  children,
}: {
  status: string;
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
  children?: React.ReactNode;
}) {
  const variantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    success: "secondary",
    warning: "outline",
    error: "destructive",
  };

  return (
    <Badge variant={variant ? variantMap[variant] || variant : "default"} className="font-medium">
      {children || status}
    </Badge>
  );
}
