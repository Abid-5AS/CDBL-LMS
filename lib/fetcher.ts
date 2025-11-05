import { FilterState } from "@/types/filters";

export async function fetcher([url, state]: [string, FilterState]) {
  const qs = new URLSearchParams({
    q: state.q,
    status: state.status,
    type: String(state.type),
    page: String(state.page),
    size: String(state.pageSize),
  });

  try {
    const res = await fetch(`${url}?${qs.toString()}`, {
      signal: AbortSignal.timeout(30000), // 30s timeout
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMessage = errorData?.message || errorData?.error || `Failed to fetch: ${res.statusText}`;
      const error = new Error(errorMessage);
      (error as any).status = res.status;
      (error as any).data = errorData;
      throw error;
    }

    const data = await res.json();
    
    // Validate response structure
    if (!data || typeof data !== "object") {
      throw new Error("Invalid response format from server");
    }
    
    return data;
  } catch (err: any) {
    // Re-throw with more context
    if (err.name === "AbortError" || err.name === "TimeoutError") {
      throw new Error("Request timeout. Please try again.");
    }
    if (err instanceof TypeError && err.message.includes("fetch")) {
      throw new Error("Network error. Please check your connection.");
    }
    throw err;
  }
}

