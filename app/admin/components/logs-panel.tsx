"use client";

import { useMemo, useState } from "react";
import type { AuditLogRecord } from "./admin-dashboard";
import { SearchInput } from "@/components/filters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type LogsPanelProps = {
  logs: AuditLogRecord[];
};

export function LogsPanel({ logs }: LogsPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  // Get unique actions
  const uniqueActions = useMemo(() => {
    const actions = new Set<string>();
    logs.forEach((log) => actions.add(log.action));
    return Array.from(actions).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    let filtered = logs;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.action.toLowerCase().includes(query) ||
          log.actorEmail.toLowerCase().includes(query) ||
          (log.targetEmail?.toLowerCase().includes(query) ?? false) ||
          JSON.stringify(log.details).toLowerCase().includes(query)
      );
    }

    // Action filter
    if (actionFilter !== "all") {
      filtered = filtered.filter((log) => log.action === actionFilter);
    }

    return filtered;
  }, [logs, searchQuery, actionFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setActionFilter("all");
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-text-secondary">Audit Log</h2>
        <p className="text-sm text-muted-foreground">
          Recent administrative actions are captured for compliance.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1 min-w-0">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by action, actor, or target..."
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {uniqueActions.map((action) => (
              <SelectItem key={action} value={action}>
                {action.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(searchQuery || actionFilter !== "all") && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {filteredLogs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {logs.length === 0
              ? "No activity recorded yet."
              : "No logs match your filters."}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="max-h-[460px] overflow-auto">
              <ul className="divide-y divide-slate-100 text-sm">
                {filteredLogs.map((log) => (
                  <li
                    key={log.id}
                    className="flex flex-col gap-1 px-4 py-3 hover:bg-bg-secondary transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-text-secondary">
                        {log.action.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Actor: {log.actorEmail}
                      {log.targetEmail ? ` • Target: ${log.targetEmail}` : null}
                    </div>
                    {log.details ? (
                      <pre className="whitespace-pre-wrap rounded bg-bg-secondary p-2 text-xs text-text-secondary mt-1">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredLogs.length !== logs.length && logs.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {filteredLogs.length} of {logs.length} log entries
        </p>
      )}
    </div>
  );
}
