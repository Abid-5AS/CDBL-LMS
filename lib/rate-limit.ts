import { cached, invalidateCache, redis } from "./cache";

/**
 * Rate limit requests
 * @param key Identifier for the client (IP or User ID)
 * @param limit Max requests
 * @param windowSeconds Time window in seconds
 * @returns Object indicating if allowed and remaining limit
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  // Mock implementation using cache wrapper - technically cache wrapper is for "get or set", not "increment".
  // Since our cached() function from lib/cache.ts is high level "get/set", we need direct access or standard generic mock.
  // However, lib/cache.ts implementation exposes `redis` variable inside the file but not exported.
  // So we can't implement Counter easily with `cached`.
  // We should create a separate implementation or modify lib/cache.ts to export redis client or support incr.
  // But given I "implemented" lib/cache.ts myself, I know it.
  
  if (redis.status !== 'ready') {
    // Fallback if Redis not ready: allow all (or implement memory fallback)
    return { success: true, limit, remaining: limit - 1, reset: Math.floor(Date.now() / 1000) + windowSeconds };
  }

  const now = Math.floor(Date.now() / 1000);
  const cacheKey = `ratelimit:${key}`;
  
  const multi = redis.multi();
  multi.incr(cacheKey);
  multi.expire(cacheKey, windowSeconds);
  
  const results = await multi.exec();
  const count = results ? (results[0][1] as number) : 1;
  
  return {
    success: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    reset: now + windowSeconds
  };
}
