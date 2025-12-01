"use client";

"use client";

import React, { createContext, useContext, useMemo, useState, useCallback } from "react";

type SelectionKey = string | number;

type SelectionContextType = {
  selectionCount: number;
  selectedIds: SelectionKey[];
  setSelection: (ids: Iterable<SelectionKey>) => void;
  clearSelection: () => void;
};

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedSet, setSelectedSet] = useState<Set<SelectionKey>>(new Set());

  const setSelection = useCallback((ids: Iterable<SelectionKey>) => {
    setSelectedSet(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSet(new Set());
  }, []);

  const selectedIds = useMemo(() => Array.from(selectedSet), [selectedSet]);
  const value = useMemo(
    () => ({
      selectionCount: selectedSet.size,
      selectedIds,
      setSelection,
      clearSelection,
    }),
    [selectedSet.size, selectedIds, setSelection, clearSelection],
  );

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function useSelectionContext() {
  const context = useContext(SelectionContext);
  if (context === undefined) {
    throw new Error("useSelectionContext must be used within a SelectionProvider");
  }
  return context;
}

export function useSelectionCount(): number {
  const context = useContext(SelectionContext);
  return context?.selectionCount ?? 0;
}

export function useSelectedIds(): SelectionKey[] {
  const context = useContext(SelectionContext);
  return context?.selectedIds ?? [];
}
