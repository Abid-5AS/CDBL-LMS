import { Activity, ArrowUpRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { EmptyState } from "@/components/shared";

export async function RecentAuditLogs() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (logs.length === 0) {
    return (
      <div className="neo-card flex flex-col gap-4 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/20 p-3 shadow-inner">
            <Activity className="h-5 w-5 text-data-info" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
              Activity
            </p>
            <h3 className="text-xl font-semibold text-foreground">
              Recent Actions
            </h3>
          </div>
        </div>
        <EmptyState
          icon={Activity}
          title="Everything is quiet"
          description="System audit logs will appear as soon as users perform actions."
        />
      </div>
    );
  }

  return (
    <div className="neo-card space-y-5 px-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Activity
          </p>
          <h3 className="text-xl font-semibold text-foreground">
            Recent Actions
          </h3>
          <p className="text-sm text-muted-foreground">
            Last {logs.length} audit events
          </p>
        </div>
        <Link
          href="/admin/logs"
          className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          View all
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {logs.map((log) => (
          <div
            key={log.id}
            className="group rounded-2xl border border-white/10 bg-[color-mix(in_srgb,var(--color-card)90%,transparent)] px-4 py-4 transition hover:-translate-y-0.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">
                  {log.actorEmail}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(log.createdAt.toISOString())}
                </span>
              </div>
              <span className="inline-flex items-center rounded-full border border-data-info/40 bg-data-info/10 px-2.5 py-0.5 text-xs font-semibold text-data-info">
                {log.action}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Target
                </span>
                <span className="text-foreground">
                  {log.targetEmail || "—"}
                </span>
              </div>
              <div className="flex-1 min-w-[200px]">
                <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Details
                </span>
                <p className="text-sm text-muted-foreground">
                  {log.details
                    ? JSON.stringify(log.details).slice(0, 80) +
                      (JSON.stringify(log.details).length > 80 ? "…" : "")
                    : "No metadata"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
