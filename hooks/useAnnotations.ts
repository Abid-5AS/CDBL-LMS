/**
 * useAnnotations Hook
 *
 * React hook for managing annotations configuration in components
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AnnotationType,
  AnnotationsState,
  getAnnotationsConfig,
  toggleAnnotation,
  isAnnotationEnabled,
  getEnabledAnnotations,
  getAnnotationsByCategory,
  resetAnnotationsConfig,
  getAnnotationsStats,
  DEFAULT_ANNOTATIONS,
} from "@/lib/annotations/config";

/**
 * Hook to access and manage annotations configuration
 */
export function useAnnotations() {
  const [config, setConfig] = useState<AnnotationsState>(DEFAULT_ANNOTATIONS);
  const [isClient, setIsClient] = useState(false);

  // Initialize on client side
  useEffect(() => {
    setIsClient(true);
    setConfig(getAnnotationsConfig());

    // Listen for changes from other components
    const handleChange = () => {
      setConfig(getAnnotationsConfig());
    };

    window.addEventListener("annotations-changed", handleChange);
    window.addEventListener("annotations-reset", handleChange);

    return () => {
      window.removeEventListener("annotations-changed", handleChange);
      window.removeEventListener("annotations-reset", handleChange);
    };
  }, []);

  const toggle = useCallback((type: AnnotationType) => {
    toggleAnnotation(type);
    setConfig(getAnnotationsConfig());
  }, []);

  const reset = useCallback(() => {
    resetAnnotationsConfig();
    setConfig(DEFAULT_ANNOTATIONS);
  }, []);

  const isEnabled = useCallback((type: AnnotationType): boolean => {
    return isAnnotationEnabled(type);
  }, []);

  const getEnabledList = useCallback((): AnnotationType[] => {
    return getEnabledAnnotations();
  }, []);

  const getByCategory = useCallback((category: "accessibility" | "performance" | "security" | "deployment" | "quality") => {
    return getAnnotationsByCategory(category);
  }, []);

  const getStats = useCallback(() => {
    return getAnnotationsStats();
  }, []);

  return {
    config,
    isClient,
    toggle,
    reset,
    isEnabled,
    getEnabledList,
    getByCategory,
    getStats,
  };
}

/**
 * Hook to check if a specific annotation is enabled
 * Useful for inline conditional rendering
 */
export function useAnnotationEnabled(type: AnnotationType): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(isAnnotationEnabled(type));

    const handleChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.type === type) {
        setEnabled(customEvent.detail.enabled);
      }
    };

    window.addEventListener("annotations-changed", handleChange);
    return () => window.removeEventListener("annotations-changed", handleChange);
  }, [type]);

  return enabled;
}
