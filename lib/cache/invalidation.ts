/**
 * Cache Invalidation Strategies
 *
 * Strategies for invalidating and managing cache lifecycle
 */

import { recordCustomMetric } from "@/lib/performance/metrics";

/**
 * Invalidation rule
 */
export interface InvalidationRule {
  pattern: RegExp | string;
  trigger: "time" | "event" | "manual";
  ttl?: number;
  dependencies?: string[];
}

/**
 * Cache invalidation event
 */
export interface InvalidationEvent {
  key: string;
  timestamp: number;
  reason: string;
  cascade?: boolean;
}

/**
 * Cache invalidation tracker
 */
export class CacheInvalidationManager {
  private rules: Map<string, InvalidationRule> = new Map();
  private dependencies: Map<string, Set<string>> = new Map();
  private invalidationHistory: InvalidationEvent[] = [];
  private listeners: Set<(event: InvalidationEvent) => void> = new Set();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Add invalidation rule
   */
  addRule(key: string, rule: InvalidationRule): void {
    this.rules.set(key, rule);

    // Set up TTL-based invalidation
    if (rule.trigger === "time" && rule.ttl) {
      this.setTTLInvalidation(key, rule.ttl);
    }

    // Set up dependency tracking
    if (rule.dependencies && rule.dependencies.length > 0) {
      rule.dependencies.forEach((dep) => {
        if (!this.dependencies.has(dep)) {
          this.dependencies.set(dep, new Set());
        }
        this.dependencies.get(dep)!.add(key);
      });
    }
  }

  /**
   * Set TTL-based invalidation
   */
  private setTTLInvalidation(key: string, ttl: number): void {
    // Clear existing timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.invalidate(key, "TTL expired");
    }, ttl);

    this.timers.set(key, timer);
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string, reason: string = "Manual invalidation"): void {
    const event: InvalidationEvent = {
      key,
      timestamp: Date.now(),
      reason,
      cascade: true,
    };

    // Record history
    this.invalidationHistory.push(event);

    // Notify listeners
    this.notifyListeners(event);

    // Clear TTL timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
      this.timers.delete(key);
    }

    // Cascade invalidation to dependents
    const dependents = this.dependencies.get(key);
    if (dependents && event.cascade) {
      dependents.forEach((dependent) => {
        this.invalidate(dependent, `Cascaded from ${key}`);
      });
    }

    // Record metric
    recordCustomMetric("Cache Invalidation", 1, "number", {
      type: "cache-invalidation",
      key,
      reason,
    });
  }

  /**
   * Invalidate by pattern
   */
  invalidateByPattern(pattern: RegExp | string, reason: string = "Pattern match"): number {
    const regex = typeof pattern === "string" ? new RegExp(pattern) : pattern;
    let count = 0;

    for (const [key] of this.rules) {
      if (regex.test(key)) {
        this.invalidate(key, reason);
        count++;
      }
    }

    return count;
  }

  /**
   * Invalidate by dependency
   */
  invalidateDependents(parentKey: string, reason: string = "Parent invalidated"): number {
    const dependents = this.dependencies.get(parentKey) || new Set();
    dependents.forEach((key) => {
      this.invalidate(key, reason);
    });
    return dependents.size;
  }

  /**
   * Subscribe to invalidation events
   */
  subscribe(listener: (event: InvalidationEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify listeners
   */
  private notifyListeners(event: InvalidationEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error("Invalidation listener error:", error);
      }
    });
  }

  /**
   * Get invalidation history
   */
  getHistory(limit: number = 100): InvalidationEvent[] {
    return this.invalidationHistory.slice(-limit);
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.invalidationHistory = [];
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    rulesCount: number;
    totalInvalidations: number;
    recentInvalidations: number;
    dependencyCount: number;
  } {
    const recentThreshold = Date.now() - 60000; // Last minute
    const recentInvalidations = this.invalidationHistory.filter(
      (e) => e.timestamp > recentThreshold
    ).length;

    return {
      rulesCount: this.rules.size,
      totalInvalidations: this.invalidationHistory.length,
      recentInvalidations,
      dependencyCount: Array.from(this.dependencies.values()).reduce(
        (sum, set) => sum + set.size,
        0
      ),
    };
  }

  /**
   * Destroy manager and cleanup
   */
  destroy(): void {
    // Clear all timers
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();

    // Clear all data
    this.rules.clear();
    this.dependencies.clear();
    this.listeners.clear();
    this.invalidationHistory = [];
  }
}

