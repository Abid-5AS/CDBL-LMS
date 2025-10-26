import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { Sidebar } from "@/components/sidebar";

export function Topbar({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-20 h-14 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-full w-full max-w-[1400px] items-center px-4">
        <h1 className="text-base font-semibold text-slate-900">{title}</h1>
      </div>
    </header>
  );
}

export default async function AppShell({
  title,
  pathname = "/",
  children,
}: {
  title: string;
  pathname?: string;
  children: React.ReactNode;
}) {
  noStore();
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Suspense fallback={<SidebarFallback />}>
        <Sidebar pathname={pathname} />
      </Suspense>
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar title={title} />
        <main className="flex-1">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

function SidebarFallback() {
  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-slate-200 bg-white px-5 py-6">
      <div className="h-6 w-24 rounded bg-slate-200" />
      <div className="mt-6 space-y-2">
        <div className="h-9 rounded bg-slate-100" />
        <div className="h-9 rounded bg-slate-100" />
        <div className="h-9 rounded bg-slate-100" />
      </div>
      <div className="mt-auto h-4 w-32 rounded bg-slate-100" />
    </aside>
  );
}
