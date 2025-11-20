/**
 * Canonical HTTP client exports.
 * Prefer these imports for any data fetching to keep headers, timeouts,
 * and error handling consistent across the app.
 */
export {
  apiFetch,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  apiFetcher,
  apiFetcherWithParams,
  useApiQuery,
  useApiQueryWithParams,
  useApiMutation,
  submitApprovalDecision,
  type ApiError,
} from "../apiClient";
