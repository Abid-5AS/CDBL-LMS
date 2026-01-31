import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Calendar } from "lucide-react";
import { leaveTypeLabel } from "@/lib/ui/ui";
import { LeaveType } from "@/lib/enums";
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

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { normalizeToDhakaMidnight } from "@/lib/date-utils";

async function getTeamOnLeave(scope: string = "team") {
  try {
    const me = await getCurrentUser();
    if (!me) return null;

    const targetDate = normalizeToDhakaMidnight(new Date());
    let memberIds: number[] = [];
    let teamMembers: Array<{ id: number; name: string; email: string; empCode: string | null }> = [];

    if (scope === "me") {
      memberIds = [me.id];
      teamMembers = [{ id: me.id, name: me.name, email: me.email, empCode: me.empCode }];
    } else {
      // Find team members (same deptHeadId)
      const currentUser = await prisma.user.findUnique({
        where: { id: me.id },
        select: { deptHeadId: true },
      });

      if (!currentUser?.deptHeadId) {
        return { count: 0, members: [] };
      }

      teamMembers = await prisma.user.findMany({
        where: {
          deptHeadId: currentUser.deptHeadId,
          id: { not: me.id },
        },
        select: { id: true, name: true, email: true, empCode: true },
      });
      memberIds = teamMembers.map((m) => m.id);
    }

    if (memberIds.length === 0) {
      return { count: 0, members: [] };
    }

    const leavesOnLeave = await prisma.leaveRequest.findMany({
      where: {
        requesterId: { in: memberIds },
        status: "APPROVED",
        startDate: { lte: targetDate },
        endDate: { gte: targetDate },
      },
      select: {
        id: true,
        requesterId: true,
        type: true,
        startDate: true,
        endDate: true,
      },
      orderBy: { startDate: "asc" },
    });

    const members = leavesOnLeave.map((leave) => {
      const member = teamMembers.find((m) => m.id === leave.requesterId);
      if (!member) return null;
      return {
        id: member.id,
        name: member.name,
        type: leave.type,
        start: leave.startDate.toISOString(),
        end: leave.endDate.toISOString(),
      };
    }).filter((c): c is NonNullable<typeof c> => c !== null);

    return { count: members.length, members };
  } catch (error) {
    console.error("Error fetching team on leave:", error);
    return null;
  }
}

export async function WhosOutToday({ scope = "team", title }: WhosOutTodayProps) {
  const data = await getTeamOnLeave(scope);
  const displayTitle = title || (scope === "me" ? "My Leave Status" : "Who's Out Today");

  // Determine count display
  const countDisplay = data && data.count > 0 ? (
    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-2 h-6">
      {data.count}
    </Badge>
  ) : null;

  if (!data) {
    return (
      <Card className="rounded-[20px] border border-border/50 bg-card shadow-md backdrop-blur-sm">
        <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            {displayTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="h-20 flex items-center justify-center text-sm text-destructive/80">
            Unable to load data
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[20px] border border-border/50 bg-card shadow-md backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-3 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-medium flex items-center gap-2 text-foreground/80">
          <User className="h-4 w-4 text-muted-foreground" />
          {displayTitle}
        </CardTitle>
        {countDisplay}
      </CardHeader>
      <CardContent className="px-0 pb-4">
        {!data || data.count === 0 ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground/60">
            <Calendar className="h-4 w-4" />
            <span>Everyone is present today</span>
          </div>
        ) : (
          <div className="flex overflow-x-auto pb-2 px-4 gap-3 snap-x scrollbar-thin scrollbar-thumb-border/40 scrollbar-track-transparent">
            {data.members.map((member, index) => (
              <div
                key={`${member.id}-${index}`}
                className={cn(
                  "min-w-[200px] max-w-[200px] shrink-0 snap-start",
                  "rounded-lg border border-border/40 bg-card/40 hover:bg-card/60 transition-colors p-3",
                  "flex flex-col gap-2 group"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate text-foreground/90 group-hover:text-primary transition-colors">
                      {member.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate uppercase tracking-wider">
                      {leaveTypeLabel[member.type]}
                    </span>
                  </div>
                </div>

                <div className="pt-2 mt-auto border-t border-border/30 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="bg-muted/50 px-1.5 py-0.5 rounded text-foreground/70">
                    {new Date(member.start).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <span className="text-muted-foreground/50">→</span>
                  <span className="bg-muted/50 px-1.5 py-0.5 rounded text-foreground/70">
                    {new Date(member.end).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
