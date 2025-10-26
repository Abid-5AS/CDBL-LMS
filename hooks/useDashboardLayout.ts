"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "employee-dashboard-layout";
const DEFAULT_LAYOUT = ["Overview", "Analytics", "History"] as const;

const isSectionId = (value: unknown): value is DashboardSectionId =>
  typeof value === "string" && (DEFAULT_LAYOUT as readonly string[]).includes(value);

export type DashboardSectionId = (typeof DEFAULT_LAYOUT)[number];

export function useDashboardLayout() {
  const [layout, setLayout] = useState<DashboardSectionId[]>([...DEFAULT_LAYOUT]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as DashboardSectionId[];
        if (Array.isArray(parsed) && parsed.length) {
          setLayout(parsed.filter(isSectionId));
        }
      }
    } catch {
      // ignore corrupted storage
    }
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
