"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, ChevronRight, X } from "lucide-react";
import { leaveTypeLabel } from "@/lib/ui";
import { LeaveType } from "@prisma/client";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type TeamMember = {
  id: number;
  name: string;
  type: LeaveType;
  start: string;
  end: string;
};

export function TeamStatusSummary() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    date: string;
    count: number;
    members: TeamMember[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/team/on-leave?scope=team`);

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
  }, []);

  if (loading) {
    return (
      <div className="h-[100px] w-full animate-pulse rounded-xl bg-muted/50" />
    );
  }

  if (error || !data) {
    return null;
  }

  const displayedMembers = data.members.slice(0, 4);
  const remainingCount = Math.max(0, data.count - 4);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div 
          className="group cursor-pointer rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md"
          role="button"
          tabIndex={0}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Out Today</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">{data.count}</span>
                <span className="text-sm text-muted-foreground">team members</span>
              </div>
            </div>
            <div className="rounded-full bg-primary/10 p-2 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Calendar className="h-5 w-5" />
            </div>
          </div>

          {data.count > 0 ? (
            <div className="flex items-center justify-between">
              <div className="flex -space-x-2 overflow-hidden">
                {displayedMembers.map((member) => (
                  <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                    <AvatarFallback className="bg-primary/10 text-[10px] text-primary font-medium">
                      {member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {remainingCount > 0 && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium text-muted-foreground">
                    +{remainingCount}
                  </div>
                )}
              </div>
              <div className="flex items-center text-xs text-primary font-medium opacity-0 transition-opacity group-hover:opacity-100">
                View Details <ChevronRight className="h-3 w-3 ml-1" />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Everyone is in today!</p>
          )}
        </div>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Who's Out Today</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {data.members.length > 0 ? (
            data.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-lg border border-border p-3"
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{member.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {leaveTypeLabel[member.type]} • {new Date(member.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(member.end).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No one is on leave today.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
