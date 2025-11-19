"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Info, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SystemAlert {
  id: string;
  type: "info" | "warning" | "success";
  title: string;
  message: string;
  timestamp?: Date;
}

// Mock alerts for now - in production these would come from an API
const mockAlerts: SystemAlert[] = [
  {
    id: "1",
    type: "success",
    title: "Database Backup Completed",
    message: "Automated backup completed successfully at 2:00 AM",
  },
  {
    id: "2",
    type: "info",
    title: "System Update Available",
    message: "A new system update is available. Review before applying.",
  },
];

export function SystemAlertsPanel() {
  const alerts = mockAlerts;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "warning":
        return AlertTriangle;
      case "success":
        return CheckCircle;
      default:
        return Info;
    }
  };

  const getAlertStyle = (type: string) => {
    switch (type) {
      case "warning":
        return "bg-data-warning/10 border-data-warning/30 text-data-warning";
      case "success":
        return "bg-data-success/10 border-data-success/30 text-data-success";
      default:
        return "bg-data-info/10 border-data-info/30 text-data-info";
    }
  };

  return (
    <Card className="surface-card">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          System Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-data-success" />
            <p>All systems operating normally</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const Icon = getAlertIcon(alert.type);
            return (
              <div
                key={alert.id}
                className={cn(
                  "p-3 rounded-lg border text-sm",
                  getAlertStyle(alert.type)
                )}
              >
                <div className="flex items-start gap-2">
                  <Icon className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{alert.title}</p>
                    <p className="text-xs opacity-90 mt-1">{alert.message}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
