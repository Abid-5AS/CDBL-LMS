"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Users, User } from "lucide-react";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  Skeleton,
} from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { apiFetcher } from "@/lib/apiClient";

interface Colleague {
  id: number;
  name: string;
  email: string;
  empCode?: string;
  type: string;
  range: [string, string];
}

const AVATAR_COLORS = [
  "var(--color-leave-earned)",
  "var(--color-leave-casual)",
  "var(--color-leave-medical)",
  "var(--color-data-info)",
];

const Avatar = ({ name }: { name: string }) => {
  const parts = name.split(" ");
  const initials = parts.length >= 2 ? `${parts[0][0]}${parts.at(-1)?.[0] ?? ""}` : name.slice(0, 2);
  const colorIndex =
    name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % AVATAR_COLORS.length;

  return (
    <div
      className="flex size-12 items-center justify-center rounded-2xl text-sm font-semibold"
      style={{
        backgroundColor: AVATAR_COLORS[colorIndex],
        color: "var(--color-text-inverted)",
      }}
    >
      {initials.toUpperCase()}
    </div>
  );
};

export function TeamOnLeaveWidget() {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const { data, isLoading, error } = useSWR<{
    date: string;
    count: number;
    members: Colleague[];
  }>(`/api/team/on-leave?date=${today}&scope=team`, apiFetcher, {
    revalidateOnFocus: true,
    refreshInterval: 60000,
  });

  if (isLoading) {
    return <Skeleton className="h-44 w-full rounded-2xl" />;
  }

  if (error || !data) return null;

  const colleagues = data.members || [];
  const count = data.count ?? colleagues.length;

  if (colleagues.length === 0) {
    return (
      <div className="neo-card flex flex-col items-center gap-3 px-6 py-6 text-center">
        <div className="rounded-2xl border border-white/10 p-3 shadow-inner">
          <Users className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold text-foreground">
          No team members on leave today
        </p>
        <p className="text-xs text-muted-foreground">
          Everyone is present. Plan ahead using the holiday calendar.
        </p>
        <Link href="/leaves" className="text-xs font-semibold text-primary underline">
          View leave board
        </Link>
      </div>
    );
  }

  return (
    <div className="neo-card space-y-4 px-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Team Today
          </p>
          <h3 className="text-lg font-semibold text-foreground">Team on Leave</h3>
          <p className="text-sm text-muted-foreground">
            {count} colleague{count > 1 ? "s" : ""} on leave
          </p>
        </div>
        <button
          type="button"
          className="text-xs font-semibold text-muted-foreground hover:text-foreground"
          onClick={() => router.push("/leaves?scope=team")}
        >
          View details
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {colleagues.map((colleague) => (
          <TooltipProvider key={colleague.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="flex min-w-[96px] flex-col items-center gap-2 rounded-2xl border border-white/10 bg-[color-mix(in_srgb,var(--color-card)90%,transparent)] px-4 py-3 text-center hover:-translate-y-0.5"
                  onClick={() => router.push(`/leaves?userId=${colleague.id}&date=${today}`)}
                >
                  <Avatar name={colleague.name} />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {colleague.name.split(" ")[0]}
                    </p>
                    <p className="text-xs text-muted-foreground">{colleague.type}</p>
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">
                  <p className="font-semibold">{colleague.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {colleague.type} • {formatDate(colleague.range[0])} → {formatDate(colleague.range[1])}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
}
