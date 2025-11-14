/**
 * useCache Hook
 *
 * React hook for managing cache in components
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { LRUCache, TTLCache, type CacheStats } from "@/lib/cache/strategies";
import {
  CacheInvalidationManager,
  type InvalidationEvent,
} from "@/lib/cache/invalidation";
import { CACHE_CONFIG } from "@/constants/performance";

/**
 * Hook options
 */
interface UseCacheOptions<T> {
  /** Cache strategy: 'lru' or 'ttl' */
  strategy?: "lru" | "ttl";

  /** Time to live in milliseconds */
  ttl?: number;

  /** Maximum cache size */
  maxSize?: number;

  /** Callback on invalidation */
  onInvalidate?: (event: InvalidationEvent) => void;

  /** Enable metrics recording */
  recordMetrics?: boolean;
}

/**
 * Cache hook for storing computed values
 *
 * Provides an easy way to cache values with automatic expiration and invalidation
 *
 * @example
 * ```typescript
 * function UserProfile({ userId }) {
 *   const { set, get, clear } = useCache<User>({
 *     ttl: 60000,
 *     strategy: 'ttl'
 *   });
 *
 *   useEffect(() => {
 *     const cached = get(`user-${userId}`);
 *     if (!cached) {
 *       fetchUser(userId).then(user => {
 *         set(`user-${userId}`, user);
 *       });
 *     }
 *   }, [userId]);
 *
 *   return <div>{get(`user-${userId}`)?.name}</div>;
 * }
 * ```
 */
export function useCache<T>(options: UseCacheOptions<T> = {}) {
  const {
    strategy = "lru",
    ttl = CACHE_CONFIG.defaultTTL,
    maxSize = CACHE_CONFIG.maxCacheSize,
    onInvalidate,
    recordMetrics = false,
  } = options;

  const cacheRef = useRef<LRUCache<T> | TTLCache<T> | null>(null);
  const invalidationRef = useRef<CacheInvalidationManager | null>(null);
  const [stats, setStats] = useState<CacheStats | null>(null);

  // Initialize cache
  useEffect(() => {
    if (strategy === "lru") {
      cacheRef.current = new LRUCache<T>(maxSize, ttl);
    } else {
      cacheRef.current = new TTLCache<T>(ttl);
    }

    // Initialize invalidation manager
    invalidationRef.current = new CacheInvalidationManager();

    // Subscribe to invalidation events
    if (onInvalidate) {
      invalidationRef.current.subscribe(onInvalidate);
    }

    return () => {
      // Cleanup on unmount
      if (cacheRef.current) {
        if (strategy === "ttl" && "destroy" in cacheRef.current) {
          (cacheRef.current as TTLCache<T>).destroy();
        }
      }
      if (invalidationRef.current) {
        invalidationRef.current.destroy();
      }
    };
  }, [strategy, ttl, maxSize, onInvalidate]);

  // Get value from cache
  const get = useCallback((key: string): T | null => {
    if (!cacheRef.current) return null;
    return cacheRef.current.get(key);
  }, []);

  // Set value in cache
  const set = useCallback(
    (key: string, value: T, customTtl?: number): void => {
      if (!cacheRef.current) return;
      cacheRef.current.set(key, value, customTtl);

      // Update stats if recording metrics
      if (recordMetrics && "getStats" in cacheRef.current) {
        setStats((cacheRef.current as LRUCache<T>).getStats());
      }
    },
    [recordMetrics]
  );

  // Delete from cache
  const del = useCallback((key: string): void => {
    if (!cacheRef.current) return;
    cacheRef.current.delete(key);

    // Trigger invalidation
    invalidationRef.current?.invalidate(key, "Manual deletion");

    // Update stats
    if (recordMetrics && "getStats" in cacheRef.current) {
      setStats((cacheRef.current as LRUCache<T>).getStats());
    }
  }, [recordMetrics]);

  // Check if key exists
  const has = useCallback((key: string): boolean => {
    if (!cacheRef.current) return false;
    return cacheRef.current.has(key);
  }, []);

  // Clear all cache
  const clear = useCallback((): void => {
    if (!cacheRef.current) return;
    cacheRef.current.clear();

    if (recordMetrics && "getStats" in cacheRef.current) {
      setStats((cacheRef.current as LRUCache<T>).getStats());
    }
  }, [recordMetrics]);

  // Get all keys
  const keys = useCallback((): string[] => {
    if (!cacheRef.current || !("keys" in cacheRef.current)) {
      return [];
    }
    return (cacheRef.current as LRUCache<T>).keys();
  }, []);

  // Get cache stats
  const getStats = useCallback((): CacheStats | null => {
    if (!cacheRef.current || !("getStats" in cacheRef.current)) {
      return null;
    }
    return (cacheRef.current as LRUCache<T>).getStats();
  }, []);

  // Invalidate by pattern
  const invalidateByPattern = useCallback(
    (pattern: RegExp | string, reason?: string): number => {
      if (!invalidationRef.current) return 0;
      return invalidationRef.current.invalidateByPattern(
        pattern,
        reason || "Pattern match"
      );
    },
    []
  );

  // Add invalidation rule
  const addRule = useCallback(
    (
      key: string,
      rule: {
        pattern?: RegExp | string;
        trigger?: "time" | "event" | "manual";
        ttl?: number;
        dependencies?: string[];
      }
    ): void => {
      if (!invalidationRef.current) return;
      invalidationRef.current.addRule(key, rule as any);
    },
    []
  );

  // Get cache size info (for LRU cache)
  const getCacheSize = useCallback((): number => {
    if (!cacheRef.current || !("getStats" in cacheRef.current)) {
      return 0;
    }
    return (cacheRef.current as LRUCache<T>).getStats().size;
  }, []);

  return {
    // Core operations
    get,
    set,
    delete: del,
    has,
    clear,
    keys,

    // Stats and monitoring
    getStats,
    stats,
    getCacheSize,

    // Invalidation
    invalidateByPattern,
    addRule,
  };
}

/**
 * useAsyncCache Hook
 *
 * Cache hook with async data fetching
 */
interface UseAsyncCacheOptions<T> extends UseCacheOptions<T> {
  /** Function to fetch data */
  fetcher?: (key: string) => Promise<T>;

  /** Callback when fetch starts */
  onFetchStart?: (key: string) => void;

  /** Callback when fetch completes */
  onFetchComplete?: (key: string, value: T) => void;

  /** Callback on fetch error */
  onFetchError?: (key: string, error: Error) => void;
}

export function useAsyncCache<T>(
  options: UseAsyncCacheOptions<T> = {}
) {
  const {
    fetcher,
    onFetchStart,
    onFetchComplete,
    onFetchError,
    ...cacheOptions
  } = options;

  const cache = useCache<T>(cacheOptions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch and cache data
  const fetchAndCache = useCallback(
    async (key: string, forceRefresh = false): Promise<T | null> => {
      if (!fetcher) return null;

      // Return cached value if available and not forced refresh
      if (!forceRefresh) {
        const cached = cache.get(key);
        if (cached) return cached;
      }

      setLoading(true);
      setError(null);

      try {
        onFetchStart?.(key);

        const data = await fetcher(key);
        cache.set(key, data);

        onFetchComplete?.(key, data);
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onFetchError?.(key, error);

        // Return cached value as fallback
        return cache.get(key);
      } finally {
        setLoading(false);
      }
    },
    [cache, fetcher, onFetchStart, onFetchComplete, onFetchError]
  );

  return {
    ...cache,
    fetchAndCache,
    loading,
    error,
  };
}
