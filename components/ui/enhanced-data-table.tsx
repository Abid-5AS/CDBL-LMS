"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Filter,
  Search,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  ArrowUpDown,
  Check,
  X,
  Plus,
  Minus,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Input } from "./input";
import { Checkbox } from "./checkbox";
import { Badge } from "./badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "./dropdown-menu";
import { Skeleton } from "./skeleton";

export interface Column<T = any> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (props: { row: T; value: any; index: number }) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  sticky?: "left" | "right";
  hidden?: boolean;
  meta?: {
    headerClassName?: string;
    cellClassName?: string;
    align?: "left" | "center" | "right";
  };
}

export interface TableState {
  sorting: { id: string; desc: boolean }[];
  columnFilters: { id: string; value: any }[];
  globalFilter: string;
  columnVisibility: Record<string, boolean>;
  rowSelection: Record<string, boolean>;
  pagination: {
    pageIndex: number;
    pageSize: number;
  };
  expanded: Record<string, boolean>;
}

export interface EnhancedDataTableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  error?: string;

  // Selection
  enableRowSelection?: boolean;
  enableMultiRowSelection?: boolean;
  onRowSelectionChange?: (selection: Record<string, boolean>) => void;

  // Sorting
  enableSorting?: boolean;
  onSortingChange?: (sorting: { id: string; desc: boolean }[]) => void;

  // Filtering
  enableGlobalFilter?: boolean;
  enableColumnFilters?: boolean;
  onGlobalFilterChange?: (filter: string) => void;
  onColumnFiltersChange?: (filters: { id: string; value: any }[]) => void;

  // Pagination
  enablePagination?: boolean;
  pageCount?: number;
  onPaginationChange?: (pagination: {
    pageIndex: number;
    pageSize: number;
  }) => void;

  // Expansion
  enableExpanding?: boolean;
  getRowCanExpand?: (row: T) => boolean;
  renderSubComponent?: (props: { row: T; index: number }) => React.ReactNode;

  // Virtual scrolling
  enableVirtualization?: boolean;
  estimateSize?: number;

  // Responsive
  enableResponsive?: boolean;
  mobileBreakpoint?: number;

  // Actions
  enableColumnVisibility?: boolean;
  enableExport?: boolean;
  onExport?: (data: T[]) => void;

  // Styling
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "striped" | "bordered";

  // State management
  state?: Partial<TableState>;
  onStateChange?: (state: TableState) => void;

  // Custom components
  emptyComponent?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
}

const sizeClasses = {
  sm: {
    table: "text-xs",
    header: "h-8 px-2",
    cell: "px-2 py-1.5",
  },
  md: {
    table: "text-sm",
    header: "h-10 px-3",
    cell: "px-3 py-2",
  },
  lg: {
    table: "text-base",
    header: "h-12 px-4",
    cell: "px-4 py-3",
  },
};

const variantClasses = {
  default: "border-collapse",
  striped: "border-collapse [&_tbody_tr:nth-child(odd)]:bg-muted/50",
  bordered:
    "border border-border [&_td]:border-r [&_th]:border-r [&_tr]:border-b",
};

