"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { DEFAULT_FILTER, FilterState } from "@/types/filters";

export const readFilters = (sp: URLSearchParams): FilterState => ({
  q: sp.get("q") ?? DEFAULT_FILTER.q,
  status: (sp.get("status") ?? DEFAULT_FILTER.status) as FilterState["status"],
  type: (sp.get("type") ?? "ALL") as FilterState["type"],
  page: Number(sp.get("page") ?? 1),
  pageSize: Number(sp.get("size") ?? 10),
});

export const writeFilters = (s: FilterState): string => {
  const u = new URLSearchParams();
  if (s.q) u.set("q", s.q);
  u.set("status", s.status);
  u.set("type", s.type as string);
  u.set("page", String(s.page));
  u.set("size", String(s.pageSize));
  return `?${u.toString()}`;
};

export function useFilterFromUrl() {
  const router = useRouter();
  const params = useSearchParams();

  const state = useMemo(() => readFilters(params), [params]);

  const set = useCallback(
    (next: Partial<FilterState>) => {
      const merged: FilterState = {
        ...state,
        ...next,
        // Reset page to 1 if status, type, or search query changes
        page:
          next.status !== undefined ||
          next.type !== undefined ||
          next.q !== undefined
            ? 1
            : next.page ?? state.page,
      };
      router.replace(writeFilters(merged), { scroll: false });
    },
    [state, router]
  );

  return { state, set };
}

