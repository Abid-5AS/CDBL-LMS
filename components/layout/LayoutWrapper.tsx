"use client";

import { usePathname } from "next/navigation";
import TopNavBar from "@/components/layout/TopNavBar";
import FloatingDock from "@/components/layout/FloatingDock";
import { useUser } from "@/lib/user-context";

type LayoutWrapperProps = {
  children: React.ReactNode;
};

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const user = useUser();

  // Pages that need unified layout
  const needsUnifiedLayout = ["/dashboard", "/leaves", "/holidays", "/policies", "/approvals", "/employees", "/reports", "/settings", "/manager", "/hr-head", "/ceo", "/admin", "/balance"].some((p) =>
    pathname.startsWith(p)
  );

  // If no user or doesn't need unified layout
  if (!user || !needsUnifiedLayout) {
    return <>{children}</>;
  }

  // macOS-style unified layout with TopNavBar and FloatingDock
  return (
    <div className="flex min-h-screen flex-col bg-gray-50" suppressHydrationWarning>
      <TopNavBar />
      <main className="flex-1 overflow-y-auto pt-14 pb-20" role="main" aria-label="Main content">
        <div className="mx-auto w-full max-w-7xl px-6 py-6">{children}</div>
      </main>
      <FloatingDock />
    </div>
  );
}

