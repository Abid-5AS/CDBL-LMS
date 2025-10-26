"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "employee-dashboard-layout";
const DEFAULT_LAYOUT = ["Overview", "Analytics", "History"] as const;

const isSectionId = (value: unknown): value is DashboardSectionId =>
  typeof value === "string" && (DEFAULT_LAYOUT as readonly string[]).includes(value);

export type DashboardSectionId = (typeof DEFAULT_LAYOUT)[number];

function readStoredLayout(): DashboardSectionId[] {
  if (typeof window === "undefined") {
    return [...DEFAULT_LAYOUT];
  }
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as unknown;
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter(isSectionId);
        if (filtered.length) {
          return filtered;
        }
      }
    }
  } catch {
    // ignore corrupted storage
  }
  return [...DEFAULT_LAYOUT];
}

export function useDashboardLayout() {
  const [layout, setLayout] = useState<DashboardSectionId[]>(() => readStoredLayout());

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        setLayout(readStoredLayout());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const saveLayout = (next: DashboardSectionId[]) => {
    setLayout(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  };

  const resetLayout = () => {
    setLayout([...DEFAULT_LAYOUT]);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  return { layout, saveLayout, resetLayout, defaultLayout: DEFAULT_LAYOUT };
}
