"use client";

import { createContext, useContext, type ReactNode } from "react";
import useSWR, { type KeyedMutator } from "swr";
import { apiFetcher } from "@/lib/apiClient";

export type LeaveResponse = {
  items?: any[];
};

type LeaveDataContextValue = {
  data: LeaveResponse | undefined;
  isLoading: boolean;
  error: Error | undefined;
  mutate: KeyedMutator<LeaveResponse>;
};

const LeaveDataContext = createContext<LeaveDataContextValue | null>(null);

export function LeaveDataProvider({ children }: { children: ReactNode }) {
  const swrState = useSWR<LeaveResponse>("/api/leaves?mine=1", apiFetcher, {
    revalidateOnFocus: false,
  });

  return <LeaveDataContext.Provider value={swrState}>{children}</LeaveDataContext.Provider>;
}

export function useLeaveDataContext() {
  return useContext(LeaveDataContext);
}

export function useLeaveData() {
  const context = useLeaveDataContext();
  const fallback = useSWR<LeaveResponse>(
    context ? null : "/api/leaves?mine=1",
    apiFetcher,
    { revalidateOnFocus: false },
  );
  return context ?? fallback;
}
