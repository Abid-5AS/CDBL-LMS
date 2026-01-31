import Redis from 'ioredis';

// Create a Redis client instance
export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  // Don't crash on connection failure, just log
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  lazyConnect: true, // Only connect when needed
});

redis.on('error', (err) => {
  console.warn('Redis connection error (caching disabled):', err.message);
});

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  // If Redis is not connected or error, bypass cache
  if (redis.status !== 'ready' && redis.status !== 'connect' && redis.status !== 'connecting') {
    return fetchFn();
  }

  try {
    // Try cache first
    const cachedData = await redis.get(key);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
  } catch (err) {
    console.warn(`Cache read error for key ${key}:`, err);
  }

  // Fetch fresh data
  const data = await fetchFn();

  try {
    // Store in cache
    if (redis.status === 'ready') {
      await redis.setex(key, ttlSeconds, JSON.stringify(data));
    }
  } catch (err) {
    console.warn(`Cache write error for key ${key}:`, err);
  }

  return data;
}

export async function invalidateCache(pattern: string) {
  if (redis.status !== 'ready') return;
  
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.warn(`Cache invalidation error for pattern ${pattern}:`, err);
  }
}
