// components/app-shell.tsx
export function Sidebar() {
  return (
    <aside className="w-56 shrink-0 h-screen sticky top-0 bg-slate-900 text-slate-100 p-4">
      <div className="font-semibold mb-4">CDBL • Leave</div>
      <nav className="space-y-2 text-sm">
        <a href="/dashboard" className="block">
          Dashboard
        </a>
        <a href="/leaves/apply" className="block">
          Apply Leave
        </a>
        <a href="/leaves/my" className="block">
          My Requests
        </a>
        <a href="/balance" className="block">
          Balance & Policy
        </a>
        <a href="/holidays" className="block">
          Holidays
        </a>
      </nav>
      <div className="mt-6 text-xs text-slate-400">v1.0.0</div>
    </aside>
  );
}

export function Topbar({ title }: { title: string }) {
  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center">
      <h1 className="text-base font-semibold">{title}</h1>
    </header>
  );
}

export default function AppShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <Topbar title={title} />
        <main className="p-4">{children}</main>
      </div>
    </div>
  );
}