/**
 * Time-based invalidation strategy
 */
export function createTimeBasedInvalidation(
  cache: Map<string, any>,
  ttl: number
): () => void {
  const interval = setInterval(() => {
    const now = Date.now();
    const keysToDelete: string[] = [];

    // In real implementation, cache entries would have timestamps
    // This is a placeholder
    if (Math.random() < 0.01) {
      // 1% chance to clear on check
      cache.clear();
    }
  }, ttl);

  return () => clearInterval(interval);
}

/**
 * Event-based invalidation strategy
 */
export function createEventBasedInvalidation(
  cache: Map<string, any>,
  events: string[]
): () => void {
  const listeners: Array<() => void> = [];

  const handleEvent = () => {
    cache.clear();
  };

  events.forEach((event) => {
    // In real implementation, would listen to actual events
    // This is a placeholder for the pattern
  });

  return () => {
    listeners.forEach((listener) => {
      // Remove listeners
    });
  };
}

/**
 * LRU-based invalidation (least recently used)
 */
export function createLRUInvalidation(
  cache: Map<string, any>,
  maxSize: number
): () => void {
  return () => {
    if (cache.size > maxSize) {
      // In real implementation, would track access times
      const keysToDelete = Array.from(cache.keys()).slice(0, Math.ceil(cache.size * 0.1));
      keysToDelete.forEach((key) => cache.delete(key));
    }
  };
}

/**
 * Stale invalidation strategy
 *
 * Marks cache as stale but keeps it for fallback
 */
export interface StaleEntry<T> {
  value: T;
  stale: boolean;
  timestamp: number;
}

export function markStale<T>(
  entry: StaleEntry<T>,
  revalidateAfter: number
): void {
  setTimeout(() => {
    entry.stale = true;
  }, revalidateAfter);
}

/**
 * Soft invalidation - mark as stale, don't delete
 */
export function softInvalidate<T>(
  cache: Map<string, StaleEntry<T>>,
  key: string
): void {
  const entry = cache.get(key);
  if (entry) {
    entry.stale = true;
  }
}

/**
 * Hard invalidation - completely remove
 */
export function hardInvalidate(cache: Map<string, any>, key: string): void {
  cache.delete(key);
}

/**
 * Cascade invalidation
 *
 * Invalidate a key and all dependent keys
 */
export function cascadeInvalidate(
  cache: Map<string, any>,
  key: string,
  dependencyMap: Map<string, Set<string>> = new Map()
): number {
  let invalidatedCount = 0;

  const queue = [key];
  const processed = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (processed.has(current)) {
      continue;
    }

    processed.add(current);
    cache.delete(current);
    invalidatedCount++;

    // Add dependent keys to queue
    const dependents = dependencyMap.get(current) || new Set();
    dependents.forEach((dep) => {
      if (!processed.has(dep)) {
        queue.push(dep);
      }
    });
  }

  return invalidatedCount;
}

/**
 * Get invalidation recommendations
 */
export function getInvalidationRecommendations(): string[] {
  return [
    "Use TTL-based invalidation for data that changes predictably",
    "Implement event-based invalidation for data that changes reactively",
    "Use cascade invalidation for dependent cache entries",
    "Monitor cache hit rates to optimize invalidation strategy",
    "Consider stale-while-revalidate for graceful degradation",
    "Use soft invalidation for critical data to allow fallback",
    "Implement invalidation metrics to track performance impact",
  ];
}
