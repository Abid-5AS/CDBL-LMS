import { Suspense } from "react";
import { Sidebar } from "@/components/sidebar";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { getCurrentUser } from "@/lib/auth";
import { User, Bell } from "lucide-react";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

async function TopbarContent({ 
  title, 
  breadcrumbs 
}: { 
  title: string; 
  breadcrumbs?: BreadcrumbItem[];
}) {
  const user = await getCurrentUser();
  
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-sm" role="banner">
      <div className="mx-auto flex h-full w-full max-w-[1400px] items-center justify-between px-4 py-3">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumb items={breadcrumbs} />
          )}
          <h1 className="text-lg font-semibold text-slate-900 truncate">{title}</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 ml-2 sm:ml-4">
          <NotificationDropdown />
          <div 
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200"
            role="region"
            aria-label="User profile"
          >
            <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center" aria-hidden="true">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div className="hidden sm:block text-left min-w-0">
              <div className="text-sm font-medium text-slate-900 truncate max-w-[120px]" aria-label="User name">
                {user?.name ?? "User"}
              </div>
              <div className="text-xs text-slate-500 truncate max-w-[120px]" aria-label="User email">
                {user?.email ?? ""}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export function Topbar({ 
  title, 
  breadcrumbs 
}: { 
  title: string; 
  breadcrumbs?: BreadcrumbItem[];
}) {
  return (
    <Suspense fallback={
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-full w-full max-w-[1400px] items-center justify-between px-4 py-3">
          <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
          <div className="h-8 w-24 bg-slate-200 rounded animate-pulse" />
        </div>
      </header>
    }>
      <TopbarContent title={title} breadcrumbs={breadcrumbs} />
    </Suspense>
  );
}

export default async function AppShell({
  title,
  pathname = "/",
  children,
  breadcrumbs,
  role,
  user,
}: {
  title: string;
  pathname?: string;
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  role?: "EMPLOYEE" | "HR_ADMIN" | "SUPER_ADMIN";
  user?: { name: string; email: string };
}) {
  // If unified layout props provided, render without sidebar
  if (role && user && (role === "EMPLOYEE" || role === "HR_ADMIN")) {
    // Unified layout will be rendered by the page component
    return <>{children}</>;
  }

  // Super Admin or legacy layout: use sidebar
  return (
    <div className="fixed inset-0 flex bg-slate-50">
      <Suspense fallback={<SidebarFallback />}>
        <Sidebar pathname={pathname} />
      </Suspense>
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Topbar title={title} breadcrumbs={breadcrumbs} />
        <main className="flex-1 overflow-y-auto" role="main" aria-label="Main content">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

function SidebarFallback() {
  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-slate-200 bg-white shadow-sm">
      <div className="h-16 border-b border-slate-200 px-5 py-4">
        <div className="h-8 w-32 rounded bg-slate-200 animate-pulse" />
      </div>
      <div className="flex-1 px-3 py-4 space-y-2">
        <div className="h-10 rounded-lg bg-slate-100 animate-pulse" />
        <div className="h-10 rounded-lg bg-slate-100 animate-pulse" />
        <div className="h-10 rounded-lg bg-slate-100 animate-pulse" />
      </div>
      <div className="border-t border-slate-200 px-3 py-4 bg-slate-50/50">
        <div className="h-12 rounded bg-slate-100 animate-pulse" />
      </div>
    </aside>
  );
}
