import Redis from "ioredis";

const WINDOW = 5 * 60; // 5 minutes in seconds (for Redis)
const MAX_ATTEMPTS = 5;

// In-memory fallback for when Redis is not available
const attempts = new Map<string, { count: number; last: number }>();
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

// Initialize Redis client (will be null if Redis is not available)
let redisClient: Redis | null = null;

try {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    retryStrategy: () => null, // Don't retry if connection fails
  });
} catch (error) {
  console.warn("Redis not available, falling back to in-memory rate limiting");
}

/**
 * Check if an IP address is within rate limit
 * @param ip IP address to check
 * @returns true if within limit, false if rate limited
 */
export async function checkRateLimit(ip: string): Promise<boolean> {
  // Try Redis first
  if (redisClient) {
    try {
      const key = `rate:${ip}`;
      const attempts = await redisClient.incr(key);
      
      if (attempts === 1) {
        await redisClient.expire(key, WINDOW);
      }
      
      if (attempts > MAX_ATTEMPTS) return false;
      return true;
    } catch (error) {
      // If Redis fails, fall back to in-memory
      console.warn("Redis rate limit failed, using fallback:", error);
    }
  }
  
  // In-memory fallback
  const now = Date.now();
  const record = attempts.get(ip);

  // No previous attempts for this IP
  if (!record) {
    attempts.set(ip, { count: 1, last: now });
    return true;
  }

  // Window has expired, reset counter
  if (now - record.last > WINDOW_MS) {
    attempts.set(ip, { count: 1, last: now });
    return true;
  }

  // Increment counter
  record.count++;
  record.last = now;

  // Check if over limit
  if (record.count > MAX_ATTEMPTS) {
    return false;
  }

  return true;
}

/**
 * Clear rate limit for an IP address (useful for testing or manual resets)
 * @param ip IP address to clear
 */
export async function clearRateLimit(ip: string): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.del(`rate:${ip}`);
      return;
    } catch (error) {
      console.warn("Redis clear failed, using fallback:", error);
    }
  }
  
  attempts.delete(ip);
}

