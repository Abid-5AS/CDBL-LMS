"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";

const DRAFT_STORAGE_KEY = "leave-application-draft";
const AUTOSAVE_INTERVAL = 30000; // 30 seconds

type LeaveType = string;

export interface DraftData {
  timestamp: number;
  type: LeaveType;
  startDate: string | null;
  endDate: string | null;
  reason: string;
  fileName: string | null;
}

interface UseDraftAutosaveOptions {
  type: LeaveType;
  startDate: Date | undefined;
  endDate: Date | undefined;
  reason: string;
  fileName: string | null;
  enabled?: boolean;
}

export function useDraftAutosave({
  type,
  startDate,
  endDate,
  reason,
  fileName,
  enabled = true,
}: UseDraftAutosaveOptions) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string | null>(null);

  // Save draft to localStorage
  const saveDraft = useCallback(() => {
    if (!enabled) return;

    // Check if form is empty
    const isEmpty = !startDate && !endDate && !reason.trim();
    if (isEmpty) {
      return;
    }

    const draft: DraftData = {
      timestamp: Date.now(),
      type,
      startDate: startDate?.toISOString() || null,
      endDate: endDate?.toISOString() || null,
      reason,
      fileName,
    };

    const serialized = JSON.stringify(draft);
    
    // Only update if something changed
    if (serialized === lastSavedRef.current) {
      return;
    }

    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, serialized);
      lastSavedRef.current = serialized;
      setLastSaved(new Date());
    } catch (error) {
      console.error("Failed to save draft:", error);
    }
  }, [type, startDate, endDate, reason, fileName, enabled]);

  // Load draft from localStorage
  const loadDraft = useCallback((): DraftData | null => {
    try {
      const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!stored) return null;

      const draft: DraftData = JSON.parse(stored);
      setHasDraft(true);
      return draft;
    } catch (error) {
      console.error("Failed to load draft:", error);
      return null;
    }
  }, []);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setHasDraft(false);
      lastSavedRef.current = null;
      setLastSaved(null);
    } catch (error) {
      console.error("Failed to clear draft:", error);
    }
  }, []);

  // Check if draft exists on mount
  useEffect(() => {
    const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
    setHasDraft(!!stored);
  }, []);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!enabled) return;

    // Save immediately on mount
    saveDraft();

    // Then save every interval
    intervalRef.current = setInterval(() => {
      saveDraft();
    }, AUTOSAVE_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [saveDraft, enabled]);

  return {
    lastSaved,
    hasDraft,
    saveDraft,
    loadDraft,
    clearDraft,
  };
}
