/**
 * API Optimization
 *
 * Utilities for optimizing API calls and data fetching
 */

import { recordCustomMetric, recordApiMetric } from "@/lib/performance/metrics";

/**
 * Request deduplication key
 */
export interface RequestDeduplicationKey {
  method: string;
  url: string;
  body?: string;
}

/**
 * Request deduplication cache
 */
export class RequestDeduplicator {
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private requestStats = {
    deduplicated: 0,
    actual: 0,
  };

  /**
   * Generate cache key from request details
   */
  private generateKey(endpoint: string, method: string, data?: any): string {
    const dataPart = data ? JSON.stringify(data) : "";
    return `${method}:${endpoint}:${dataPart}`;
  }

  /**
   * Execute request with deduplication
   */
  async execute<T>(
    endpoint: string,
    method: string,
    fetcher: () => Promise<T>,
    data?: any
  ): Promise<T> {
    const key = this.generateKey(endpoint, method, data);

    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      this.requestStats.deduplicated++;
      return this.pendingRequests.get(key)!;
    }

    // Create new request
    const promise = fetcher().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    this.requestStats.actual++;

    return promise;
  }

  /**
   * Get deduplication statistics
   */
  getStats() {
    return {
      ...this.requestStats,
      deduplicationRate:
        this.requestStats.actual > 0
          ? (this.requestStats.deduplicated / (this.requestStats.deduplicated + this.requestStats.actual)) * 100
          : 0,
    };
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.pendingRequests.clear();
  }
}

/**
 * Request batch handler
 */
export interface BatchRequest {
  id: string;
  endpoint: string;
  data?: any;
  method: string;
}

/**
 * Batch response
 */
export interface BatchResponse {
  id: string;
  result?: any;
  error?: string;
  status: number;
}

/**
 * Request batcher
 */
export class RequestBatcher {
  private queue: BatchRequest[] = [];
  private timeout: NodeJS.Timeout | null = null;
  private batchSize: number;
  private batchDelayMs: number;
  private batchEndpoint: string;
  private stats = {
    batches: 0,
    requests: 0,
  };

  constructor(
    batchEndpoint: string,
    batchSize: number = 10,
    batchDelayMs: number = 50
  ) {
    this.batchEndpoint = batchEndpoint;
    this.batchSize = batchSize;
    this.batchDelayMs = batchDelayMs;
  }

  /**
   * Add request to batch
   */
  async add<T>(
    id: string,
    endpoint: string,
    method: string = "GET",
    data?: any
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const request: BatchRequest = {
        id,
        endpoint,
        method,
        data,
      };

      this.queue.push(request);
      this.stats.requests++;

      // Execute batch if size reached
      if (this.queue.length >= this.batchSize) {
        this.flush().catch(reject);
        resolve(null as any);
      } else {
        // Schedule batch execution
        if (!this.timeout) {
          this.timeout = setTimeout(() => {
            this.flush().catch(reject);
          }, this.batchDelayMs);
        }
      }
    });
  }

  /**
   * Execute batch
   */
  private async flush(): Promise<void> {
    if (this.queue.length === 0) {
      return;
    }

    const batch = this.queue.splice(0, this.batchSize);

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    try {
      const response = await fetch(this.batchEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requests: batch }),
      });

      const results: BatchResponse[] = await response.json();

      this.stats.batches++;

      // Record metric
      recordCustomMetric("Batch API Requests", batch.length, "number", {
        type: "api-batch",
      });
    } catch (error) {
      console.error("Batch request failed:", error);
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      avgRequestsPerBatch: this.stats.batches > 0 ? this.stats.requests / this.stats.batches : 0,
    };
  }
}

/**
 * API memoization cache
 */
export class APIMemoizer {
  private cache: Map<string, { value: any; timestamp: number }> = new Map();
  private ttl: number;
  private stats = {
    hits: 0,
    misses: 0,
  };

  constructor(ttl: number = 300000) {
    // 5 minutes default
    this.ttl = ttl;
  }

  /**
   * Get memoized result
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check expiration
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.value as T;
  }

  /**
   * Set memoized result
   */
  set<T>(key: string, value: T): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  /**
   * Execute with memoization
   */
  async execute<T>(
    key: string,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached) return cached;

    const result = await fetcher();
    this.set(key, result);
    return result;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      hitRate: (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 || 0,
      cachedItems: this.cache.size,
    };
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }
}

/**
 * Connection pool for managing concurrent requests
 */
export class ConnectionPool {
  private activeConnections: number = 0;
  private maxConnections: number;
  private waitingQueue: Array<() => void> = [];

