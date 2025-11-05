"use client";

import { usePathname } from "next/navigation";
import TopNavBar from "@/components/layout/TopNavBar";
import FloatingDock from "@/components/layout/FloatingDock";
import { useUser } from "@/lib/user-context";
import { SelectionProvider } from "@/lib/selection-context";
import { inferPageContext } from "@/lib/page-context";
import { cn } from "@/lib/utils";

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

  // Determine page context from pathname
  const pageContext = inferPageContext(pathname);

  // macOS-style unified layout with TopNavBar and FloatingDock
  return (
    <SelectionProvider>
      <div className="flex min-h-screen flex-col bg-card" suppressHydrationWarning>
        <TopNavBar />
        <main 
          className={cn(
            "flex-1 overflow-y-auto pb-20",
            pathname.startsWith("/manager/dashboard") ? "pt-12" : "pt-14"
          )} 
          role="main" 
          aria-label="Main content"
        >
          <div className={cn(
            "mx-auto w-full",
            pathname.startsWith("/manager/dashboard") ? "px-0 py-6" : "px-6 py-6"
          )}>
            {children}
          </div>
        </main>
        <FloatingDock pageContext={pageContext} />
      </div>
    </SelectionProvider>
  );
}

