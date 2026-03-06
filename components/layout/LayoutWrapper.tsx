"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useUser } from "@/components/providers/UserContext";
import { SelectionProvider } from "@/components/providers/SelectionContext";
import { cn } from "@/lib/utils";
import { SlideDrawer } from "@/components/unified";
import { LeaveDataProvider } from "@/components/providers";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { SearchProvider } from "@/hooks/useSearch";
import { AdminSidebar } from "./AdminSidebar";
import { SidebarProvider, useSidebar } from "./SidebarContext";
import { getNavItemsForRole } from "@/lib/ui/navigation";
import type { UserRole } from "@/lib/ui/navigation";

function AdminLayoutContent({
  children,
  showSidebar,
  navItems,
  userRole,
}: {
  children: React.ReactNode;
  showSidebar: boolean;
  navItems: ReturnType<typeof getNavItemsForRole>;
  userRole: UserRole;
}) {
  const sidebar = useSidebar();
  const marginLeft = sidebar ? sidebar.width : 240;
  return (
    <>
      {showSidebar && <AdminSidebar navItems={navItems} role={userRole} />}
      <main
        className={cn(
          "relative z-10 flex-1 bg-transparent pt-[88px] sm:pt-[96px] pb-4",
          showSidebar && "md:ml-[var(--admin-sidebar-width)]"
        )}
        style={
          showSidebar
            ? { ["--admin-sidebar-width" as string]: `${marginLeft}px` }
            : undefined
        }
        role="main"
        aria-label="Main content"
      >
        <div className="page-shell">{children}</div>
      </main>
    </>
  );
}

type LayoutWrapperProps = {
  children: React.ReactNode;
};

function ShellBackground() {
  return (
    <div className="absolute inset-0 bg-background" aria-hidden="true" />
  );
}

const SIDEBAR_ROLES: UserRole[] = ["HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN"];

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
    "/encashment",
    "/webhooks",
    "/faq",
  ].some((p) => pathname.startsWith(p));

  // If no user or doesn't need unified layout
  if (!user || !needsUnifiedLayout) {
    return <>{children}</>;
  }

  const useSidebar = SIDEBAR_ROLES.includes(user.role as UserRole);
  const navItems = getNavItemsForRole(user.role as UserRole);
  const userRole = user.role as UserRole;

  // Modern layout: sidebar for admin roles, top navbar for others
  return (
    <SearchProvider>
      <SelectionProvider>
        <LeaveDataProvider>
          <div
            className="relative flex min-h-screen w-full flex-col overflow-hidden bg-background"
            suppressHydrationWarning
          >
            <ShellBackground />
            <Navbar hideNavLinks={useSidebar} />
            {useSidebar ? (
              <SidebarProvider>
                <AdminLayoutContent
                  showSidebar={true}
                  navItems={navItems}
                  userRole={userRole}
                >
                  {children}
                </AdminLayoutContent>
              </SidebarProvider>
            ) : (
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
            )}
            <Footer />
            <SlideDrawer />
            <FloatingActionButton />
          </div>
        </LeaveDataProvider>
      </SelectionProvider>
    </SearchProvider>
  );
}
