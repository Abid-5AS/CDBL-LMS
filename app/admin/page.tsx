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

  const [users, policies] = await Promise.all([
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

  return <AdminDashboard initialUsers={initialUsers} initialPolicies={initialPolicies} />;
}

function AdminFallback() {
  return <div className="h-48 w-full rounded-xl border border-slate-200 bg-white shadow-sm" />;
}
