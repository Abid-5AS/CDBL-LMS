/**
 * Retry Configuration Constants
 *
 * Defines default retry behavior for failed requests using exponential backoff
 * with jitter to prevent thundering herd problems.
 */

export const RETRY_CONFIG = {
  /** Maximum number of retry attempts */
  MAX_ATTEMPTS: 3,

  /** Initial delay in milliseconds */
  INITIAL_DELAY: 1000,

  /** Maximum delay in milliseconds */
  MAX_DELAY: 16000,

  /** Multiplier for exponential backoff */
  BACKOFF_MULTIPLIER: 2,

  /** Jitter factor (0-1): adds randomness to prevent synchronized retries */
  JITTER_FACTOR: 0.1,
} as const;

/**
 * HTTP status codes that should trigger retry
 * (transient errors, not permanent client/server errors)
 */
export const RETRYABLE_STATUS_CODES = new Set([
  408, // Request Timeout
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
] as const);

/**
 * Error types that should trigger retry
 */
export const RETRYABLE_ERRORS = [
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "EHOSTUNREACH",
  "ENETUNREACH",
] as const;

/**
 * Calculate delay with exponential backoff and jitter
 * @param attempt - Attempt number (0-indexed)
 * @param config - Retry configuration
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(
  attempt: number,
  config = RETRY_CONFIG
): number {
  // Exponential backoff: initial_delay * (multiplier ^ attempt)
  const exponentialDelay = config.INITIAL_DELAY *
    Math.pow(config.BACKOFF_MULTIPLIER, attempt);

  // Cap at max delay
  const cappedDelay = Math.min(exponentialDelay, config.MAX_DELAY);

  // Add jitter: random value between ±jitter_factor * delay
  const jitterAmount = cappedDelay * config.JITTER_FACTOR;
  const jitter = (Math.random() - 0.5) * 2 * jitterAmount;

  return Math.max(0, Math.round(cappedDelay + jitter));
}

/**
 * Check if error is retryable
 * @param error - The error to check
 * @returns true if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof TypeError) {
    const message = error.message.toLowerCase();
    return RETRYABLE_ERRORS.some(errType =>
      message.includes(errType.toLowerCase())
    );
  }

  if (error instanceof Response) {
    return RETRYABLE_STATUS_CODES.has(error.status);
  }

  // Check if it's an object with status property
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = (error as { status: unknown }).status;
    return typeof status === "number" && RETRYABLE_STATUS_CODES.has(status);
  }

  return false;
}

/**
 * Check if error is a network error
 * @param error - The error to check
 * @returns true if error appears to be network-related
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return error.message.includes("fetch") ||
           error.message.includes("network") ||
           error.message.includes("Failed to fetch");
  }

  return false;
}
