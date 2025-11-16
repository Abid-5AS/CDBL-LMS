"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronUp, ChevronDown, ArrowUpDown, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Column Definition Interface
 */
export interface ColumnDefinition<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
}

/**
 * Activity Row Interface
 */
export interface ActivityRow {
  id: string | number;
  [key: string]: any;
}

/**
 * RecentActivityTable Props
 *
 * @interface RecentActivityTableProps
 * @property {ActivityRow[]} rows - Array of activity data
 * @property {ColumnDefinition[]} columns - Column definitions
 * @property {(row: ActivityRow) => void} [onRowClick] - Row click handler
 * @property {boolean} [isLoading] - Loading state
 * @property {string} [emptyMessage] - Custom empty state message
 * @property {number} [pageSize] - Items per page (default: 10)
 * @property {string} [sortBy] - Initial sort column
 * @property {'asc'|'desc'} [sortDirection] - Initial sort direction
 */
export interface RecentActivityTableProps {
  rows: ActivityRow[];
  columns: ColumnDefinition[];
  onRowClick?: (row: ActivityRow) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  className?: string;
  title?: string;
  description?: string;
  showPagination?: boolean;
}

/**
 * RecentActivityTable Component
 *
 * Standardized table for showing recent activities/requests.
 * Features sorting, pagination, row click handlers, and loading states.
 *
 * @example
 * ```tsx
 * <RecentActivityTable
 *   title="Recent Leave Requests"
 *   rows={leaves}
 *   columns={[
 *     { key: 'employeeName', label: 'Employee', sortable: true },
 *     { key: 'type', label: 'Type', render: (val) => <Badge>{val}</Badge> },
 *     { key: 'status', label: 'Status', sortable: true }
 *   ]}
 *   onRowClick={(row) => navigate(`/leaves/${row.id}`)}
 *   pageSize={10}
 * />
 * ```
 */
export function RecentActivityTable({
  rows,
  columns,
  onRowClick,
  isLoading = false,
  emptyMessage = "No activities to display",
  pageSize = 10,
  sortBy: initialSortBy,
  sortDirection: initialSortDirection = "desc",
  className,
  title = "Recent Activity",
  description,
  showPagination = true,
}: RecentActivityTableProps) {
  const [sortBy, setSortBy] = useState<string | undefined>(initialSortBy);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(initialSortDirection);
  const [currentPage, setCurrentPage] = useState(1);

  // Sort data
  const sortedRows = [...rows].sort((a, b) => {
    if (!sortBy) return 0;

    const aVal = a[sortBy];
    const bVal = b[sortBy];

    if (aVal === bVal) return 0;

    const comparison = aVal > bVal ? 1 : -1;
    return sortDirection === "asc" ? comparison : -comparison;
  });

  // Paginate data
  const totalPages = Math.ceil(sortedRows.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRows = sortedRows.slice(startIndex, startIndex + pageSize);

  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(columnKey);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const handleRowClick = (row: ActivityRow) => {
    if (onRowClick) {
      onRowClick(row);
    }
  };

  return (
    <Card className={cn("surface-card", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {description}
              </p>
            )}
          </div>
          {!isLoading && rows.length > 0 && (
            <Badge variant="outline" className="rounded-full">
              {rows.length} items
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-12 bg-gray-100 dark:bg-gray-800 animate-pulse rounded"
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
              <svg
                className="w-8 h-8 text-gray-400 dark:text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {emptyMessage}
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="max-h-[520px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow className="bg-white/95 dark:bg-slate-900/90 backdrop-blur">
                      {columns.map((column) => (
                        <TableHead
                          key={column.key}
                          className={cn(
                            "font-semibold text-gray-700 dark:text-gray-300",
                            column.sortable &&
                              "cursor-pointer select-none hover:text-gray-900 dark:hover:text-gray-100",
                            column.className
                          )}
                          onClick={() => column.sortable && handleSort(column.key)}
                        >
                          <div className="flex items-center gap-2">
                            {column.label}
                            {column.sortable && (
                              <span className="inline-flex">
                                {sortBy === column.key ? (
                                  sortDirection === "asc" ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )
                                ) : (
                                  <ArrowUpDown className="h-4 w-4 opacity-40" />
                                )}
                              </span>
                            )}
                          </div>
                        </TableHead>
                      ))}
                      {onRowClick && <TableHead className="w-10" />}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRows.map((row, index) => {
                      const zebra =
                        (startIndex + index) % 2 === 0
                          ? "bg-white dark:bg-slate-950/40"
                          : "bg-muted/40 dark:bg-slate-900/40";

                      return (
                        <motion.tr
                          key={row.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className={cn(
                            "border-b border-gray-200 dark:border-gray-800 transition-colors",
                            zebra,
                            onRowClick &&
                              "cursor-pointer hover:bg-gray-50/80 dark:hover:bg-slate-800/60"
                          )}
                          onClick={() => handleRowClick(row)}
                          role={onRowClick ? "button" : undefined}
                          tabIndex={onRowClick ? 0 : undefined}
                          onKeyDown={
                            onRowClick
                              ? (e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    handleRowClick(row);
                                  }
                                }
                              : undefined
                          }
                        >
                          {columns.map((column) => (
                            <TableCell
                              key={`${row.id}-${column.key}`}
                              className={cn("text-sm", column.className)}
                            >
                              {column.render
                                ? column.render(row[column.key], row)
                                : row[column.key]}
                            </TableCell>
                          ))}
                          {onRowClick && (
                            <TableCell className="text-right">
                              <ExternalLink className="h-4 w-4 text-gray-400 dark:text-gray-600" />
                            </TableCell>
                          )}
                        </motion.tr>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {showPagination && totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {startIndex + 1}-
                  {Math.min(startIndex + pageSize, rows.length)} of {rows.length}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous page"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next page"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * RecentActivityTable Skeleton Loader
 */
export function RecentActivityTableSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("surface-card", className)}>
      <CardHeader className="pb-3">
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-12 bg-gray-100 dark:bg-gray-800 animate-pulse rounded"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
