"use client";

import { usePathname } from "next/navigation";
import { TopNavBar } from "@/components/unified/TopNavBar";
import { QuickActionFAB } from "@/components/unified/QuickActionFAB";
import { SlideDrawer } from "@/components/unified/SlideDrawer";
import { useUser } from "@/lib/user-context";

type LayoutWrapperProps = {
  children: React.ReactNode;
};

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const user = useUser();

  // Pages that need unified layout
  const needsUnifiedLayout = ["/dashboard", "/leaves", "/holidays", "/policies", "/approvals", "/employees", "/reports", "/settings"].some((p) =>
    pathname.startsWith(p)
  );

  // Super Admin or legacy pages
  if (!user || user.role === "SUPER_ADMIN" || !needsUnifiedLayout) {
    return <>{children}</>;
  }

  // Unified layout for Employee and HR Admin
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopNavBar />
      <main className="flex-1 overflow-y-auto" role="main" aria-label="Main content">
        <div className="mx-auto w-full max-w-7xl px-6 py-6">{children}</div>
      </main>
      <QuickActionFAB />
      <SlideDrawer />
    </div>
  );
}

