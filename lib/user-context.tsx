"use client";

import { createContext, useContext, type ReactNode } from "react";

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
};

const UserContext = createContext<UserContextType>({ user: null });

export function UserProvider({ user, children }: { user: User | null; children: ReactNode }) {
  return <UserContext.Provider value={{ user }}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  return context.user;
}

