"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertTriangle, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface ConfigStatus {
  departments: {
    count: number;
    status: "ok" | "warning";
    message: string;
  };
  holidays: {
    count: number;
    status: "ok" | "warning";
    message: string;
  };
  policies: {
    count: number;
    status: "ok" | "warning";
    message: string;
  };
  users: {
    count: number;
    status: "ok" | "warning";
    message: string;
  };
}

export function ConfigurationChecklist() {
  const [config, setConfig] = useState<ConfigStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const response = await fetch("/api/admin/config-status");
        if (response.ok) {
          const data = await response.json();
          setConfig(data);
        }
      } catch (error) {
        console.error("Failed to fetch configuration status:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchConfig();
  }, []);

  if (isLoading) {
    return (
      <Card className="surface-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const items = config
    ? [
        {
          label: "Departments",
          count: config.departments.count,
          status: config.departments.status,
          message: config.departments.message,
          href: "/admin/departments",
        },
        {
          label: "Holidays",
          count: config.holidays.count,
          status: config.holidays.status,
          message: config.holidays.message,
          href: "/holidays",
        },
        {
          label: "Leave Policies",
          count: config.policies.count,
          status: config.policies.status,
          message: config.policies.message,
          href: "/admin/policies",
        },
        {
          label: "Users & Roles",
          count: config.users.count,
          status: config.users.status,
          message: config.users.message,
          href: "/admin",
        },
      ]
    : [];

  return (
    <Card className="surface-card">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Configuration Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center justify-between p-3 rounded-lg border border-border/60 hover:bg-muted/30 transition-colors group"
          >
            <div className="flex items-center gap-3">
              {item.status === "ok" ? (
                <CheckCircle className="h-5 w-5 text-data-success shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-data-warning shrink-0" />
              )}
              <div>
                <p className="font-medium text-sm group-hover:text-data-info transition-colors">
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground">{item.message}</p>
              </div>
            </div>
            <Badge variant={item.status === "ok" ? "default" : "secondary"}>
              {item.count}
            </Badge>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
