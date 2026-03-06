import { prisma } from '@/lib/prisma';

// Cache duration constants
export const CACHE_TTL = {
    DASHBOARD: 5 * 60 * 1000, // 5 minutes
    AGGREGATION: 60 * 60 * 1000, // 1 hour
    HISTORICAL: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Get cached data or execute fetcher function
 */
export async function getCachedAnalytics<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = CACHE_TTL.AGGREGATION
): Promise<T> {
    try {
        // Try to get from cache
        const cached = await prisma.analyticsCache.findUnique({
            where: { key },
        });

        // If cached and not expired, return it
        if (cached && cached.expiresAt > new Date()) {
            return cached.data as T;
        }

        // If expired or not found, fetch fresh data
        const data = await fetcher();

        // Update cache
        await prisma.analyticsCache.upsert({
            where: { key },
            update: {
                data: data as any,
                expiresAt: new Date(Date.now() + ttl),
            },
            create: {
                key,
                data: data as any,
                expiresAt: new Date(Date.now() + ttl),
            },
        });

        return data;
    } catch (error) {
        console.error(`Cache error for key ${key}:`, error);
        // Fallback to fetching fresh data if cache fails
        return fetcher();
    }
}

/**
 * Invalidate cache by key pattern
 * Note: Prisma doesn't support LIKE in deleteMany easily for all DBs,
 * so we might need exact keys or fetch-then-delete for patterns if needed.
 * For now, we support exact key or exact match.
 */
export async function invalidateAnalyticsCache(key: string) {
    try {
        await prisma.analyticsCache.delete({
            where: { key },
        });
    } catch (error) {
        // Ignore if not found
    }
}

/**
 * Invalidate all keys starting with a prefix
 * Useful for invalidating all "department:*" caches
 */
export async function invalidateAnalyticsCachePattern(prefix: string) {
    try {
        await prisma.analyticsCache.deleteMany({
            where: {
                key: {
                    startsWith: prefix,
                },
            },
        });
    } catch (error) {
        console.error(`Cache invalidation error for prefix ${prefix}:`, error);
    }
}
