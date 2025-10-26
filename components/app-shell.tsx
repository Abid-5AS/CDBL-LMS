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
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar pathname={pathname} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar title={title} />
        <main className="flex-1">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
