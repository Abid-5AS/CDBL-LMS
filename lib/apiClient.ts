/**
 * Unified API Client for CDBL Leave Management System
 * Consolidates lib/api.ts and lib/fetcher.ts into a single, consistent client
 */

import { useState, useCallback } from "react";
import useSWR, { type SWRConfiguration } from "swr";
import { toast } from "sonner";

type FetchOptions = RequestInit & { 
  json?: unknown;
  timeout?: number;
};

type ApiError = Error & {
  status?: number;
  data?: unknown;
};

/**
 * Handles API response with consistent error formatting
 */
async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => ({}))
    : await response.text();

  if (!response.ok) {
    const errorMessage =
      typeof payload === "object" && payload && "error" in payload
        ? String((payload as Record<string, unknown>).error)
        : typeof payload === "object" && payload && "message" in payload
        ? String((payload as Record<string, unknown>).message)
        : response.statusText || "Request failed";
    
    const error: ApiError = new Error(errorMessage);
    error.status = response.status;
    error.data = payload;
    throw error;
  }

  return payload as T;
}

/**
 * Core fetch function with consistent error handling and timeout support
 */
export async function apiFetch<T>(
  input: RequestInfo | URL,
  init: FetchOptions = {}
): Promise<T> {
  const { json, headers, timeout = 30000, ...rest } = init;

  const controller = new AbortController();
  const timeoutId = timeout > 0 
    ? setTimeout(() => controller.abort(), timeout)
    : null;

  try {
    const response = await fetch(input, {
      credentials: "same-origin",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(headers ?? {}),
      },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
      ...rest,
    });

    if (timeoutId) clearTimeout(timeoutId);
    return handleResponse<T>(response);
  } catch (err: unknown) {
    if (timeoutId) clearTimeout(timeoutId);

    // Handle timeout errors
    if (err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError")) {
      const error: ApiError = new Error("Request timeout. Please try again.");
      error.status = 408;
      throw error;
    }

    // Handle network errors
    if (err instanceof TypeError && err.message.includes("fetch")) {
      const error: ApiError = new Error("Network error. Please check your connection.");
      error.status = 0;
      throw error;
    }

    // Re-throw API errors
    throw err;
  }
}

/**
 * GET request helper
 */
export async function apiGet<T>(url: string, options?: Omit<FetchOptions, "method" | "body" | "json">): Promise<T> {
  return apiFetch<T>(url, { ...options, method: "GET" });
}

/**
 * POST request helper
 */
export async function apiPost<T>(
  url: string,
  data?: unknown,
  options?: Omit<FetchOptions, "method" | "body" | "json">
): Promise<T> {
  return apiFetch<T>(url, { ...options, method: "POST", json: data });
}

/**
 * PUT request helper
 */
export async function apiPut<T>(
  url: string,
  data?: unknown,
  options?: Omit<FetchOptions, "method" | "body" | "json">
): Promise<T> {
  return apiFetch<T>(url, { ...options, method: "PUT", json: data });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T>(
  url: string,
  options?: Omit<FetchOptions, "method" | "body" | "json">
): Promise<T> {
  return apiFetch<T>(url, { ...options, method: "DELETE" });
}

/**
 * SWR-compatible fetcher function
 * Can be used directly with useSWR or via useApiQuery hook
 */
export function apiFetcher<T>(url: string): Promise<T> {
  return apiGet<T>(url);
}

/**
 * SWR-compatible fetcher with query params
 * Supports the FilterState pattern from lib/fetcher.ts
 */
export function apiFetcherWithParams<T>(
  [url, params]: [string, Record<string, string | number | null | undefined>]
): Promise<T> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      qs.append(key, String(value));
    }
  });

  const fullUrl = qs.toString() ? `${url}?${qs.toString()}` : url;
  return apiGet<T>(fullUrl);
}

/**
 * React hook for API queries using SWR
 */
export function useApiQuery<T>(
  url: string | null,
  options?: SWRConfiguration<T>
) {
  return useSWR<T>(url, apiFetcher, {
    revalidateOnFocus: false,
    ...options,
  });
}

/**
 * React hook for API queries with parameters
 */
export function useApiQueryWithParams<T>(
  url: string | null,
  params: Record<string, string | number | null | undefined>,
  options?: SWRConfiguration<T>
) {
  const key = url ? [url, params] : null;
  return useSWR<T>(key, apiFetcherWithParams, {
    revalidateOnFocus: false,
    ...options,
  });
}

/**
 * React hook for API mutations
 * Returns a mutation function that handles loading and error states
 */
export function useApiMutation<TData = unknown, TVariables = unknown>() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const mutate = useCallback(
    async (
      url: string,
      options: {
        method?: "POST" | "PUT" | "DELETE" | "PATCH";
        data?: TVariables;
        onSuccess?: (data: TData) => void;
        onError?: (error: ApiError) => void;
        showToast?: boolean;
      } = {}
    ) => {
      const { method = "POST", data, onSuccess, onError, showToast = true } = options;

      setIsLoading(true);
      setError(null);

      try {
        let result: TData;
        switch (method) {
          case "POST":
            result = await apiPost<TData>(url, data);
            break;
          case "PUT":
            result = await apiPut<TData>(url, data);
            break;
          case "DELETE":
            result = await apiDelete<TData>(url);
            break;
          case "PATCH":
            result = await apiFetch<TData>(url, { method: "PATCH", json: data });
            break;
          default:
            throw new Error(`Unsupported method: ${method}`);
        }

        if (showToast) {
          toast.success("Operation completed successfully");
        }
        onSuccess?.(result);
        return result;
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError);
        
        if (showToast) {
          toast.error(apiError.message || "An error occurred");
        }
        onError?.(apiError);
        throw apiError;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { mutate, isLoading, error };
}

// Legacy exports for backward compatibility during migration
export const fetchJson = apiFetch;
export async function submitApprovalDecision(
  id: string,
  action: "approve" | "reject",
  comment?: string
) {
  return apiPost<{ ok: boolean; status: string }>(`/api/approvals/${id}/decision`, {
    action,
    comment,
  });
}

