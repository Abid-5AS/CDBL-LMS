import Redis from 'ioredis';

// Initialize Redis client with fallback for development
let redis: Redis | null = null;

try {
  if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redis.on('error', (err) => {
      console.error('Redis connection error:', err);
      redis = null; // Fall back to in-memory cache
    });
  }
} catch (error) {
  console.warn('Redis initialization failed, using in-memory cache:', error);
  redis = null;
}

// In-memory cache fallback for development
const memoryCache = new Map<string, { data: string; expiresAt: number }>();

// Clean up expired entries every minute
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of memoryCache.entries()) {
      if (value.expiresAt < now) {
        memoryCache.delete(key);
      }
    }
  }, 60000);
}

/**
 * Cache a value with TTL (time to live in seconds)
 * Falls back to in-memory cache if Redis is unavailable
 */
export async function cached<T>(
  key: string,
  ttl: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  try {
    // Try Redis first
    if (redis) {
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }

      const data = await fetchFn();
      await redis.setex(key, ttl, JSON.stringify(data));
      return data;
    }

    // Fall back to memory cache
    const cached = memoryCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return JSON.parse(cached.data);
    }

    const data = await fetchFn();
    memoryCache.set(key, {
      data: JSON.stringify(data),
      expiresAt: Date.now() + ttl * 1000,
    });
    return data;
  } catch (error) {
    console.error('Cache error, fetching fresh data:', error);
    // If cache fails, just fetch fresh data
    return fetchFn();
  }
}

/**
 * Invalidate cache entries matching a pattern
 * Pattern examples: 'leaves:*', 'approvals:user:123:*'
 */
export async function invalidateCache(pattern: string): Promise<void> {
  try {
    if (redis) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } else {
      // Memory cache: delete matching keys
      for (const key of memoryCache.keys()) {
        if (matchPattern(key, pattern)) {
          memoryCache.delete(key);
        }
      }
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

/**
 * Get a cached value without fetching if missing
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    if (redis) {
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    }

    const cached = memoryCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return JSON.parse(cached.data);
    }
    return null;
  } catch (error) {
    console.error('Get cache error:', error);
    return null;
  }
}

/**
 * Set a value in cache with TTL
 */
export async function setCached<T>(
  key: string,
  value: T,
  ttl: number
): Promise<void> {
  try {
    if (redis) {
      await redis.setex(key, ttl, JSON.stringify(value));
    } else {
      memoryCache.set(key, {
        data: JSON.stringify(value),
        expiresAt: Date.now() + ttl * 1000,
      });
    }
  } catch (error) {
    console.error('Set cache error:', error);
  }
}

/**
 * Delete a specific cache key
 */
export async function deleteCache(key: string): Promise<void> {
  try {
    if (redis) {
      await redis.del(key);
    } else {
      memoryCache.delete(key);
    }
  } catch (error) {
    console.error('Delete cache error:', error);
  }
}

/**
 * Simple pattern matching for memory cache
 * Supports wildcards: 'prefix:*', '*:suffix', 'prefix:*:suffix'
 */
function matchPattern(key: string, pattern: string): boolean {
  if (pattern === '*') return true;
  if (!pattern.includes('*')) return key === pattern;

  const regexPattern = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
    .replace(/\*/g, '.*'); // Replace * with .*

  return new RegExp(`^${regexPattern}$`).test(key);
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return redis !== null && redis.status === 'ready';
}

/**
 * Clear all cache (use with caution!)
 */
export async function clearAllCache(): Promise<void> {
  try {
    if (redis) {
      await redis.flushdb();
    } else {
      memoryCache.clear();
    }
  } catch (error) {
    console.error('Clear cache error:', error);
  }
}

export { redis };
