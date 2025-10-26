"use client";

export function LogsPanel() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Audit Log</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        A full audit trail will appear here. Integrate with your logging provider or database stream to populate this
        timeline.
      </p>
      <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-muted-foreground">
        No log entries yet. Actions performed through the admin console can be instrumented to save into this feed.
      </div>
    </div>
  );
}
