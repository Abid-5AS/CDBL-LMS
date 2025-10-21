import type { ComponentType } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type KPICardProps = {
  title: string;
  value: string;
  subtext?: string;
  icon?: ComponentType<{ size?: number; className?: string }>;
  iconColor?: string;
};

export function KPICard({ title, value, subtext, icon: Icon, iconColor }: KPICardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <CardTitle className="text-xs font-medium uppercase text-muted-foreground">{title}</CardTitle>
        {Icon ? <Icon size={18} className={iconColor ?? "text-muted-foreground"} /> : null}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold text-foreground">{value}</div>
        {subtext ? <p className="text-xs text-muted-foreground mt-2">{subtext}</p> : null}
      </CardContent>
    </Card>
  );
}
