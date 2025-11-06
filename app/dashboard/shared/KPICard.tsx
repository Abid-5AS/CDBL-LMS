"use client";

import type { ComponentType } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type KPICardProps = {
  title: string;
  value: string;
  subtext?: string;
  icon?: ComponentType<{ size?: number; className?: string }>;
  iconColor?: string;
  // Enhanced props
  progress?: {
    used: number;
    total: number;
  };
  status?: "healthy" | "low" | "critical";
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  // Material 3 enhancements
  accentColor?: string;
  className?: string;
};

export function KPICard({
  title,
  value,
  subtext,
  icon: Icon,
  iconColor,
  progress,
  status,
  badge,
  badgeVariant = "default",
  accentColor,
  className,
}: KPICardProps) {
  const progressPercentage = progress
    ? Math.min(Math.max((progress.used / progress.total) * 100, 0), 100)
    : undefined;

  const getProgressColor = (status?: string) => {
    switch (status) {
      case "healthy":
        return "bg-emerald-500";
      case "low":
        return "bg-amber-500";
      case "critical":
        return "bg-red-500";
      default:
        return accentColor || "bg-blue-600";
    }
  };

  const getAccentBarColor = () => {
    if (accentColor) return accentColor;
    if (status === "healthy") return "bg-emerald-500";
    if (status === "low") return "bg-amber-500";
    if (status === "critical") return "bg-red-500";
    return "bg-blue-600";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        ease: [0.22, 1, 0.36, 1],
        opacity: { duration: 0.3 },
        scale: { duration: 0.4 }
      }}
      whileHover={{ 
        y: -2, 
        scale: 1.01,
        transition: { duration: 0.2, ease: "easeOut" }
      }}
    >
      <Card
        className={cn(
          "glass-card relative overflow-hidden rounded-2xl",
          className
        )}
      >
        {/* Accent bar */}
        <div
          className={cn(
            "absolute left-0 top-0 h-full w-1",
            getAccentBarColor()
          )}
        />

        <CardHeader className="flex flex-row items-start justify-between px-6 pt-6">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              {title}
              {badge && (
                <Badge variant={badgeVariant} className="text-xs">
                  {badge}
                </Badge>
              )}
            </CardTitle>
          </div>
          {Icon && (
            <div
              className={cn(
                "rounded-xl p-2.5 transition-colors",
                iconColor
                  ? `bg-${iconColor}/10`
                  : "bg-muted/50"
              )}
            >
              <Icon
                size={20}
                className={cn(
                  iconColor || "text-muted-foreground"
                )}
              />
            </div>
          )}
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="text-3xl font-semibold tracking-tight text-foreground">
            {value}
          </div>
          {subtext && (
            <p className="mt-2 text-xs text-muted-foreground">{subtext}</p>
          )}
          {progress && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {progress.used} / {progress.total} days used
                </span>
                <span className="font-medium">
                  {Math.round(progressPercentage ?? 0)}%
                </span>
              </div>
              <Progress
                value={progressPercentage}
                className="h-2"
                indicatorClassName={status ? getProgressColor(status) : undefined}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
