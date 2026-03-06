import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Activity, Database, Clock } from "lucide-react";
import { AuditExportButton } from "./components/AuditExportButton";

export default function AuditViewerPage() {
  return (
    <Suspense fallback={<AuditSkeleton />}>
      <AuditContent />
    </Suspense>
  );
}

function AuditSkeleton() {
  return (
    <div className="space-y-6 pt-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-muted/50 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="h-96 bg-muted/50 rounded-xl animate-pulse" />
    </div>
  );
}

async function AuditContent() {
  const user = await getCurrentUser();
  // Restricted access: System Admin & CEO only
  const allowedRoles = ["CEO", "SYSTEM_ADMIN"];

  if (!user || (user.role && !allowedRoles.includes(user.role))) {
    redirect("/dashboard");
  }

  const recentLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const weekLogs = recentLogs.filter(
    (log) => new Date(log.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;

  return (
    <div className="space-y-8 p-6 lg:p-10 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Audit Log</h1>
        <p className="text-muted-foreground mt-2">
          Track sensitive actions, access patterns, and system modifications.
        </p>
      </div>

      {/* System Health Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Connection</CardTitle>
            <Database className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">Active</div>
            <p className="text-xs text-muted-foreground">PostgreSQL / Prisma</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logged Actions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentLogs.length}+</div>
            <p className="text-xs text-muted-foreground">Last 100 records fetched</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Volume</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weekLogs}</div>
            <p className="text-xs text-muted-foreground">Actions in last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Audit Table */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Recent Activity</CardTitle>
          <AuditExportButton />
        </CardHeader>
        <div className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead className="w-[200px]">Action</TableHead>
                <TableHead className="w-[250px]">Actor</TableHead>
                <TableHead>Target / Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No logs found.
                  </TableCell>
                </TableRow>
              ) : (
                recentLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{log.actorEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {log.targetEmail && log.targetEmail !== log.actorEmail
                          ? `Target: ${log.targetEmail}`
                          : "System Action"
                        }
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

