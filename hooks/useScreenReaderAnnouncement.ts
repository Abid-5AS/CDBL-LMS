/**
 * useScreenReaderAnnouncement Hook
 *
 * React hook for making screen reader announcements
 */

import { useCallback, useEffect } from "react";
import {
  getGlobalAnnouncer,
  type AnnouncementOptions,
} from "@/lib/accessibility/screenReader";

/**
 * Hook for screen reader announcements
 *
 * Provides easy way to announce messages to screen readers
 *
 * @example
 * ```typescript
 * function Form() {
 *   const { announce, announceError, announceSuccess } = useScreenReaderAnnouncement();
 *
 *   const handleSubmit = async () => {
 *     try {
 *       await submitForm();
 *       announceSuccess("Form submitted successfully");
 *     } catch (error) {
 *       announceError("Form submission failed");
 *     }
 *   };
 * }
 * ```
 */
export function useScreenReaderAnnouncement() {
  // Announce generic message
  const announce = useCallback(
    (message: string, options?: AnnouncementOptions) => {
      getGlobalAnnouncer().announce(message, options);
    },
    []
  );

  // Announce error
  const announceError = useCallback((message: string, delay?: number) => {
    getGlobalAnnouncer().announceError(message, delay);
  }, []);

  // Announce success
  const announceSuccess = useCallback((message: string, delay?: number) => {
    getGlobalAnnouncer().announceSuccess(message, delay);
  }, []);

  // Announce loading
  const announceLoading = useCallback((message?: string) => {
    getGlobalAnnouncer().announceLoading(message);
  }, []);

  // Clear announcements
  const clear = useCallback(() => {
    getGlobalAnnouncer().clear();
  }, []);

  return {
    announce,
    announceError,
    announceSuccess,
    announceLoading,
    clear,
  };
}
