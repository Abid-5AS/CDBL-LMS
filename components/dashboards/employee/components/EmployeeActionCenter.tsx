import * as React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Sparkles, CheckCircle2, ArrowRight, AlertCircle, Clock, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from "@/components/ui";
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

export function EmployeeActionCenter({
  actionItems,
}: EmployeeActionCenterProps) {
  const router = useRouter();

  return (
    <Card className="rounded-[20px] border-border/60 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm shadow-sm overflow-hidden">
      <CardHeader className="pb-4 pt-5 px-6 border-b border-border/40">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-brand/10 flex items-center justify-center text-brand">
              <Sparkles className="size-4" aria-hidden="true" />
            </div>
            <span>Action Center</span>
          </CardTitle>
          {actionItems.length > 0 && (
            <Badge
              variant="secondary"
              className="bg-brand-soft/50 text-brand-dark dark:text-brand-light border-0"
            >
              {actionItems.length} {actionItems.length === 1 ? "task" : "tasks"}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {actionItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">
              You're all caught up!
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              No pending actions. We'll verify your status and notify you if anything needs attention.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {actionItems.slice(0, 5).map((item, index) => {
              const statusColor =
                item.variant === "destructive"
                  ? "bg-destructive text-destructive-foreground"
                  : item.variant === "warning"
                    ? "bg-amber-500 text-white"
                    : "bg-blue-500 text-white";

              const icon =
                item.variant === "destructive" ? AlertCircle :
                  item.variant === "warning" ? AlertTriangle : Clock;

              const ItemIcon = icon;

              return (
                <motion.div
                  key={`${item.type}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 hover:bg-muted/30 transition-colors gap-4"
                >
                  <div className="flex gap-4 items-start sm:items-center">
                    {/* Status Indicator Orbit */}
                    <div className={cn("mt-1 sm:mt-0 shrink-0 h-2 w-2 rounded-full ring-4 ring-opacity-20",
                      item.variant === "destructive" ? "bg-destructive ring-destructive" :
                        item.variant === "warning" ? "bg-amber-500 ring-amber-500" :
                          "bg-blue-500 ring-blue-500"
                    )} />

                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-foreground leading-none">
                        {item.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={item.variant === "destructive" ? "outline" : "outline"}
                    className={cn(
                      "rounded-full text-xs h-8 px-4 sm:ml-auto w-full sm:w-[160px] shadow-none justify-center",
                      item.variant === "destructive" && "border-amber-500/50 text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30",
                      item.variant === "warning" && "border-amber-500/50 text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30",
                      item.variant === "info" && "border-primary/20 hover:border-primary/50 hover:bg-primary/5 text-primary"
                    )}
                    onClick={() => router.push(item.actionLink)}
                  >
                    {item.action}
                    <ArrowRight className="ml-1.5 h-3 w-3 shrink-0" />
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
