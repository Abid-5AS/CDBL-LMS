"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type SidebarContextValue = {
  collapsed: boolean;
  width: number;
  toggle: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  return ctx;
}

const SIDEBAR_WIDTH = 240;
const SIDEBAR_COLLAPSED = 64;

export function SidebarProvider({
  children,
  initialCollapsed = false,
}: {
  children: ReactNode;
  initialCollapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const width = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH;
  const toggle = useCallback(() => setCollapsed((c) => !c), []);
  return (
    <SidebarContext.Provider value={{ collapsed, width, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}
