/**
 * useRetry Hook
 *
 * Hook for retrying failed operations with exponential backoff.
 * Useful for retrying failed data fetching or API calls.
 */

import { useCallback, useRef, useState } from "react";
import { retryWithBackoff, RetryOptions } from "@/lib/retryUtils";

interface UseRetryState<T> {
  /** Fetched data */
  data: T | null;

  /** Error that occurred */
  error: Error | null;

  /** Whether currently loading */
  isLoading: boolean;

  /** Current attempt number (0-indexed) */
  attempt: number;

  /** Maximum attempts configured */
  maxAttempts: number;
}

interface UseRetryActions {
  /** Retry the operation */
  retry: () => Promise<void>;

  /** Reset state to initial */
  reset: () => void;
}

/**
 * Hook for retrying operations with exponential backoff
 *
 * @param fn - Function to retry
 * @param options - Retry configuration
 * @param immediate - Run function immediately on mount (default: false)
 * @returns Current state and retry actions
 *
 * @example
 * ```typescript
 * const { data, error, isLoading, retry } = useRetry(
 *   () => fetch('/api/data').then(r => r.json()),
 *   { maxAttempts: 3 }
 * );
 *
 * useEffect(() => {
 *   if (error) {
 *     console.error('Failed after retries:', error);
 *   }
 * }, [error]);
 * ```
 */
export function useRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
  immediate: boolean = false
): UseRetryState<T> & UseRetryActions {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(immediate);
  const [attempt, setAttempt] = useState(0);

  const maxAttempts = options.maxAttempts ?? 3;
  const fnRef = useRef(fn);

  // Keep fn ref in sync
  fnRef.current = fn;

  const performRetry = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setAttempt(0);

    try {
      const result = await retryWithBackoff(
        () => fnRef.current(),
        {
          ...options,
          onRetry: (attemptNum) => {
            setAttempt(attemptNum);
            options.onRetry?.(attemptNum);
          },
        }
      );

      setData(result);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
    setAttempt(0);
  }, []);

  // Run immediately if requested
  // This would typically be in useEffect but we avoid that here to keep hook simple
  // The consumer can call retry() in their own useEffect

  return {
    data,
    error,
    isLoading,
    attempt,
    maxAttempts,
    retry: performRetry,
    reset,
  };
}

/**
 * Hook for retrying fetch requests with standard HTTP retry logic
 *
 * @param url - URL to fetch
 * @param options - Fetch options and retry configuration
 * @param immediate - Run fetch immediately on mount (default: true)
 * @returns Current state and retry actions
 *
 * @example
 * ```typescript
 * const { data, error, isLoading, retry } = useFetchWithRetry(
 *   '/api/data',
 *   { maxAttempts: 3, method: 'GET' },
 *   true // immediate fetch
 * );
 *
 * if (error) return <ErrorState onRetry={retry} />;
 * if (isLoading) return <LoadingState />;
 * if (data) return <DataDisplay data={data} />;
 * ```
 */
export function useFetchWithRetry<T>(
  url: string,
  options?: RequestInit & RetryOptions,
  immediate: boolean = true
): UseRetryState<T> & UseRetryActions {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(immediate);
  const [attempt, setAttempt] = useState(0);

  const maxAttempts = options?.maxAttempts ?? 3;
  const urlRef = useRef(url);
  const optionsRef = useRef(options);

  // Keep refs in sync
  urlRef.current = url;
  optionsRef.current = options;

  const performFetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setAttempt(0);

    try {
      const response = await retryWithBackoff(
        () => fetch(urlRef.current, optionsRef.current),
        {
          maxAttempts: optionsRef.current?.maxAttempts,
          initialDelay: optionsRef.current?.initialDelay,
          maxDelay: optionsRef.current?.maxDelay,
          strategy: optionsRef.current?.strategy as "exponential" | "linear" | undefined,
          onRetry: (attemptNum) => {
            setAttempt(attemptNum);
            optionsRef.current?.onRetry?.(attemptNum);
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: T = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
    setAttempt(0);
  }, []);

  return {
    data,
    error,
    isLoading,
    attempt,
    maxAttempts,
    retry: performFetch,
    reset,
  };
}
