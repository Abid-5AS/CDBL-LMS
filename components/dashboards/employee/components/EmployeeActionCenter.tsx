"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@/components/ui";
import { cn } from "@/lib/utils";

type ActionItem = {
  type: "returned" | "certificate" | "cancelable" | "expiring";
  title: string;
  description: string;
  action: string;
  actionLink: string;
  variant: "destructive" | "warning" | "info";
  data?: any;
};

type EmployeeActionCenterProps = {
  actionItems: ActionItem[];
};

export function EmployeeActionCenter({ actionItems }: EmployeeActionCenterProps) {
  const router = useRouter();

  return (
    <Card
      className={cn(
        "bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-white/20 dark:border-slate-700/50 shadow-xl border-l-4",
        actionItems.length > 0
          ? "border-l-primary"
          : "border-l-slate-300 dark:border-l-slate-600"
      )}
    >
      <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="size-4 sm:size-5 text-primary" aria-hidden="true" />
            <span>Action Center</span>
          </CardTitle>
          {actionItems.length > 0 && (
            <Badge
              variant="default"
              className="bg-primary/10 text-primary dark:bg-primary/20 text-xs"
            >
              {actionItems.length}{" "}
              {actionItems.length === 1 ? "item" : "items"}
            </Badge>
          )}
        </div>
        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
          {actionItems.length > 0
            ? "Recommended actions and reminders"
            : "You're all caught up! No pending actions."}
        </p>
      </CardHeader>
      <CardContent>
        {actionItems.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-3" />
            <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
              All Clear!
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              No action items at this time. Enjoy your day!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {actionItems.slice(0, 5).map((item, index) => {
              const bgColor =
                item.variant === "destructive"
                  ? "bg-red-50/50 dark:bg-red-900/10 border-red-200/50 dark:border-red-800/30"
                  : item.variant === "warning"
                  ? "bg-amber-50/50 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-800/30"
                  : "bg-blue-50/50 dark:bg-blue-900/10 border-blue-200/50 dark:border-blue-800/30";

              const buttonColor =
                item.variant === "destructive"
                  ? "bg-red-600 hover:bg-red-700"
                  : item.variant === "warning"
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-blue-600 hover:bg-blue-700";

              return (
                <motion.div
                  key={`${item.type}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border gap-3 sm:gap-2",
                    bgColor
                  )}
                >
                  <div className="flex-1 space-y-1">
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {item.description}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => router.push(item.actionLink)}
                    className={cn(
                      "text-white shrink-0 text-xs",
                      buttonColor
                    )}
                  >
                    {item.action}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
