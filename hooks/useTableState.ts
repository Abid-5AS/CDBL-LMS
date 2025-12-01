"use client";

import { useState, useCallback, useMemo } from "react";

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

export interface UseTableStateOptions {
  initialState?: Partial<TableState>;
  onStateChange?: (state: TableState) => void;
  persistState?: boolean;
  storageKey?: string;
}

const defaultState: TableState = {
  sorting: [],
  columnFilters: [],
  globalFilter: "",
  columnVisibility: {},
  rowSelection: {},
  pagination: { pageIndex: 0, pageSize: 10 },
  expanded: {},
};

export function useTableState({
  initialState = {},
  onStateChange,
  persistState = false,
  storageKey = "table-state",
}: UseTableStateOptions = {}) {
  // Load initial state from localStorage if persistence is enabled
  const getInitialState = useCallback((): TableState => {
    let state = { ...defaultState, ...initialState };

    if (persistState && typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsedState = JSON.parse(saved);
          state = { ...state, ...parsedState };
        }
      } catch (error) {
        console.warn("Failed to load table state from localStorage:", error);
      }
    }

    return state;
  }, [initialState, persistState, storageKey]);

  const [state, setState] = useState<TableState>(getInitialState);

  // Update state and persist if enabled
  const updateState = useCallback(
    (newState: TableState) => {
      setState(newState);
      onStateChange?.(newState);

      if (persistState && typeof window !== "undefined") {
        try {
          localStorage.setItem(storageKey, JSON.stringify(newState));
        } catch (error) {
          console.warn("Failed to save table state to localStorage:", error);
        }
      }
    },
    [onStateChange, persistState, storageKey]
  );

  // Individual state updaters
  const setSorting = useCallback(
    (sorting: { id: string; desc: boolean }[]) => {
      updateState({ ...state, sorting });
    },
    [state, updateState]
  );

  const setColumnFilters = useCallback(
    (columnFilters: { id: string; value: any }[]) => {
      updateState({
        ...state,
        columnFilters,
        pagination: { ...state.pagination, pageIndex: 0 },
      });
    },
    [state, updateState]
  );

  const setGlobalFilter = useCallback(
    (globalFilter: string) => {
      updateState({
        ...state,
        globalFilter,
        pagination: { ...state.pagination, pageIndex: 0 },
      });
    },
    [state, updateState]
  );

  const setColumnVisibility = useCallback(
    (columnVisibility: Record<string, boolean>) => {
      updateState({ ...state, columnVisibility });
    },
    [state, updateState]
  );

  const setRowSelection = useCallback(
    (rowSelection: Record<string, boolean>) => {
      updateState({ ...state, rowSelection });
    },
    [state, updateState]
  );

  const setPagination = useCallback(
    (pagination: { pageIndex: number; pageSize: number }) => {
      updateState({ ...state, pagination });
    },
    [state, updateState]
  );

  const setExpanded = useCallback(
    (expanded: Record<string, boolean>) => {
      updateState({ ...state, expanded });
    },
    [state, updateState]
  );

  // Toggle functions
  const toggleSorting = useCallback(
    (columnId: string) => {
      const newSorting = [...state.sorting];
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

      setSorting(newSorting);
    },
    [state.sorting, setSorting]
  );

  const toggleColumnVisibility = useCallback(
    (columnId: string) => {
      const newVisibility = { ...state.columnVisibility };
      newVisibility[columnId] = !newVisibility[columnId];
      setColumnVisibility(newVisibility);
    },
    [state.columnVisibility, setColumnVisibility]
  );

  const toggleRowSelection = useCallback(
    (rowId: string) => {
      const newSelection = { ...state.rowSelection };
      if (newSelection[rowId]) {
        delete newSelection[rowId];
      } else {
        newSelection[rowId] = true;
      }
      setRowSelection(newSelection);
    },
    [state.rowSelection, setRowSelection]
  );

  const toggleAllRowSelection = useCallback(
    (rowIds: string[]) => {
      const allSelected = rowIds.every((id) => state.rowSelection[id]);
      const newSelection: Record<string, boolean> = {};

      if (!allSelected) {
        rowIds.forEach((id) => {
          newSelection[id] = true;
        });
      }

      setRowSelection(newSelection);
    },
    [state.rowSelection, setRowSelection]
  );

  const toggleRowExpansion = useCallback(
    (rowId: string) => {
      const newExpanded = { ...state.expanded };
      newExpanded[rowId] = !newExpanded[rowId];
      setExpanded(newExpanded);
    },
    [state.expanded, setExpanded]
  );

  // Reset functions
  const resetSorting = useCallback(() => {
    setSorting([]);
  }, [setSorting]);

  const resetFilters = useCallback(() => {
    setColumnFilters([]);
    setGlobalFilter("");
  }, [setColumnFilters, setGlobalFilter]);

  const resetSelection = useCallback(() => {
    setRowSelection({});
  }, [setRowSelection]);

  const resetPagination = useCallback(() => {
    setPagination({ pageIndex: 0, pageSize: state.pagination.pageSize });
  }, [setPagination, state.pagination.pageSize]);

  const resetExpansion = useCallback(() => {
    setExpanded({});
  }, [setExpanded]);

  const resetAll = useCallback(() => {
    updateState({ ...defaultState, ...initialState });
  }, [updateState, initialState]);

  // Computed values
  const hasFilters = useMemo(() => {
    return state.globalFilter.length > 0 || state.columnFilters.length > 0;
  }, [state.globalFilter, state.columnFilters]);

  const hasSorting = useMemo(() => {
    return state.sorting.length > 0;
  }, [state.sorting]);

  const hasSelection = useMemo(() => {
    return Object.keys(state.rowSelection).length > 0;
  }, [state.rowSelection]);

  const selectedCount = useMemo(() => {
    return Object.keys(state.rowSelection).length;
  }, [state.rowSelection]);

  const hasExpansion = useMemo(() => {
    return Object.keys(state.expanded).length > 0;
  }, [state.expanded]);

  const expandedCount = useMemo(() => {
    return Object.keys(state.expanded).length;
  }, [state.expanded]);

  // Clear persistence
  const clearPersistedState = useCallback(() => {
    if (persistState && typeof window !== "undefined") {
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.warn("Failed to clear persisted table state:", error);
      }
    }
  }, [persistState, storageKey]);

  return {
    // State
    state,

    // Individual setters
    setSorting,
    setColumnFilters,
    setGlobalFilter,
    setColumnVisibility,
    setRowSelection,
    setPagination,
    setExpanded,

    // Toggle functions
    toggleSorting,
    toggleColumnVisibility,
    toggleRowSelection,
    toggleAllRowSelection,
    toggleRowExpansion,

    // Reset functions
    resetSorting,
    resetFilters,
    resetSelection,
    resetPagination,
    resetExpansion,
    resetAll,

    // Computed values
    hasFilters,
    hasSorting,
    hasSelection,
    selectedCount,
    hasExpansion,
    expandedCount,

    // Utilities
    updateState,
    clearPersistedState,
  };
}

