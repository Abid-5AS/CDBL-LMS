/**
 * Enhanced mutation hook with automatic cache invalidation and optimistic updates
 */

import { useCallback, useState } from "react";
import { mutate } from "swr";
import { toast } from "sonner";
import { apiPost, apiPut, apiDelete } from "./apiClient";
import type { ApiError } from "./apiClient";

export { ApiError };

type MutationMethod = "POST" | "PUT" | "DELETE" | "PATCH";

interface MutationOptions<TData, TVariables> {
  method?: MutationMethod;
  onSuccess?: (data: TData) => void | Promise<void>;
  onError?: (error: Error) => void;
  showToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
  /**
   * SWR cache keys to revalidate after successful mutation
   */
  revalidate?: string | string[];
  /**
   * Optimistic update function
   */
  optimisticData?: (variables: TVariables) => any;
  /**
   * SWR cache key for optimistic update
   */
  optimisticKey?: string;
}

interface MutationState {
  isLoading: boolean;
  error: Error | null;
}

/**
 * Enhanced mutation hook that handles:
 * - Loading states
 * - Error handling
 * - Success/error toasts
 * - Automatic SWR cache revalidation
 * - Optimistic updates
 */
export function useMutation<TData = unknown, TVariables = unknown>() {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const execute = useCallback(
    async (
      url: string,
      variables?: TVariables,
      options: MutationOptions<TData, TVariables> = {}
    ): Promise<TData | null> => {
      const {
        method = "POST",
        onSuccess,
        onError,
        showToast = false,
        successMessage,
        errorMessage,
        revalidate,
        optimisticData,
        optimisticKey,
      } = options;

      setState({ isLoading: true, error: null });

      // Apply optimistic update if provided
      if (optimisticData && optimisticKey && variables) {
        const optimisticValue = optimisticData(variables);
        mutate(optimisticKey, optimisticValue, false);
      }

      try {
        let result: TData;

        switch (method) {
          case "POST":
            result = await apiPost<TData>(url, variables);
            break;
          case "PUT":
            result = await apiPut<TData>(url, variables);
            break;
          case "DELETE":
            result = await apiDelete<TData>(url);
            break;
          case "PATCH":
            result = await apiPost<TData>(url, variables); // apiClient doesn't have PATCH, use POST
            break;
          default:
            throw new Error(`Unsupported method: ${method}`);
        }

        // Revalidate SWR cache
        if (revalidate) {
          const keys = Array.isArray(revalidate) ? revalidate : [revalidate];
          await Promise.all(keys.map((key) => mutate(key)));
        }

        // Show success toast
        if (showToast && successMessage) {
          toast.success(successMessage);
        }

        // Call success callback
        if (onSuccess) {
          await onSuccess(result);
        }

        setState({ isLoading: false, error: null });
        return result;
      } catch (err) {
        const error = err as Error;
        setState({ isLoading: false, error });

        // Revert optimistic update on error
        if (optimisticKey) {
          mutate(optimisticKey);
        }

        // Show error toast
        if (showToast) {
          toast.error(errorMessage || error.message || "An error occurred");
        }

        // Call error callback
        if (onError) {
          onError(error);
        }

        return null;
      }
    },
    []
  );

  return {
    execute,
    isLoading: state.isLoading,
    error: state.error,
  };
}

/**
 * Specialized hook for leave-related mutations
 * Automatically revalidates common cache keys
 */
export function useLeaveMutation<TData = unknown, TVariables = unknown>() {
  const mutation = useMutation<TData, TVariables>();

  const execute = useCallback(
    async (
      url: string,
      variables?: TVariables,
      options: Omit<MutationOptions<TData, TVariables>, "revalidate"> & {
        revalidate?: string | string[];
      } = {}
    ) => {
      // Default cache keys to revalidate for leave mutations
      const defaultRevalidate = [
        "/api/leaves?mine=1",
        "/api/balance/mine",
        "/api/approvals",
      ];

      const customRevalidate = options.revalidate
        ? Array.isArray(options.revalidate)
          ? options.revalidate
          : [options.revalidate]
        : [];

      const allRevalidate = [...new Set([...defaultRevalidate, ...customRevalidate])];

      return mutation.execute(url, variables, {
        ...options,
        revalidate: allRevalidate,
      });
    },
    [mutation]
  );

  return {
    execute,
    isLoading: mutation.isLoading,
    error: mutation.error,
  };
}
