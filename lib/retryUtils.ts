/**
 * Retry Utilities
 *
 * Provides utilities for retrying failed operations with exponential backoff,
 * jitter, and intelligent error detection.
 */

import {
  RETRY_CONFIG,
  calculateBackoffDelay,
  isRetryableError,
} from "@/constants/retry";

export interface RetryOptions {
  /** Maximum number of attempts (default: 3) */
  maxAttempts?: number;

  /** Initial delay in ms (default: 1000) */
  initialDelay?: number;

  /** Maximum delay in ms (default: 16000) */
  maxDelay?: number;

  /** Backoff strategy: "exponential" or "linear" (default: exponential) */
  strategy?: "exponential" | "linear";

  /** Callback when retry occurs */
  onRetry?: (attempt: number, error: unknown) => void;

  /** Custom predicate to determine if error is retryable */
  isRetryable?: (error: unknown) => boolean;
}

/**
 * Delay execution for specified milliseconds
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 *
 * @param fn - Function to retry
 * @param options - Retry configuration
 * @returns Result of function
 * @throws Last error if all retries exhausted
 *
 * @example
 * ```typescript
 * const data = await retryWithBackoff(
 *   () => fetch('/api/data'),
 *   { maxAttempts: 3 }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = RETRY_CONFIG.MAX_ATTEMPTS,
    initialDelay = RETRY_CONFIG.INITIAL_DELAY,
    maxDelay = RETRY_CONFIG.MAX_DELAY,
    strategy = "exponential",
    onRetry,
    isRetryable = isRetryableError,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      if (!isRetryable(error)) {
        throw error;
      }

      // If this was the last attempt, throw
      if (attempt === maxAttempts - 1) {
        throw error;
      }

      // Calculate delay
      let delayMs: number;
      if (strategy === "linear") {
        delayMs = initialDelay * (attempt + 1);
      } else {
        delayMs = calculateBackoffDelay(attempt, {
          INITIAL_DELAY: initialDelay,
          MAX_DELAY: maxDelay,
          BACKOFF_MULTIPLIER: 2,
          JITTER_FACTOR: 0.1,
        });
      }

      // Call retry callback
      onRetry?.(attempt + 1, error);

      // Wait before retrying
      await delay(delayMs);
    }
  }

  // Should never reach here, but throw lastError if we do
  throw lastError || new Error("Retry failed: Unknown error");
}

/**
 * Create a retry wrapper for a function
 * Useful for creating reusable retry-enabled versions of functions
 *
 * @param fn - Function to wrap
 * @param options - Retry configuration
 * @returns Wrapped function with retry capability
 *
 * @example
 * ```typescript
 * const fetchWithRetry = createRetryWrapper(
 *   (url: string) => fetch(url),
 *   { maxAttempts: 3 }
 * );
 *
 * const response = await fetchWithRetry('/api/data');
 * ```
 */
export function createRetryWrapper<Args extends unknown[], T>(
  fn: (...args: Args) => Promise<T>,
  options: RetryOptions = {}
) {
  return (...args: Args): Promise<T> => {
    return retryWithBackoff(() => fn(...args), options);
  };
}

/**
 * Retry a fetch request with intelligent defaults for network errors
 *
 * @param url - URL to fetch
 * @param options - Fetch options and retry configuration
 * @returns Fetch response
 * @throws Error if all retries exhausted
 *
 * @example
 * ```typescript
 * const response = await fetchWithRetry('/api/data', {
 *   method: 'GET',
 *   maxAttempts: 3,
 * });
 * ```
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit & RetryOptions = {}
): Promise<Response> {
  const { maxAttempts, initialDelay, maxDelay, strategy, onRetry, ...fetchOptions } = options;

  const response = await retryWithBackoff(
    () => fetch(url, fetchOptions),
    {
      maxAttempts,
      initialDelay,
      maxDelay,
      strategy,
      onRetry,
    }
  );

  // Throw if response is not ok (for retry on 5xx errors)
  if (!response.ok && response.status >= 500) {
    const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
    (error as Record<string, unknown>).status = response.status;
    throw error;
  }

  return response;
}

/**
 * Create a promise with timeout
 * Useful for adding timeout to requests that don't have built-in timeout
 *
 * @param promise - Promise to race
 * @param timeoutMs - Timeout in milliseconds
 * @returns Promise that rejects if timeout exceeded
 *
 * @example
 * ```typescript
 * const result = await withTimeout(
 *   fetch('/api/data'),
 *   5000 // 5 second timeout
 * );
 * ```
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Operation timed out after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}
