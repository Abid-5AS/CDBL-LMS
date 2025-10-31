"use client";

import type { AuditLogRecord } from "./admin-dashboard";

type LogsPanelProps = {
  logs: AuditLogRecord[];
};

export function LogsPanel({ logs }: LogsPanelProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Audit Log</h2>
      <p className="text-sm text-muted-foreground">Recent administrative actions are captured for compliance.</p>
      <div className="max-h-[460px] overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        {logs.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">No activity recorded yet.</div>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {logs.map((log) => (
              <li key={log.id} className="flex flex-col gap-1 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900">{log.action.replace(/_/g, " ")}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Actor: {log.actorEmail}
                  {log.targetEmail ? ` • Target: ${log.targetEmail}` : null}
                </div>
                {log.details ? (
                  <pre className="whitespace-pre-wrap rounded bg-slate-50 p-2 text-xs text-slate-600">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
