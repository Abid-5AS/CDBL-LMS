"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { useUser } from "@/lib/user-context";
import { SelectionProvider } from "@/lib/selection-context";
import { cn } from "@/lib/utils";
import { SlideDrawer } from "@/components/unified";
import { LeaveDataProvider } from "@/components/providers";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { SearchProvider } from "@/hooks/use-search";

type LayoutWrapperProps = {
  children: React.ReactNode;
};

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const user = useUser();

  // Pages that need unified layout
  const needsUnifiedLayout = [
    "/dashboard",
    "/leaves",
    "/holidays",
    "/policies",
    "/approvals",
    "/employees",
    "/reports",
    "/settings",
    "/manager",
    "/hr-head",
    "/ceo",
    "/admin",
    "/balance",
  ].some((p) => pathname.startsWith(p));

  // If no user or doesn't need unified layout
  if (!user || !needsUnifiedLayout) {
    return <>{children}</>;
  }

  // Modern layout with top navbar (no bottom dock)
  return (
    <SearchProvider>
      <SelectionProvider>
        <LeaveDataProvider>
          <div
            className="flex min-h-screen flex-col bg-background"
            suppressHydrationWarning
          >
            <Navbar />
            <main
              className={cn(
                "flex-1 overflow-y-auto",
                "pt-[72px]" // Offset for fixed navbar (initial height, animates to 60px on scroll)
              )}
              role="main"
              aria-label="Main content"
            >
              <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {children}
              </div>
            </main>
            <SlideDrawer />
            <FloatingActionButton />
          </div>
        </LeaveDataProvider>
      </SelectionProvider>
    </SearchProvider>
  );
}
