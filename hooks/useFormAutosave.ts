"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import debounce from "lodash/debounce";

export interface AutoSaveOptions<T> {
  key: string;
  data: T;
  enabled?: boolean;
  debounceMs?: number;
  storage?: "localStorage" | "sessionStorage";
  onSave?: (data: T) => void;
  onLoad?: (data: T) => void;
  onError?: (error: Error) => void;
  serialize?: (data: T) => string;
  deserialize?: (data: string) => T;
  exclude?: (keyof T)[];
}

export function useFormAutoSave<T extends Record<string, any>>({
  key,
  data,
  enabled = true,
  debounceMs = 1000,
  storage = "localStorage",
  onSave,
  onLoad,
  onError,
  serialize,
  deserialize,
  exclude = [],
}: AutoSaveOptions<T>) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const previousDataRef = useRef<T | null>(null);
  const storageRef = useRef<Storage | null>(null);

  // Initialize storage reference
  useEffect(() => {
    if (typeof window !== "undefined") {
      storageRef.current =
        storage === "localStorage" ? localStorage : sessionStorage;
    }
  }, [storage]);

  // Filter out excluded fields
  const getFilteredData = useCallback(
    (data: T): Partial<T> => {
      if (exclude.length === 0) return data;

      const filtered = { ...data };
      exclude.forEach((field) => {
        delete filtered[field];
      });
      return filtered;
    },
    [exclude]
  );

  // Save data to storage
  const saveToStorage = useCallback(
    async (dataToSave: T) => {
      if (!enabled || !storageRef.current) return;

      try {
        setIsSaving(true);
        setSaveError(null);

        const filteredData = getFilteredData(dataToSave);
        const serializedData = serialize
          ? serialize(filteredData as T)
          : JSON.stringify({
              data: filteredData,
              timestamp: new Date().toISOString(),
              version: "1.0",
            });

        storageRef.current.setItem(key, serializedData);
        setLastSaved(new Date());
        onSave?.(dataToSave);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to save draft";
        setSaveError(errorMessage);
        onError?.(error instanceof Error ? error : new Error(errorMessage));
      } finally {
        setIsSaving(false);
      }
    },
    [enabled, key, serialize, getFilteredData, onSave, onError]
  );

  // Debounced save function using useRef to avoid recreation on every render
  const debouncedSaveRef = useRef<ReturnType<typeof debounce<typeof saveToStorage>>>();

  useEffect(() => {
    // Create new debounced function when dependencies change
    debouncedSaveRef.current = debounce(saveToStorage, debounceMs);

    // Cleanup: cancel any pending debounced calls when dependencies change
    return () => {
      debouncedSaveRef.current?.cancel();
    };
  }, [saveToStorage, debounceMs]);

  // Helper to call debounced save
  const debouncedSave = useCallback((data: T) => {
    debouncedSaveRef.current?.(data);
  }, []);

  // Load data from storage
  const loadFromStorage = useCallback((): T | null => {
    if (!storageRef.current) return null;

    try {
      const savedData = storageRef.current.getItem(key);
      if (!savedData) return null;

      if (deserialize) {
        return deserialize(savedData);
      }

      const parsed = JSON.parse(savedData);

      // Handle both old and new format
      const data = parsed.data || parsed;
      onLoad?.(data);
      return data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load draft";
      setSaveError(errorMessage);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
      return null;
    }
  }, [key, deserialize, onLoad, onError]);

  // Clear saved data
  const clearSavedData = useCallback(() => {
    if (!storageRef.current) return;

    try {
      storageRef.current.removeItem(key);
      setLastSaved(null);
      setSaveError(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to clear draft";
      setSaveError(errorMessage);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [key, onError]);

  // Check if data has changed
  const hasDataChanged = useCallback(
    (newData: T, previousData: T | null): boolean => {
      if (!previousData) return true;

      const filteredNew = getFilteredData(newData);
      const filteredPrevious = getFilteredData(previousData);

      return JSON.stringify(filteredNew) !== JSON.stringify(filteredPrevious);
    },
    [getFilteredData]
  );

  // Auto-save effect
  useEffect(() => {
    if (!enabled || !data) return;

    // Check if data has actually changed
    if (!hasDataChanged(data, previousDataRef.current)) {
      return;
    }

    // Update previous data reference
    previousDataRef.current = data;

    // Trigger debounced save
    debouncedSave(data);

    // Cleanup function to cancel pending saves
    return () => {
      debouncedSaveRef.current?.cancel();
    };
  }, [data, enabled, hasDataChanged, debouncedSave]);

  // Get saved data info
  const getSavedDataInfo = useCallback(() => {
    if (!storageRef.current) return null;

    try {
      const savedData = storageRef.current.getItem(key);
      if (!savedData) return null;

      const parsed = JSON.parse(savedData);
      return {
        timestamp: parsed.timestamp ? new Date(parsed.timestamp) : null,
        version: parsed.version || "unknown",
        size: savedData.length,
      };
    } catch {
      return null;
    }
  }, [key]);

  // Check if there's saved data available
  const hasSavedData = useCallback((): boolean => {
    if (!storageRef.current) return false;
    return storageRef.current.getItem(key) !== null;
  }, [key]);

  // Force save (bypass debounce)
  const forceSave = useCallback(() => {
    if (!enabled || !data) return;
    debouncedSaveRef.current?.cancel();
    saveToStorage(data);
  }, [enabled, data, saveToStorage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedSaveRef.current?.cancel();
    };
  }, []);

  return {
    // State
    lastSaved,
    isSaving,
    saveError,

    // Actions
    loadFromStorage,
    clearSavedData,
    forceSave,

    // Utilities
    getSavedDataInfo,
    hasSavedData,
  };
}

// Hook for managing multiple form drafts
// NOTE: This hook requires forms array to have stable length and order across renders
// to comply with React's Rules of Hooks
export function useMultiFormAutoSave<T extends Record<string, any>>(
  forms: Array<{
    key: string;
    data: T;
    options?: Partial<AutoSaveOptions<T>>;
  }>
) {
  // Store forms count to validate stability
  const formsCountRef = useRef(forms.length);

  // Validate that forms array length is stable
  if (process.env.NODE_ENV === 'development') {
    if (formsCountRef.current !== forms.length) {
      console.error(
        `useMultiFormAutoSave: Forms array length changed from ${formsCountRef.current} to ${forms.length}. ` +
        'This violates Rules of Hooks. Ensure forms array has stable length across renders.'
      );
    }
  }

  // Call hooks for each form - this is safe if forms array length is stable
  // We call the hooks in a fixed order based on the initial forms array length
  const hook0 = forms[0] ? useFormAutoSave({ key: forms[0].key, data: forms[0].data, ...forms[0].options }) : null;
  const hook1 = forms[1] ? useFormAutoSave({ key: forms[1].key, data: forms[1].data, ...forms[1].options }) : null;
  const hook2 = forms[2] ? useFormAutoSave({ key: forms[2].key, data: forms[2].data, ...forms[2].options }) : null;
  const hook3 = forms[3] ? useFormAutoSave({ key: forms[3].key, data: forms[3].data, ...forms[3].options }) : null;
  const hook4 = forms[4] ? useFormAutoSave({ key: forms[4].key, data: forms[4].data, ...forms[4].options }) : null;

  // Collect active hooks
  const autoSaveHooks = [hook0, hook1, hook2, hook3, hook4].filter((hook): hook is NonNullable<typeof hook> => hook !== null);

  const clearAllDrafts = useCallback(() => {
    autoSaveHooks.forEach((hook) => hook.clearSavedData());
  }, [autoSaveHooks]);

  const forceAllSaves = useCallback(() => {
    autoSaveHooks.forEach((hook) => hook.forceSave());
  }, [autoSaveHooks]);

  const hasAnyDrafts = useCallback(() => {
    return autoSaveHooks.some((hook) => hook.hasSavedData());
  }, [autoSaveHooks]);

  const isAnySaving = autoSaveHooks.some((hook) => hook.isSaving);
  const hasAnyErrors = autoSaveHooks.some((hook) => hook.saveError);

  return {
    hooks: autoSaveHooks,
    clearAllDrafts,
    forceAllSaves,
    hasAnyDrafts,
    isAnySaving,
    hasAnyErrors,
  };
}

// Utility function to create a storage key
export function createStorageKey(prefix: string, ...parts: string[]): string {
  return [prefix, ...parts].filter(Boolean).join(":");
}

// Utility function to compress data for storage
export function compressForStorage<T>(data: T): string {
  try {
    const jsonString = JSON.stringify(data);
    // Simple compression by removing unnecessary whitespace
    return jsonString.replace(/\s+/g, " ").trim();
  } catch {
    return JSON.stringify(data);
  }
}

// Utility function to get storage usage
export function getStorageUsage(
  storage: "localStorage" | "sessionStorage" = "localStorage"
): {
  used: number;
  total: number;
  percentage: number;
} {
  if (typeof window === "undefined") {
    return { used: 0, total: 0, percentage: 0 };
  }

  const storageObj = storage === "localStorage" ? localStorage : sessionStorage;
  let used = 0;

  for (const key in storageObj) {
    if (storageObj.hasOwnProperty(key)) {
      used += storageObj[key].length + key.length;
    }
  }

  // Approximate total storage limit (5MB for most browsers)
  const total = 5 * 1024 * 1024;
  const percentage = (used / total) * 100;

  return { used, total, percentage };
}
