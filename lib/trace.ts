/**
 * Trace ID and Timestamp Middleware Utilities
 * 
 * Provides utilities for attaching trace IDs and timestamps to API requests/responses.
 * Used by middleware or route handlers to ensure consistent error tracking.
 */

import { generateTraceId } from "./errors";

/**
 * Request context with trace ID
 * Extend NextRequest type if needed
 */
export type RequestWithTrace = {
  traceId?: string;
  [key: string]: unknown;
};

/**
 * Attach trace ID to request
 * Call this in middleware or route handler
 */
export function attachTraceId<T extends RequestWithTrace>(req: T): string {
  const traceId = generateTraceId();
  req.traceId = traceId;
  return traceId;
}

/**
 * Get trace ID from request (or generate if missing)
 */
export function getTraceId<T extends RequestWithTrace>(req: T): string {
  if (req.traceId && typeof req.traceId === "string") {
    return req.traceId;
  }
  return attachTraceId(req);
}

