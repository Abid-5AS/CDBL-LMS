import { Suspense } from "react";
import { Sidebar } from "@/components/sidebar";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { getCurrentUser } from "@/lib/auth";
import { User, Bell } from "lucide-react";

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
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-full w-full max-w-[1400px] items-center justify-between px-4 py-3">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumb items={breadcrumbs} />
          )}
          <h1 className="text-lg font-semibold text-slate-900 truncate">{title}</h1>
        </div>
        <div className="flex items-center gap-3 ml-4">
          <button
            type="button"
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200">
            <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div className="hidden sm:block text-left min-w-0">
              <div className="text-sm font-medium text-slate-900 truncate max-w-[120px]">
                {user?.name ?? "User"}
              </div>
              <div className="text-xs text-slate-500 truncate max-w-[120px]">
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
}: {
  title: string;
  pathname?: string;
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Suspense fallback={<SidebarFallback />}>
        <Sidebar pathname={pathname} />
      </Suspense>
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar title={title} breadcrumbs={breadcrumbs} />
        <main className="flex-1">
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
