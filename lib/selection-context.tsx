"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

type SelectionContextType = {
  selectionCount: number;
  selectedIds: (string | number)[];
  setSelectionCount: (count: number) => void;
  setSelectedIds: (ids: (string | number)[]) => void;
  incrementSelection: () => void;
  decrementSelection: () => void;
  clearSelection: () => void;
  addSelection: (id: string | number) => void;
  removeSelection: (id: string | number) => void;
  toggleSelection: (id: string | number) => void;
};

const SelectionContext = createContext<SelectionContextType | undefined>(
  undefined
);

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectionCount, setSelectionCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

  const incrementSelection = useCallback(() => {
    setSelectionCount((prev) => prev + 1);
  }, []);

  const decrementSelection = useCallback(() => {
    setSelectionCount((prev) => Math.max(0, prev - 1));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectionCount(0);
    setSelectedIds([]);
  }, []);

  const addSelection = useCallback((id: string | number) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      setSelectionCount(updated.length);
      return updated;
    });
  }, []);

  const removeSelection = useCallback((id: string | number) => {
    setSelectedIds((prev) => {
      const updated = prev.filter((item) => item !== id);
      setSelectionCount(updated.length);
      return updated;
    });
  }, []);

  const toggleSelection = useCallback((id: string | number) => {
    setSelectedIds((prev) => {
      const exists = prev.includes(id);
      const updated = exists 
        ? prev.filter((item) => item !== id)
        : [...prev, id];
      setSelectionCount(updated.length);
      return updated;
    });
  }, []);

  return (
    <SelectionContext.Provider
      value={{
        selectionCount,
        selectedIds,
        setSelectionCount,
        setSelectedIds,
        incrementSelection,
        decrementSelection,
        clearSelection,
        addSelection,
        removeSelection,
        toggleSelection,
      }}
    >
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelectionContext() {
  const context = useContext(SelectionContext);
  if (context === undefined) {
    throw new Error(
      "useSelectionContext must be used within a SelectionProvider"
    );
  }
  return context;
}

export function useSelectionCount(): number {
  const context = useContext(SelectionContext);
  return context?.selectionCount ?? 0;
}

export function useSelectedIds(): (string | number)[] {
  const context = useContext(SelectionContext);
  return context?.selectedIds ?? [];
}

