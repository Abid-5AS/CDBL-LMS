"use client";

import * as React from "react";
import { SearchModal } from "@/components/ui/search-modal";

interface SearchContextType {
  isOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
}

const SearchContext = React.createContext<SearchContextType | undefined>(
  undefined
);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);

  const openSearch = React.useCallback(() => setIsOpen(true), []);
  const closeSearch = React.useCallback(() => setIsOpen(false), []);
  const toggleSearch = React.useCallback(() => setIsOpen((prev) => !prev), []);

  // Global keyboard shortcut (Cmd/Ctrl + K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggleSearch();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggleSearch]);

  const value = React.useMemo(
    () => ({
      isOpen,
      openSearch,
      closeSearch,
      toggleSearch,
    }),
    [isOpen, openSearch, closeSearch, toggleSearch]
  );

  return (
    <SearchContext.Provider value={value}>
      {children}
      <SearchModal isOpen={isOpen} onClose={closeSearch} />
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = React.useContext(SearchContext);
  if (context === undefined) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}
