"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
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

function ShellBackground() {
  return (
    <div className="absolute inset-0 bg-background" aria-hidden="true" />
  );
}

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
    "/faq",
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
            className="relative flex min-h-screen w-full flex-col overflow-hidden bg-background"
            suppressHydrationWarning
          >
            <ShellBackground />
            <Navbar />
            <main
              className={cn(
                "relative z-10 flex-1 bg-transparent",
                "pt-[88px] sm:pt-[96px] pb-4"
              )}
              role="main"
              aria-label="Main content"
            >
              <div className="page-shell">{children}</div>
            </main>
            <Footer />
            <SlideDrawer />
            <FloatingActionButton />
          </div>
        </LeaveDataProvider>
      </SelectionProvider>
    </SearchProvider>
  );
}