// Hook for managing table data with filtering, sorting, and pagination
export function useTableData<T>(
  data: T[],
  columns: Array<{ id: string; accessorKey?: keyof T }>,
  state: TableState
) {
  // Apply global filter
  const globalFilteredData = useMemo(() => {
    if (!state.globalFilter) return data;

    return data.filter((row) =>
      Object.values(row as any).some((value) =>
        String(value).toLowerCase().includes(state.globalFilter.toLowerCase())
      )
    );
  }, [data, state.globalFilter]);

  // Apply column filters
  const columnFilteredData = useMemo(() => {
    if (state.columnFilters.length === 0) return globalFilteredData;

    return globalFilteredData.filter((row) => {
      return state.columnFilters.every((filter) => {
        const column = columns.find((col) => col.id === filter.id);
        if (!column || !column.accessorKey) return true;

        const value = (row as any)[column.accessorKey];
        return String(value)
          .toLowerCase()
          .includes(String(filter.value).toLowerCase());
      });
    });
  }, [globalFilteredData, state.columnFilters, columns]);

  // Apply sorting
  const sortedData = useMemo(() => {
    if (state.sorting.length === 0) return columnFilteredData;

    return [...columnFilteredData].sort((a, b) => {
      for (const sort of state.sorting) {
        const column = columns.find((col) => col.id === sort.id);
        if (!column || !column.accessorKey) continue;

        const aValue = (a as any)[column.accessorKey];
        const bValue = (b as any)[column.accessorKey];

        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;

        if (comparison !== 0) {
          return sort.desc ? -comparison : comparison;
        }
      }
      return 0;
    });
  }, [columnFilteredData, state.sorting, columns]);

  // Apply pagination
  const paginatedData = useMemo(() => {
    const { pageIndex, pageSize } = state.pagination;
    const start = pageIndex * pageSize;
    const end = start + pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, state.pagination]);

  // Pagination info
  const pageCount = useMemo(() => {
    return Math.ceil(sortedData.length / state.pagination.pageSize);
  }, [sortedData.length, state.pagination.pageSize]);

  const canPreviousPage = state.pagination.pageIndex > 0;
  const canNextPage = state.pagination.pageIndex < pageCount - 1;

  return {
    // Processed data
    globalFilteredData,
    columnFilteredData,
    sortedData,
    paginatedData,

    // Pagination info
    pageCount,
    canPreviousPage,
    canNextPage,

    // Stats
    totalRows: data.length,
    filteredRows: sortedData.length,
    currentPageRows: paginatedData.length,
  };
}
