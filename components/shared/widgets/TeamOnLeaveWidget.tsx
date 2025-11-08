"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui";
import { Users, User } from "lucide-react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { formatDate } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Colleague {
  id: number;
  name: string;
  email: string;
  empCode?: string;
  type: string;
  range: [string, string]; // [startDate, endDate] in YYYY-MM-DD format
}

function getInitials(name: string): string {
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = getInitials(name);
  // Generate a color based on name hash for consistency
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-yellow-500",
    "bg-red-500",
    "bg-cyan-500",
  ];
  const colorIndex =
    name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    colors.length;
  const bgColor = colors[colorIndex];

  return (
    <div
      className={`${bgColor} text-white rounded-full flex items-center justify-center font-semibold text-xs ${
        className || "size-10"
      }`}
    >
      {initials}
    </div>
  );
}

export function TeamOnLeaveWidget() {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const { data, isLoading, error } = useSWR<{
    date: string;
    count: number;
    members: Colleague[];
  }>(`/api/team/on-leave?date=${today}&scope=team`, fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <Card className="solid-card animate-fade-in-up">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="size-4" />
            Team on Leave Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return null; // Don't show error state, just hide the widget
  }

  const colleagues = data.members || [];
  const count = data.count ?? colleagues.length;

  if (colleagues.length === 0) {
    return (
      <Card className="solid-card animate-fade-in-up">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="size-4" />
            Team on Leave Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <User className="size-12 text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              No team members on leave today
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              All colleagues are present
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="solid-card animate-fade-in-up">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="size-4" />
          Team on Leave Today
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {count} colleague{count > 1 ? "s" : ""} on leave today
        </p>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
          {colleagues.map((colleague) => (
            <TooltipProvider key={colleague.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="flex flex-col items-center gap-2 min-w-[80px] cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Navigate to filtered list
                      router.push(
                        `/leaves?deptHeadId=${colleague.id}&date=${today}`
                      );
                    }}
                  >
                    <Avatar name={colleague.name} />
                    <div className="text-center">
                      <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[80px]">
                        {colleague.name.split(" ")[0]}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">
                        {colleague.type}
                      </p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-sm">
                    <p className="font-semibold">{colleague.name}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {colleague.type} Leave
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(colleague.range[0])} →{" "}
                      {formatDate(colleague.range[1])}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
