/**
 * Cache Library
 *
 * Export all caching strategies and utilities
 */

// Cache strategies
export {
  LRUCache,
  TTLCache,
  writeThrough,
  writeBack,
  staleWhileRevalidate,
  cacheAside,
  refreshCache,
  recordCacheMetrics,
  type CacheEntry,
  type CacheStats,
} from "./strategies";

// Cache invalidation
export {
  CacheInvalidationManager,
  createTimeBasedInvalidation,
  createEventBasedInvalidation,
  createLRUInvalidation,
  markStale,
  softInvalidate,
  hardInvalidate,
  cascadeInvalidate,
  getInvalidationRecommendations,
  type InvalidationRule,
  type InvalidationEvent,
  type StaleEntry,
} from "./invalidation";
