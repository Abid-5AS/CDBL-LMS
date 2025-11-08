import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  EmptyState,
} from "@/components/ui";
import { Activity } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export async function RecentAuditLogs() {
  const logs = await prisma.auditLog.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-text-tertiary" />
            <CardTitle>Recent Activity</CardTitle>
          </div>
          <CardDescription>
            System audit logs and activity history
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <EmptyState
            icon={Activity}
            title="No activity yet"
            description="Audit logs will appear here as system actions are performed."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-data-info" />
          <CardTitle>Recent Activity</CardTitle>
        </div>
        <CardDescription>Last {logs.length} system actions</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-sm font-medium">
                  {formatDate(log.createdAt.toISOString())}
                </TableCell>
                <TableCell className="text-sm">{log.actorEmail}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-data-info text-data-info">
                    {log.action}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {log.targetEmail || "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                  {log.details
                    ? JSON.stringify(log.details).substring(0, 50) + "..."
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
