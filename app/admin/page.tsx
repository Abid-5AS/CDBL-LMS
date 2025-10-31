import { Suspense } from "react";
import { redirect } from "next/navigation";
import AppShell from "@/components/app-shell";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminDashboard from "./components/admin-dashboard";

export default function AdminConsolePage() {
  return (
    <AppShell title="Admin Console" pathname="/admin">
      <Suspense fallback={<AdminFallback />}>
        <AdminConsoleGate />
      </Suspense>
    </AppShell>
  );
}

async function AdminConsoleGate() {
  const user = await getCurrentUser();
  if (!user || (user.role as string) !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const policyClient = (prisma as any).policyConfig as { findMany: (args?: unknown) => Promise<Array<any>> };
  if (!policyClient) {
    throw new Error("Policy configuration model is missing. Run database migrations.");
  }

  const [users, policies, logs] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        empCode: true,
        role: true,
        department: true,
        createdAt: true,
      },
    }),
    policyClient.findMany({
      orderBy: { leaveType: "asc" },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const initialUsers = users.map((record) => ({
    ...record,
    createdAt: record.createdAt.toISOString(),
  }));

  const initialPolicies = policies.map((policy) => ({
    ...policy,
    createdAt: policy.createdAt.toISOString(),
    updatedAt: policy.updatedAt.toISOString(),
  }));

  const initialLogs = logs.map((log) => ({
    ...log,
    createdAt: log.createdAt.toISOString(),
  }));

  return <AdminDashboard initialUsers={initialUsers} initialPolicies={initialPolicies} initialLogs={initialLogs} />;
}

function AdminFallback() {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        <div className="mt-2 h-4 w-96 bg-slate-100 rounded animate-pulse" />
      </section>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl border border-slate-200 bg-white shadow-sm animate-pulse" />
        ))}
      </div>
    </div>
  );
}
