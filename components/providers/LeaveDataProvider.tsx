"use client";

import { createContext, useContext, type ReactNode } from "react";
import useSWR, { type KeyedMutator } from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

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
  const swrState = useSWR<LeaveResponse>("/api/leaves?mine=1", fetcher, {
    revalidateOnFocus: false,
  });

  return <LeaveDataContext.Provider value={swrState}>{children}</LeaveDataContext.Provider>;
}

export function useLeaveDataContext() {
  return useContext(LeaveDataContext);
}
