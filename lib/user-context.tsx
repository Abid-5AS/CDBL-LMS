"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import useSWR from "swr";
import { usePathname } from "next/navigation";

type User = {
  id: number;
  name: string;
  email: string;
  role: string; // "EMPLOYEE" | "DEPT_HEAD" | "HR_ADMIN" | "HR_HEAD" | "CEO"
  empCode?: string | null;
  department?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

type UserContextType = {
  user: User | null;
  loading: boolean;
  status: "loading" | "ready";
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch");
  }
  const data = await res.json();
  return data.user as User | null;
};

const UserContext = createContext<UserContextType>({ user: null, loading: true, status: "loading" });

export function UserProvider({ user: initialUser, children }: { user: User | null; children: ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(initialUser);
  
  // Use SWR to fetch user if initialUser is null
  const { data: swrUser, error, mutate } = useSWR<User | null>(
    initialUser ? null : "/api/me",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  // Update user state when SWR data changes
  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
    } else if (swrUser !== undefined) {
      setUser(swrUser);
    } else if (error) {
      setUser(null);
    }
  }, [initialUser, swrUser, error]);

  // Force revalidation on route changes (refinement)
  useEffect(() => {
    if (!initialUser && typeof window !== "undefined") {
      mutate();
    }
  }, [pathname, initialUser, mutate]);

  const loading = !initialUser && swrUser === undefined && !error;
  const status = loading ? "loading" : "ready";

  return <UserContext.Provider value={{ user, loading, status }}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  return context.user;
}

export function useUserLoading() {
  const context = useContext(UserContext);
  return context.loading;
}

export function useUserStatus() {
  const context = useContext(UserContext);
  return context.status;
}