  constructor(maxConnections: number = 6) {
    // HTTP/2 typical limit
    this.maxConnections = maxConnections;
  }

  /**
   * Execute request with connection pooling
   */
  async execute<T>(request: () => Promise<T>): Promise<T> {
    // Wait if at capacity
    while (this.activeConnections >= this.maxConnections) {
      await new Promise((resolve) => {
        this.waitingQueue.push(resolve);
      });
    }

    this.activeConnections++;

    try {
      return await request();
    } finally {
      this.activeConnections--;
      const nextWaiting = this.waitingQueue.shift();
      if (nextWaiting) {
        nextWaiting();
      }
    }
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      activeConnections: this.activeConnections,
      maxConnections: this.maxConnections,
      utilization: (this.activeConnections / this.maxConnections) * 100,
      waiting: this.waitingQueue.length,
    };
  }
}

/**
 * Create optimized fetch function
 */
export function createOptimizedFetch(options: {
  deduplication?: boolean;
  memoization?: boolean;
  batching?: boolean;
  connectionPool?: boolean;
  batchEndpoint?: string;
} = {}) {
  const deduplicator = options.deduplication ? new RequestDeduplicator() : null;
  const memoizer = options.memoization ? new APIMemoizer() : null;
  const pool = options.connectionPool ? new ConnectionPool() : null;
  const batcher = options.batching && options.batchEndpoint ? new RequestBatcher(options.batchEndpoint) : null;

  return {
    /**
     * Fetch with optimizations
     */
    async fetch<T>(
      url: string,
      init?: RequestInit
    ): Promise<T> {
      const method = init?.method || "GET";
      const body = init?.body as string | undefined;

      // Try memoization first
      if (memoizer) {
        const memoKey = `${method}:${url}`;
        const cached = memoizer.get<T>(memoKey);
        if (cached) return cached;
      }

      // Execute request
      const execute = async () => {
        const fetcher = () => fetch(url, init).then((r) => r.json());

        if (deduplicator) {
          return deduplicator.execute(url, method, fetcher, body);
        }

        return fetcher();
      };

      let result: T;

      if (pool) {
        result = await pool.execute(execute);
      } else {
        result = await execute();
      }

      // Cache result
      if (memoizer) {
        const memoKey = `${method}:${url}`;
        memoizer.set(memoKey, result);
      }

      return result;
    },

    getStats() {
      return {
        deduplicator: deduplicator?.getStats(),
        memoizer: memoizer?.getStats(),
        pool: pool?.getStats(),
        batcher: batcher?.getStats(),
      };
    },

    clear() {
      deduplicator?.clear();
      memoizer?.clear();
    },
  };
}

/**
 * Get API optimization recommendations
 */
export function getAPIOptimizationRecommendations(): string[] {
  return [
    "Enable request deduplication to avoid duplicate API calls",
    "Use request memoization for frequently accessed data",
    "Implement request batching for multiple related requests",
    "Monitor connection pool utilization",
    "Cache API responses with appropriate TTLs",
    "Use GraphQL instead of REST for better efficiency",
    "Implement pagination for large result sets",
    "Use field selection to reduce response size",
    "Compress API responses with gzip",
    "Implement rate limiting and throttling",
  ];
}

/**
 * Generate API optimization report
 */
export function generateAPIOptimizationReport(stats: any): string {
  let report = `API Optimization Report\n`;
  report += `=======================\n\n`;

  if (stats.deduplicator) {
    report += `Request Deduplication:\n`;
    report += `  Deduplicated: ${stats.deduplicator.deduplicated}\n`;
    report += `  Actual Requests: ${stats.deduplicator.actual}\n`;
    report += `  Deduplication Rate: ${stats.deduplicator.deduplicationRate.toFixed(2)}%\n\n`;
  }

  if (stats.memoizer) {
    report += `Memoization:\n`;
    report += `  Cache Hits: ${stats.memoizer.hits}\n`;
    report += `  Cache Misses: ${stats.memoizer.misses}\n`;
    report += `  Hit Rate: ${stats.memoizer.hitRate.toFixed(2)}%\n`;
    report += `  Cached Items: ${stats.memoizer.cachedItems}\n\n`;
  }

  if (stats.pool) {
    report += `Connection Pool:\n`;
    report += `  Active Connections: ${stats.pool.activeConnections}/${stats.pool.maxConnections}\n`;
    report += `  Utilization: ${stats.pool.utilization.toFixed(2)}%\n`;
    report += `  Waiting Requests: ${stats.pool.waiting}\n\n`;
  }

  report += `Recommendations:\n`;
  getAPIOptimizationRecommendations().forEach((rec) => {
    report += `  - ${rec}\n`;
  });

  return report;
}
