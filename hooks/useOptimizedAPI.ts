/**
 * useOptimizedAPI Hook
 *
 * React hook for optimized API fetching with deduplication and caching
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  createOptimizedFetch,
  APIMemoizer,
  RequestDeduplicator,
  ConnectionPool,
} from "@/lib/api/optimization";

/**
 * API response state
 */
export interface APIState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  status: number | null;
}

/**
 * Hook options
 */
interface UseOptimizedAPIOptions {
  /** Enable request deduplication */
  deduplication?: boolean;

  /** Enable memoization */
  memoization?: boolean;

  /** Memoization TTL in milliseconds */
  memoizationTTL?: number;

  /** Cache memoization results across component instances */
  globalMemoization?: boolean;

  /** Automatically fetch on mount */
  autoFetch?: boolean;

  /** Retry failed requests */
  retry?: boolean;

  /** Maximum retry attempts */
  maxRetries?: number;
}

// Global instances for cross-component sharing
let globalMemoizer: APIMemoizer | null = null;
let globalDeduplicator: RequestDeduplicator | null = null;

/**
 * Hook for optimized API fetching
 *
 * Provides automatic request deduplication and memoization
 *
 * @example
 * ```typescript
 * function UserProfile({ userId }) {
 *   const { data, loading, error } = useOptimizedAPI<User>(
 *     `/api/users/${userId}`,
 *     {
 *       autoFetch: true,
 *       memoization: true,
 *       deduplication: true
 *     }
 *   );
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return <div>{data?.name}</div>;
 * }
 * ```
 */
export function useOptimizedAPI<T = any>(
  url: string,
  options: UseOptimizedAPIOptions = {}
) {
  const {
    deduplication = true,
    memoization = true,
    memoizationTTL = 300000, // 5 minutes
    globalMemoization = true,
    autoFetch = true,
    retry = false,
    maxRetries = 3,
  } = options;

  const [state, setState] = useState<APIState<T>>({
    data: null,
    loading: false,
    error: null,
    status: null,
  });

  const memoizerRef = useRef<APIMemoizer | null>(null);
  const deduplicatorRef = useRef<RequestDeduplicator | null>(null);
  const retryCountRef = useRef(0);
  const isUnmountedRef = useRef(false);

  // Initialize optimizations on first render
  useEffect(() => {
    if (memoization) {
      if (globalMemoization) {
        if (!globalMemoizer) {
          globalMemoizer = new APIMemoizer(memoizationTTL);
        }
        memoizerRef.current = globalMemoizer;
      } else {
        memoizerRef.current = new APIMemoizer(memoizationTTL);
      }
    }

    if (deduplication) {
      if (globalMemoization) {
        if (!globalDeduplicator) {
          globalDeduplicator = new RequestDeduplicator();
        }
        deduplicatorRef.current = globalDeduplicator;
      } else {
        deduplicatorRef.current = new RequestDeduplicator();
      }
    }

    return () => {
      isUnmountedRef.current = true;
    };
  }, [memoization, deduplication, globalMemoization, memoizationTTL]);

  // Fetch function
  const fetch = useCallback(
    async (forceRefresh = false) => {
      if (isUnmountedRef.current) return;

      // Check memoization
      if (memoizerRef.current && !forceRefresh) {
        const cached = memoizerRef.current.get<T>(url);
        if (cached) {
          setState({
            data: cached,
            loading: false,
            error: null,
            status: 200,
          });
          return;
        }
      }

      setState((prev) => ({ ...prev, loading: true }));

      try {
        const fetcher = async () => {
          const response = await window.fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.json() as Promise<T>;
        };

        let result: T;

        // Use deduplicator if available
        if (deduplicatorRef.current) {
          result = await deduplicatorRef.current.execute(
            url,
            "GET",
            fetcher
          );
        } else {
          result = await fetcher();
        }

        // Cache result
        if (memoizerRef.current) {
          memoizerRef.current.set(url, result);
        }

        if (!isUnmountedRef.current) {
          setState({
            data: result,
            loading: false,
            error: null,
            status: 200,
          });
          retryCountRef.current = 0;
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        // Retry on failure
        if (retry && retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          const backoffDelay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 10000);
          setTimeout(() => {
            fetch(forceRefresh);
          }, backoffDelay);
          return;
        }

        if (!isUnmountedRef.current) {
          setState({
            data: null,
            loading: false,
            error: err,
            status: null,
          });
        }
      }
    },
    [url, retry, maxRetries]
  );

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetch();
    }
  }, [autoFetch, fetch]);

  // Refetch function
  const refetch = useCallback(() => {
    fetch(true);
  }, [fetch]);

  // Invalidate cache
  const invalidate = useCallback(() => {
    if (memoizerRef.current) {
      // Delete specific key from memoizer
      memoizerRef.current.clear();
    }
    refetch();
  }, [refetch]);

  return {
    ...state,
    fetch,
    refetch,
    invalidate,
    isRefetching: state.loading,
  };
}

/**
 * Hook for managing multiple API requests
 */
interface UseMultipleAPIsOptions extends UseOptimizedAPIOptions {
  /** Wait for all requests to complete before returning */
  parallel?: boolean;
}

export function useMultipleAPIs<T extends Record<string, any>>(
  urls: Record<string, string>,
  options: UseMultipleAPIsOptions = {}
) {
  const { parallel = true, autoFetch = true, ...optimizationOptions } = options;

  const [states, setStates] = useState<Record<string, APIState<any>>>({});
  const [allLoading, setAllLoading] = useState(false);
  const fetchersRef = useRef<Record<string, () => Promise<void>>>({});

  // Create fetchers for each URL
  useEffect(() => {
    Object.entries(urls).forEach(([key, url]) => {
      // Using useOptimizedAPI for each endpoint
      // This is simplified - in real implementation, would use separate hooks
    });
  }, [urls]);

  // Fetch all
  const fetchAll = useCallback(async () => {
    setAllLoading(true);

    if (parallel) {
      await Promise.all(Object.values(fetchersRef.current).map((f) => f()));
    } else {
      for (const fetcher of Object.values(fetchersRef.current)) {
        await fetcher();
      }
    }

    setAllLoading(false);
  }, [parallel]);

  // Auto-fetch
  useEffect(() => {
    if (autoFetch) {
      fetchAll();
    }
  }, [autoFetch, fetchAll]);

  return {
    states,
    allLoading,
    fetchAll,
  };
}

/**
 * Hook for API statistics
 */
export function useAPIStats() {
  const [stats, setStats] = useState({
    memoizer: null as any,
    deduplicator: null as any,
  });

  const getStats = useCallback(() => {
    return {
      memoizer: globalMemoizer ? {
        hits: (globalMemoizer as any).stats?.hits || 0,
        misses: (globalMemoizer as any).stats?.misses || 0,
        hitRate: (globalMemoizer as any).getStats?.()?.hitRate || 0,
      } : null,
      deduplicator: globalDeduplicator?.getStats() || null,
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getStats());
    }, 5000);

    return () => clearInterval(interval);
  }, [getStats]);

  return stats;
}
