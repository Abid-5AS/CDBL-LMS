/**
 * Error Messages and Types
 *
 * Centralized error messages and type definitions for consistent
 * error handling across the application.
 */

export enum ErrorType {
  /** Network/connectivity errors */
  NETWORK = "NETWORK_ERROR",

  /** Request timeout */
  TIMEOUT = "TIMEOUT_ERROR",

  /** Server error (5xx) */
  SERVER = "SERVER_ERROR",

  /** Client error (4xx) */
  CLIENT = "CLIENT_ERROR",

  /** Validation error */
  VALIDATION = "VALIDATION_ERROR",

  /** Authentication error */
  UNAUTHORIZED = "UNAUTHORIZED_ERROR",

  /** Permission error */
  FORBIDDEN = "FORBIDDEN_ERROR",

  /** Not found error */
  NOT_FOUND = "NOT_FOUND_ERROR",

  /** Rate limit error */
  RATE_LIMIT = "RATE_LIMIT_ERROR",

  /** Generic application error */
  UNKNOWN = "UNKNOWN_ERROR",
}

export enum ErrorSeverity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

/**
 * User-friendly error messages
 * Maps error types to messages shown to end users
 */
export const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.NETWORK]: "Network connection error. Please check your internet connection.",
  [ErrorType.TIMEOUT]: "Request timed out. Please try again.",
  [ErrorType.SERVER]: "Server error. Our team has been notified. Please try again later.",
  [ErrorType.CLIENT]: "Request error. Please check your input and try again.",
  [ErrorType.VALIDATION]: "Invalid input. Please correct the errors and try again.",
  [ErrorType.UNAUTHORIZED]: "You are not authenticated. Please log in again.",
  [ErrorType.FORBIDDEN]: "You do not have permission to perform this action.",
  [ErrorType.NOT_FOUND]: "The requested resource was not found.",
  [ErrorType.RATE_LIMIT]: "Too many requests. Please wait a moment and try again.",
  [ErrorType.UNKNOWN]: "An unexpected error occurred. Please try again.",
};

/**
 * Determine error type from HTTP status or error object
 * @param status - HTTP status code or error object
 * @returns Error type
 */
export function getErrorType(status: unknown): ErrorType {
  if (typeof status === "number") {
    if (status === 408 || status === 504) return ErrorType.TIMEOUT;
    if (status === 401) return ErrorType.UNAUTHORIZED;
    if (status === 403) return ErrorType.FORBIDDEN;
    if (status === 404) return ErrorType.NOT_FOUND;
    if (status === 429) return ErrorType.RATE_LIMIT;
    if (status >= 500) return ErrorType.SERVER;
    if (status >= 400) return ErrorType.CLIENT;
  }

  if (status instanceof Error) {
    if (status.message.includes("network")) return ErrorType.NETWORK;
    if (status.message.includes("timeout")) return ErrorType.TIMEOUT;
  }

  return ErrorType.UNKNOWN;
}

/**
 * Get error message for display to user
 * @param error - Error object or error type
 * @param defaultMessage - Default message if error type not found
 * @returns User-friendly error message
 */
export function getErrorMessage(
  error: unknown,
  defaultMessage?: string
): string {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    const errorType = getErrorType(error);
    return ERROR_MESSAGES[errorType] || defaultMessage || error.message;
  }

  if (typeof error === "object" && error !== null) {
    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }

    if ("status" in error && "statusText" in error) {
      return `${error.status} ${error.statusText}`;
    }
  }

  return defaultMessage || ERROR_MESSAGES[ErrorType.UNKNOWN];
}

/**
 * Get error severity
 * @param errorType - Error type
 * @returns Severity level
 */
export function getErrorSeverity(errorType: ErrorType): ErrorSeverity {
  switch (errorType) {
    case ErrorType.NETWORK:
    case ErrorType.SERVER:
    case ErrorType.TIMEOUT:
      return ErrorSeverity.ERROR;

    case ErrorType.RATE_LIMIT:
    case ErrorType.VALIDATION:
      return ErrorSeverity.WARNING;

    case ErrorType.UNAUTHORIZED:
    case ErrorType.FORBIDDEN:
      return ErrorSeverity.CRITICAL;

    default:
      return ErrorSeverity.ERROR;
  }
}

/**
 * Format error for logging
 * @param error - Error object
 * @param context - Additional context
 * @returns Formatted error string
 */
export function formatErrorForLogging(
  error: unknown,
  context?: Record<string, unknown>
): string {
  const timestamp = new Date().toISOString();
  const type = getErrorType(error);
  const message = getErrorMessage(error);
  const contextStr = context ? JSON.stringify(context) : "";

  return `[${timestamp}] ${type}: ${message}${contextStr ? ` | ${contextStr}` : ""}`;
}
