/**
 * Cache Strategies
 *
 * Implementation of various caching strategies for optimal performance
 */

import { recordCustomMetric } from "@/lib/performance/metrics";
import { CACHE_CONFIG } from "@/constants/performance";

/**
 * Cache entry metadata
 */
export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  expiresAt: number;
  hits: number;
  lastAccessed: number;
  key: string;
  size: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
  entries: number;
  hitRate: number;
  avgEntrySize: number;
}

/**
 * LRU (Least Recently Used) Cache Strategy
 */
export class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private maxSize: number;
  private ttl: number;
  private hits = 0;
  private misses = 0;
  private totalSize = 0;

  constructor(
    maxSize: number = CACHE_CONFIG.maxCacheSize,
    ttl: number = CACHE_CONFIG.defaultTTL
  ) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if expired
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      this.totalSize -= entry.size;
      this.misses++;
      return null;
    }

    // Update access info (move to end for LRU)
    entry.hits++;
    entry.lastAccessed = Date.now();

    // Re-insert to move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    this.hits++;
    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    const size = this.estimateSize(value);
    const expiresAt = Date.now() + (ttl || this.ttl);

    // Remove old entry if exists
    const oldEntry = this.cache.get(key);
    if (oldEntry) {
      this.totalSize -= oldEntry.size;
    }

    // Create new entry
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      expiresAt,
      hits: 0,
      lastAccessed: Date.now(),
      key,
      size,
    };

    this.cache.set(key, entry);
    this.totalSize += size;

    // Evict LRU entries if cache exceeds max size
    while (this.totalSize > this.maxSize && this.cache.size > 0) {
      const firstKey = this.cache.keys().next().value;
      const removedEntry = this.cache.get(firstKey)!;
      this.cache.delete(firstKey);
      this.totalSize -= removedEntry.size;
    }
  }

  /**
   * Remove entry from cache
   */
  delete(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      this.cache.delete(key);
      this.totalSize -= entry.size;
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.totalSize = 0;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Check if key exists and not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (entry.expiresAt < Date.now()) {
      this.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.totalSize,
      maxSize: this.maxSize,
      entries: this.cache.size,
      hitRate: (this.hits / (this.hits + this.misses)) * 100 || 0,
      avgEntrySize: this.cache.size > 0 ? this.totalSize / this.cache.size : 0,
    };
  }

  /**
   * Get all keys in cache
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size in bytes
   */
  private estimateSize(obj: any): number {
    const str = JSON.stringify(obj);
    return new Blob([str]).size;
  }
}

/**
 * Time-based Cache (TTL) Strategy
 */
export class TTLCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private ttl: number;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private hits = 0;
  private misses = 0;

  constructor(
    ttl: number = CACHE_CONFIG.defaultTTL,
    cleanupIntervalMs: number = 60000
  ) {
    this.cache = new Map();
    this.ttl = ttl;

    // Periodic cleanup of expired entries
    if (typeof window === "undefined") {
      this.cleanupInterval = setInterval(
        () => this.cleanup(),
        cleanupIntervalMs
      );
    }
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    entry.hits++;
    entry.lastAccessed = Date.now();
    this.hits++;
    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      expiresAt: Date.now() + (ttl || this.ttl),
      hits: 0,
      lastAccessed: Date.now(),
      key,
      size: 0,
    };

    this.cache.set(key, entry);
  }

  /**
   * Delete entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (entry.expiresAt < now) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Get statistics
   */
  getStats(): Omit<CacheStats, "size" | "maxSize" | "avgEntrySize"> {
    return {
      hits: this.hits,
      misses: this.misses,
      entries: this.cache.size,
      hitRate: (this.hits / (this.hits + this.misses)) * 100 || 0,
    };
  }

  /**
   * Destroy cache and cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

/**
 * Write-Through Cache Strategy
 *
 * Writes to both cache and source simultaneously
 */
export async function writeThrough<T>(
  key: string,
  value: T,
  cache: Map<string, T>,
  sourceWrite: (key: string, value: T) => Promise<void>
): Promise<void> {
  // Write to source first for consistency
  await sourceWrite(key, value);
  // Then write to cache
  cache.set(key, value);
}

/**
 * Write-Back Cache Strategy
 *
 * Writes to cache first, then asynchronously to source
 */
export function writeBack<T>(
  key: string,
  value: T,
  cache: Map<string, T>,
  sourceWrite: (key: string, value: T) => Promise<void>,
  delayMs: number = 1000
): void {
  // Write to cache immediately
  cache.set(key, value);

  // Write to source asynchronously
  setTimeout(() => {
    sourceWrite(key, value).catch((error) => {
      console.error(`Write-back cache failed for key ${key}:`, error);
    });
  }, delayMs);
}

/**
 * Stale While Revalidate Cache Strategy
 *
 * Serve stale data while revalidating in background
 */
export async function staleWhileRevalidate<T>(
  key: string,
  cache: Map<string, T>,
  fetcher: () => Promise<T>,
  staleTime: number = 60000
): Promise<T> {
  const cached = cache.get(key);

  // Serve stale data immediately if available
  if (cached) {
    // Revalidate in background
    fetcher()
      .then((fresh) => {
        cache.set(key, fresh);
      })
      .catch((error) => {
        console.warn(`Revalidation failed for key ${key}:`, error);
      });

    return cached;
  }

  // No cache, fetch fresh data
  const fresh = await fetcher();
  cache.set(key, fresh);
  return fresh;
}

/**
 * Cache-Aside (Lazy Loading) Strategy
 *
 * Check cache first, if miss, fetch and populate
 */
export async function cacheAside<T>(
  key: string,
  cache: Map<string, T>,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = cache.get(key);

  if (cached) {
    return cached;
  }

  const fresh = await fetcher();
  cache.set(key, fresh);
  return fresh;
}

/**
 * Refresh Cache Strategy
 *
 * Proactively refresh cache before expiration
 */
export async function refreshCache<T>(
  key: string,
  cache: Map<string, T>,
  fetcher: () => Promise<T>,
  refreshBeforeExpiry: number = 5000
): Promise<void> {
  const cached = cache.get(key);

  if (cached) {
    // Refresh proactively
    setTimeout(async () => {
      try {
        const fresh = await fetcher();
        cache.set(key, fresh);
      } catch (error) {
        console.error(`Cache refresh failed for key ${key}:`, error);
      }
    }, Math.max(0, Date.now() - refreshBeforeExpiry));
  }
}

/**
 * Record cache metrics
 */
export function recordCacheMetrics(stats: CacheStats, cacheType: string): void {
  recordCustomMetric("Cache Hit Rate", stats.hitRate, "percent", {
    type: "cache",
    cacheType,
  });

  recordCustomMetric("Cache Size", stats.size, "bytes", {
    type: "cache",
    cacheType,
  });

  recordCustomMetric("Cache Entries", stats.entries, "number", {
    type: "cache",
    cacheType,
  });

  recordCustomMetric("Cache Hits", stats.hits, "number", {
    type: "cache",
    cacheType,
  });

  recordCustomMetric("Cache Misses", stats.misses, "number", {
    type: "cache",
    cacheType,
  });
}