export function EnhancedDataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  error,
  enableRowSelection = false,
  enableMultiRowSelection = true,
  enableSorting = true,
  enableGlobalFilter = true,
  enableColumnFilters = false,
  enablePagination = true,
  enableExpanding = false,
  enableVirtualization = false,
  enableResponsive = true,
  enableColumnVisibility = true,
  enableExport = false,
  mobileBreakpoint = 768,
  size = "md",
  variant = "default",
  className,
  state: externalState,
  onStateChange,
  onRowSelectionChange,
  onSortingChange,
  onGlobalFilterChange,
  onColumnFiltersChange,
  onPaginationChange,
  onExport,
  getRowCanExpand,
  renderSubComponent,
  emptyComponent,
  loadingComponent,
  errorComponent,
  ...props
}: EnhancedDataTableProps<T>) {
  const [internalState, setInternalState] = React.useState<TableState>({
    sorting: [],
    columnFilters: [],
    globalFilter: "",
    columnVisibility: {},
    rowSelection: {},
    pagination: { pageIndex: 0, pageSize: 10 },
    expanded: {},
  });

  const [isMobile, setIsMobile] = React.useState(false);
  const tableRef = React.useRef<HTMLDivElement>(null);

  // Use external state if provided, otherwise use internal state
  const currentState = externalState || internalState;
  const setState = onStateChange || setInternalState;

  // Responsive detection
  React.useEffect(() => {
    if (!enableResponsive) return;

    const checkMobile = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [enableResponsive, mobileBreakpoint]);

  // Filter visible columns
  const visibleColumns = React.useMemo(() => {
    return columns.filter(
      (column) =>
        currentState.columnVisibility[column.id] !== false && !column.hidden
    );
  }, [columns, currentState.columnVisibility]);

  // Apply global filter
  const globalFilteredData = React.useMemo(() => {
    if (!enableGlobalFilter || !currentState.globalFilter) return data;

    return data.filter((row) =>
      Object.values(row).some((value) =>
        String(value)
          .toLowerCase()
          .includes(currentState.globalFilter.toLowerCase())
      )
    );
  }, [data, currentState.globalFilter, enableGlobalFilter]);

  // Apply column filters
  const columnFilteredData = React.useMemo(() => {
    if (!enableColumnFilters || currentState.columnFilters.length === 0) {
      return globalFilteredData;
    }

    return globalFilteredData.filter((row) => {
      return currentState.columnFilters.every((filter) => {
        const column = columns.find((col) => col.id === filter.id);
        if (!column || !column.accessorKey) return true;

        const value = row[column.accessorKey];
        return String(value)
          .toLowerCase()
          .includes(String(filter.value).toLowerCase());
      });
    });
  }, [
    globalFilteredData,
    currentState.columnFilters,
    columns,
    enableColumnFilters,
  ]);

  // Apply sorting
  const sortedData = React.useMemo(() => {
    if (!enableSorting || currentState.sorting.length === 0) {
      return columnFilteredData;
    }

    return [...columnFilteredData].sort((a, b) => {
      for (const sort of currentState.sorting) {
        const column = columns.find((col) => col.id === sort.id);
        if (!column || !column.accessorKey) continue;

        const aValue = a[column.accessorKey];
        const bValue = b[column.accessorKey];

        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;

        if (comparison !== 0) {
          return sort.desc ? -comparison : comparison;
        }
      }
      return 0;
    });
  }, [columnFilteredData, currentState.sorting, columns, enableSorting]);

  // Apply pagination
  const paginatedData = React.useMemo(() => {
    if (!enablePagination) return sortedData;

    const { pageIndex, pageSize } = currentState.pagination;
    const start = pageIndex * pageSize;
    const end = start + pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, currentState.pagination, enablePagination]);

  // Handle sorting
  const handleSort = (columnId: string) => {
    if (!enableSorting) return;

    const newSorting = [...currentState.sorting];
    const existingSort = newSorting.find((sort) => sort.id === columnId);

    if (existingSort) {
      if (existingSort.desc) {
        // Remove sorting
        const index = newSorting.indexOf(existingSort);
        newSorting.splice(index, 1);
      } else {
        // Change to descending
        existingSort.desc = true;
      }
    } else {
      // Add ascending sort
      newSorting.push({ id: columnId, desc: false });
    }

    const newState = { ...currentState, sorting: newSorting };
    setState(newState);
    onSortingChange?.(newSorting);
  };

  // Handle row selection
  const handleRowSelection = (rowIndex: number, selected: boolean) => {
    if (!enableRowSelection) return;

    const newSelection = { ...currentState.rowSelection };

    if (selected) {
      newSelection[rowIndex] = true;
    } else {
      delete newSelection[rowIndex];
    }

    const newState = { ...currentState, rowSelection: newSelection };
    setState(newState);
    onRowSelectionChange?.(newSelection);
  };

  // Handle select all
  const handleSelectAll = (selected: boolean) => {
    if (!enableRowSelection || !enableMultiRowSelection) return;

    const newSelection: Record<string, boolean> = {};
    if (selected) {
      paginatedData.forEach((_, index) => {
        newSelection[index] = true;
      });
    }

    const newState = { ...currentState, rowSelection: newSelection };
    setState(newState);
    onRowSelectionChange?.(newSelection);
  };

  // Handle global filter
  const handleGlobalFilter = (value: string) => {
    const newState = {
      ...currentState,
      globalFilter: value,
      pagination: { ...currentState.pagination, pageIndex: 0 },
    };
    setState(newState);
    onGlobalFilterChange?.(value);
  };

  // Handle column visibility
  const handleColumnVisibility = (columnId: string, visible: boolean) => {
    const newVisibility = { ...currentState.columnVisibility };
    newVisibility[columnId] = visible;

    const newState = { ...currentState, columnVisibility: newVisibility };
    setState(newState);
  };

  // Handle row expansion
  const handleRowExpansion = (rowIndex: number) => {
    if (!enableExpanding) return;

    const newExpanded = { ...currentState.expanded };
    newExpanded[rowIndex] = !newExpanded[rowIndex];

    const newState = { ...currentState, expanded: newExpanded };
    setState(newState);
  };

  // Get cell value
  const getCellValue = (row: T, column: Column<T>) => {
    if (column.accessorKey) {
      return row[column.accessorKey];
    }
    return null;
  };

  // Render cell content
  const renderCell = (row: T, column: Column<T>, rowIndex: number) => {
    const value = getCellValue(row, column);

    if (column.cell) {
      return column.cell({ row, value, index: rowIndex });
    }

    return value;
  };

  const sizeClass = sizeClasses[size];
  const variantClass = variantClasses[variant];

  if (loading && loadingComponent) {
    return <div className={className}>{loadingComponent}</div>;
  }

  if (error && errorComponent) {
    return <div className={className}>{errorComponent}</div>;
  }

  if (isMobile && enableResponsive) {
    // Mobile card view
    return (
      <div className={cn("space-y-4", className)}>
        {/* Mobile toolbar */}
        <div className="flex items-center gap-2">
          {enableGlobalFilter && (
            <div className="flex-1">
              <Input
                placeholder="Search..."
                value={currentState.globalFilter}
                onChange={(e) => handleGlobalFilter(e.target.value)}
                className="h-8"
              />
            </div>
          )}

          {enableColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {columns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={currentState.columnVisibility[column.id] !== false}
                    onCheckedChange={(checked) =>
                      handleColumnVisibility(column.id, checked)
                    }
                  >
                    {column.header}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Mobile cards */}
        <div className="space-y-2">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))
            : paginatedData.length === 0
            ? emptyComponent || (
                <div className="text-center py-8 text-muted-foreground">
                  No data available
                </div>
              )
            : paginatedData.map((row, rowIndex) => (
                <motion.div
                  key={rowIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: rowIndex * 0.05 }}
                  className="bg-card border rounded-lg p-4 space-y-2"
                >
                  {enableRowSelection && (
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Checkbox
                        checked={currentState.rowSelection[rowIndex] || false}
                        onCheckedChange={(checked) =>
                          handleRowSelection(rowIndex, checked as boolean)
                        }
                      />
                      <span className="text-sm text-muted-foreground">
                        Select
                      </span>
                    </div>
                  )}

                  {visibleColumns.map((column) => (
                    <div
                      key={column.id}
                      className="flex justify-between items-start"
                    >
                      <span className="text-sm font-medium text-muted-foreground min-w-0 flex-1">
                        {column.header}:
                      </span>
                      <span className="text-sm text-right ml-2">
                        {renderCell(row, column, rowIndex)}
                      </span>
                    </div>
                  ))}

                  {enableExpanding && getRowCanExpand?.(row) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRowExpansion(rowIndex)}
                      className="w-full mt-2"
                    >
                      {currentState.expanded[rowIndex] ? (
                        <>
                          <Minus className="h-4 w-4 mr-2" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Show More
                        </>
                      )}
                    </Button>
                  )}

                  <AnimatePresence>
                    {currentState.expanded[rowIndex] && renderSubComponent && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-2 border-t"
                      >
                        {renderSubComponent({ row, index: rowIndex })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
        </div>
      </div>
    );
  }

  // Desktop table view
  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {enableGlobalFilter && (
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={currentState.globalFilter}
                onChange={(e) => handleGlobalFilter(e.target.value)}
                className="pl-8 h-8 w-64"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {enableColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {columns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={currentState.columnVisibility[column.id] !== false}
                    onCheckedChange={(checked) =>
                      handleColumnVisibility(column.id, checked)
                    }
                  >
                    {column.header}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {enableExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport?.(sortedData)}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div
        ref={tableRef}
        className="relative w-full overflow-auto border rounded-lg"
      >
        <table
          className={cn("w-full caption-bottom", sizeClass.table, variantClass)}
        >
          <thead className="bg-muted/50">
            <tr>
              {enableRowSelection && enableMultiRowSelection && (
                <th className={cn("w-12", sizeClass.header)}>
                  <Checkbox
                    checked={
                      paginatedData.length > 0 &&
                      paginatedData.every(
                        (_, index) => currentState.rowSelection[index]
                      )
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </th>
              )}

              {enableExpanding && (
                <th className={cn("w-12", sizeClass.header)} />
              )}

              {visibleColumns.map((column) => (
                <th
                  key={column.id}
                  className={cn(
                    "text-left font-medium text-muted-foreground",
                    sizeClass.header,
                    column.meta?.headerClassName,
                    column.sortable && "cursor-pointer hover:text-foreground",
                    column.sticky === "left" &&
                      "sticky left-0 bg-background z-10",
                    column.sticky === "right" &&
                      "sticky right-0 bg-background z-10"
                  )}
                  style={{
                    width: column.width,
                    minWidth: column.minWidth,
                    maxWidth: column.maxWidth,
                  }}
                  onClick={() => column.sortable && handleSort(column.id)}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable && (
                      <div className="flex flex-col">
                        {currentState.sorting.find(
                          (s) => s.id === column.id
                        ) ? (
                          currentState.sorting.find((s) => s.id === column.id)
                            ?.desc ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronUp className="h-4 w-4" />
                          )
                        ) : (
                          <ArrowUpDown className="h-4 w-4 opacity-50" />
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: currentState.pagination.pageSize }).map(
                (_, i) => (
                  <tr key={i}>
                    {enableRowSelection && (
                      <td className={sizeClass.cell}>
                        <Skeleton className="h-4 w-4" />
                      </td>
                    )}
                    {enableExpanding && (
                      <td className={sizeClass.cell}>
                        <Skeleton className="h-4 w-4" />
                      </td>
                    )}
                    {visibleColumns.map((column) => (
                      <td key={column.id} className={sizeClass.cell}>
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                )
              )
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    visibleColumns.length +
                    (enableRowSelection ? 1 : 0) +
                    (enableExpanding ? 1 : 0)
                  }
                  className="text-center py-8 text-muted-foreground"
                >
                  {emptyComponent || "No data available"}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: rowIndex * 0.02 }}
                    className={cn(
                      "border-b hover:bg-muted/50 transition-colors",
                      currentState.rowSelection[rowIndex] && "bg-muted/30"
                    )}
                  >
                    {enableRowSelection && (
                      <td className={sizeClass.cell}>
                        <Checkbox
                          checked={currentState.rowSelection[rowIndex] || false}
                          onCheckedChange={(checked) =>
                            handleRowSelection(rowIndex, checked as boolean)
                          }
                        />
                      </td>
                    )}

                    {enableExpanding && (
                      <td className={sizeClass.cell}>
                        {getRowCanExpand?.(row) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRowExpansion(rowIndex)}
                            className="h-6 w-6 p-0"
                          >
                            {currentState.expanded[rowIndex] ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </td>
                    )}

                    {visibleColumns.map((column) => (
                      <td
                        key={column.id}
                        className={cn(
                          sizeClass.cell,
                          column.meta?.cellClassName,
                          column.meta?.align === "center" && "text-center",
                          column.meta?.align === "right" && "text-right",
                          column.sticky === "left" &&
                            "sticky left-0 bg-background",
                          column.sticky === "right" &&
                            "sticky right-0 bg-background"
                        )}
                      >
                        {renderCell(row, column, rowIndex)}
                      </td>
                    ))}
                  </motion.tr>

                  {/* Expanded row */}
                  <AnimatePresence>
                    {currentState.expanded[rowIndex] && renderSubComponent && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <td
                          colSpan={
                            visibleColumns.length +
                            (enableRowSelection ? 1 : 0) +
                            (enableExpanding ? 1 : 0)
                          }
                          className="p-0"
                        >
                          <div className="p-4 bg-muted/20 border-t">
                            {renderSubComponent({ row, index: rowIndex })}
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {enablePagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing{" "}
            {currentState.pagination.pageIndex *
              currentState.pagination.pageSize +
              1}{" "}
            to{" "}
            {Math.min(
              (currentState.pagination.pageIndex + 1) *
                currentState.pagination.pageSize,
              sortedData.length
            )}{" "}
            of {sortedData.length} results
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newPagination = {
                  ...currentState.pagination,
                  pageIndex: Math.max(0, currentState.pagination.pageIndex - 1),
                };
                setState({ ...currentState, pagination: newPagination });
                onPaginationChange?.(newPagination);
              }}
              disabled={currentState.pagination.pageIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <span className="text-sm">
              Page {currentState.pagination.pageIndex + 1} of{" "}
              {Math.ceil(sortedData.length / currentState.pagination.pageSize)}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newPagination = {
                  ...currentState.pagination,
                  pageIndex: currentState.pagination.pageIndex + 1,
                };
                setState({ ...currentState, pagination: newPagination });
                onPaginationChange?.(newPagination);
              }}
              disabled={
                currentState.pagination.pageIndex >=
                Math.ceil(
                  sortedData.length / currentState.pagination.pageSize
                ) -
                  1
              }
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
