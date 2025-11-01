import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default function AuditViewerPage() {
  return (
    <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-64 bg-slate-100 rounded-xl" /></div>}>
      <AuditContent />
    </Suspense>
  );
}

async function AuditContent() {
  const user = await getCurrentUser();
  const allowedRoles = ["HR_ADMIN", "HR_HEAD", "CEO"];
  
  if (!user || !allowedRoles.includes(user.role as string)) {
    redirect("/dashboard");
  }

  const recentLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium mb-4">Recent Activity</h2>
        <div className="space-y-2">
          {recentLogs.length === 0 ? (
            <p className="text-sm text-gray-500">No audit logs found.</p>
          ) : (
            recentLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between border-b pb-2">
                <div>
                  <span className="font-medium text-gray-900">{log.action}</span> by{" "}
                  <span className="text-gray-600">{log.actorEmail}</span>
                  {log.targetEmail && log.targetEmail !== log.actorEmail && (
                    <span className="text-gray-500 text-sm"> (target: {log.targetEmail})</span>
                  )}
                </div>
                <time className="text-sm text-gray-500">
                  {new Date(log.createdAt).toLocaleString()}
                </time>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium mb-4">System Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm text-green-600 font-medium">Database</div>
            <div className="text-2xl font-bold text-green-700 mt-1">Connected</div>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Total Actions</div>
            <div className="text-2xl font-bold text-blue-700 mt-1">{recentLogs.length}</div>
          </div>
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="text-sm text-purple-600 font-medium">This Week</div>
            <div className="text-2xl font-bold text-purple-700 mt-1">
              {recentLogs.filter(
                (log) => new Date(log.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              ).length}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

