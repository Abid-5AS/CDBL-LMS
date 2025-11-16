/**
 * Idempotency utilities for preventing duplicate requests
 */

/**
 * Generates a unique idempotency key based on timestamp and random string
 */
export function generateIdempotencyKey(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}`;
}

/**
 * Stores idempotency keys with expiration
 */
class IdempotencyStore {
  private store = new Map<string, { timestamp: number; data: any }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if a key exists and is still valid
   */
  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() - entry.timestamp > this.TTL) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get data associated with a key
   */
  get(key: string): any {
    const entry = this.store.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > this.TTL) {
      this.store.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Store data with a key
   */
  set(key: string, data: any): void {
    this.store.set(key, { timestamp: Date.now(), data });

    // Clean up old entries periodically
    this.cleanup();
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.timestamp > this.TTL) {
        this.store.delete(key);
      }
    }
  }
}

// Global store instance
export const idempotencyStore = new IdempotencyStore();

/**
 * Client-side hook for managing request idempotency
 */
export function useIdempotentRequest() {
  const pendingRequests = new Set<string>();

  return {
    /**
     * Execute a request with idempotency protection
     */
    async execute<T>(
      key: string,
      requestFn: () => Promise<T>
    ): Promise<T> {
      // Check if request is already in progress
      if (pendingRequests.has(key)) {
        throw new Error("Request already in progress");
      }

      pendingRequests.add(key);
      try {
        return await requestFn();
      } finally {
        pendingRequests.delete(key);
      }
    },

    /**
     * Check if a request is in progress
     */
    isPending(key: string): boolean {
      return pendingRequests.has(key);
    },
  };
}
