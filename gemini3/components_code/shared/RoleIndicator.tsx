"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getRoleBadgeClasses, getRoleLabel, type AppRole } from "@/lib/ui-utils";
import {
  BadgeCheck,
  Briefcase,
  ClipboardList,
  Crown,
  ShieldCheck,
  Target,
  UserRound,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const roleIconMap: Record<AppRole, LucideIcon> = {
  CEO: Crown,
  HR_HEAD: Target,
  HR_ADMIN: ClipboardList,
  DEPT_HEAD: UsersRound,
  EMPLOYEE: UserRound,
  SYSTEM_ADMIN: ShieldCheck,
};

type RoleIndicatorProps = {
  role: AppRole;
  showLabel?: boolean;
  className?: string;
};

export function RoleIndicator({
  role,
  showLabel = true,
  className,
}: RoleIndicatorProps) {
  const Icon = roleIconMap[role] ?? Briefcase;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium",
        className
      )}
    >
      <span className="inline-flex items-center justify-center rounded-full bg-muted/60 p-1.5 text-muted-foreground">
        <Icon className="size-3.5" />
      </span>
      {showLabel && <span>{getRoleLabel(role)}</span>}
    </span>
  );
}

export function RoleBadge({ role, className }: { role: AppRole; className?: string }) {
  const Icon = roleIconMap[role] ?? BadgeCheck;

  return (
    <Badge className={cn("gap-1.5 pr-3", getRoleBadgeClasses(role), className)}>
      <Icon className="size-3.5" aria-hidden="true" />
      <span className="tracking-tight">{getRoleLabel(role)}</span>
    </Badge>
  );
}
