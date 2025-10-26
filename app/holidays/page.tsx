import AppShell from "@/components/app-shell";

export default function HolidaysPage() {
  return (
    <AppShell title="Holidays" pathname="/holidays">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-sm text-slate-600">
        Holiday calendar coming soon.
      </div>
    </AppShell>
  );
}
