"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { AnnotationModeConfig, AnnotationCategory, AnnotationType } from "@/types/annotations";

interface AnnotationModeContextValue {
  config: AnnotationModeConfig;
  isEnabled: boolean;
  toggle: () => void;
  enable: () => void;
  disable: () => void;
  setVisibleCategories: (categories: AnnotationCategory[]) => void;
  setVisibleTypes: (types: AnnotationType[]) => void;
  setShowMode: (mode: "always" | "hover" | "click") => void;
  reset: () => void;
}

const AnnotationModeContext = createContext<AnnotationModeContextValue | undefined>(undefined);

const DEFAULT_CONFIG: AnnotationModeConfig = {
  enabled: false,
  visibleCategories: [
    "data-flow",
    "user-action",
    "state-management",
    "api-integration",
    "business-logic",
    "ui-presentation",
  ],
  visibleTypes: ["component", "api", "hook", "service", "utility", "database", "workflow"],
  showMode: "hover",
  toggleShortcut: "ctrl+shift+a",
  opacity: 0.9,
  filterTags: [],
};

const STORAGE_KEY = "dev-annotation-mode-config";

export function AnnotationModeProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AnnotationModeConfig>(() => {
    // Load from localStorage on mount
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          return { ...DEFAULT_CONFIG, ...parsed };
        }
      } catch (error) {
        console.warn("Failed to load annotation mode config from localStorage:", error);
      }
    }
    return DEFAULT_CONFIG;
  });

  // Persist config to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      } catch (error) {
        console.warn("Failed to save annotation mode config to localStorage:", error);
      }
    }
  }, [config]);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const shortcut = config.toggleShortcut || "ctrl+shift+a";
      const keys = shortcut.toLowerCase().split("+");

      const ctrl = keys.includes("ctrl") || keys.includes("control");
      const shift = keys.includes("shift");
      const alt = keys.includes("alt");
      const key = keys[keys.length - 1];

      if (
        event.key.toLowerCase() === key &&
        event.ctrlKey === ctrl &&
        event.shiftKey === shift &&
        event.altKey === alt
      ) {
        event.preventDefault();
        toggle();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [config.toggleShortcut]);

  const toggle = useCallback(() => {
    setConfig((prev) => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  const enable = useCallback(() => {
    setConfig((prev) => ({ ...prev, enabled: true }));
  }, []);

  const disable = useCallback(() => {
    setConfig((prev) => ({ ...prev, enabled: false }));
  }, []);

  const setVisibleCategories = useCallback((categories: AnnotationCategory[]) => {
    setConfig((prev) => ({ ...prev, visibleCategories: categories }));
  }, []);

  const setVisibleTypes = useCallback((types: AnnotationType[]) => {
    setConfig((prev) => ({ ...prev, visibleTypes: types }));
  }, []);

  const setShowMode = useCallback((mode: "always" | "hover" | "click") => {
    setConfig((prev) => ({ ...prev, showMode: mode }));
  }, []);

  const reset = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const value: AnnotationModeContextValue = {
    config,
    isEnabled: config.enabled,
    toggle,
    enable,
    disable,
    setVisibleCategories,
    setVisibleTypes,
    setShowMode,
    reset,
  };

  return (
    <AnnotationModeContext.Provider value={value}>
      {children}
    </AnnotationModeContext.Provider>
  );
}

export function useAnnotationMode() {
  const context = useContext(AnnotationModeContext);
  if (context === undefined) {
    throw new Error("useAnnotationMode must be used within an AnnotationModeProvider");
  }
  return context;
}
