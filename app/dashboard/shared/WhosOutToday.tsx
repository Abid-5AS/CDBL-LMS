"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Calendar } from "lucide-react";
import { leaveTypeLabel } from "@/lib/ui";
import { LeaveType } from "@prisma/client";
import { glassCard, neoBadge } from "@/lib/neo-design";
import { cn } from "@/lib/utils";

type TeamMember = {
  id: number;
  name: string;
  type: LeaveType;
  start: string;
  end: string;
};

type WhosOutTodayProps = {
  scope?: "team" | "me";
  title?: string;
};

export function WhosOutToday({ scope = "team", title }: WhosOutTodayProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    date: string;
    count: number;
    members: TeamMember[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/team/on-leave?scope=${scope}`);

        if (!response.ok) {
          throw new Error("Failed to fetch");
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError("Failed to load data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [scope]);

  const displayTitle = title || (scope === "me" ? "My Leave Status" : "Who's Out Today");

  if (loading) {
    return (
      <Card className={cn(glassCard.elevated, "rounded-xl")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {displayTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-sm text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn(glassCard.elevated, "rounded-xl")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {displayTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(glassCard.elevated, "rounded-xl")}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {displayTitle}
          </div>
          {data && data.count > 0 && (
            <Badge variant="secondary" className={cn("ml-auto", neoBadge.glass)}>
              {data.count} {data.count === 1 ? "person" : "people"}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!data || data.count === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
            <p className="text-sm font-medium text-muted-foreground">
              {scope === "me" ? "You're not on leave today" : "Everyone is in the office today!"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">No approved leaves for today</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {data.members.map((member) => (
              <div
                key={member.id}
                className={cn(
                  "flex items-start gap-2.5 p-2.5 rounded-lg transition-all duration-200",
                  "backdrop-blur-md bg-white/30 dark:bg-gray-900/30",
                  "border border-white/20 dark:border-white/10",
                  "hover:bg-white/50 dark:hover:bg-gray-900/50 hover:shadow-md"
                )}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{member.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={cn("text-xs", neoBadge.glass)}>
                      {leaveTypeLabel[member.type]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(member.start).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                      {" - "}
                      {new Date(member.end).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
