"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

type SelectionContextType = {
  selectionCount: number;
  setSelectionCount: (count: number) => void;
  incrementSelection: () => void;
  decrementSelection: () => void;
  clearSelection: () => void;
};

const SelectionContext = createContext<SelectionContextType | undefined>(
  undefined
);

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectionCount, setSelectionCount] = useState(0);

  const incrementSelection = useCallback(() => {
    setSelectionCount((prev) => prev + 1);
  }, []);

  const decrementSelection = useCallback(() => {
    setSelectionCount((prev) => Math.max(0, prev - 1));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectionCount(0);
  }, []);

  return (
    <SelectionContext.Provider
      value={{
        selectionCount,
        setSelectionCount,
        incrementSelection,
        decrementSelection,
        clearSelection,
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

