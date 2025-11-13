/**
 * Custom hook for managing table state
 */

import * as React from "react";
import type { Column } from "../enhanced-data-table";

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

export function useTableState(
  externalState?: Partial<TableState>,
  onStateChange?: (state: TableState) => void
) {
  const [internalState, setInternalState] = React.useState<TableState>({
    sorting: [],
    columnFilters: [],
    globalFilter: "",
    columnVisibility: {},
    rowSelection: {},
    pagination: { pageIndex: 0, pageSize: 10 },
    expanded: {},
  });

  // Use external state if provided, otherwise use internal state
  const currentState = externalState || internalState;
  const setState = onStateChange || setInternalState;

  return { currentState, setState };
}

export function useTableData<T>(
  data: T[],
  columns: Column<T>[],
  state: TableState,
  options: {
    enableGlobalFilter?: boolean;
    enableColumnFilters?: boolean;
    enableSorting?: boolean;
    enablePagination?: boolean;
  }
) {
  const {
    enableGlobalFilter = true,
    enableColumnFilters = false,
    enableSorting = true,
    enablePagination = true,
  } = options;

  // Apply global filter
  const globalFilteredData = React.useMemo(() => {
    if (!enableGlobalFilter || !state.globalFilter) return data;

    return data.filter((row) =>
      Object.values(row).some((value) =>
        String(value)
          .toLowerCase()
          .includes(state.globalFilter.toLowerCase())
      )
    );
  }, [data, state.globalFilter, enableGlobalFilter]);

  // Apply column filters
  const columnFilteredData = React.useMemo(() => {
    if (!enableColumnFilters || state.columnFilters.length === 0) {
      return globalFilteredData;
    }

    return globalFilteredData.filter((row) => {
      return state.columnFilters.every((filter) => {
        const column = columns.find((col) => col.id === filter.id);
        if (!column || !column.accessorKey) return true;

        const value = row[column.accessorKey];
        return String(value)
          .toLowerCase()
          .includes(String(filter.value).toLowerCase());
      });
    });
  }, [globalFilteredData, state.columnFilters, columns, enableColumnFilters]);

  // Apply sorting
  const sortedData = React.useMemo(() => {
    if (!enableSorting || state.sorting.length === 0) {
      return columnFilteredData;
    }

    return [...columnFilteredData].sort((a, b) => {
      for (const sort of state.sorting) {
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
  }, [columnFilteredData, state.sorting, columns, enableSorting]);

  // Apply pagination
  const paginatedData = React.useMemo(() => {
    if (!enablePagination) return sortedData;

    const { pageIndex, pageSize } = state.pagination;
    const start = pageIndex * pageSize;
    const end = start + pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, state.pagination, enablePagination]);

  return {
    globalFilteredData,
    columnFilteredData,
    sortedData,
    paginatedData,
    totalRows: sortedData.length,
  };
}
