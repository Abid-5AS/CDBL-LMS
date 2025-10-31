"use client";

import { Button } from "@/components/ui/button";
import { CalendarPlus, ClipboardCheck, FileText } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function QuickActionsCard() {
  // Fetch pending requests count for the badge
  const { data: leavesData } = useSWR("/api/leaves?mine=1", fetcher, {
    revalidateOnFocus: false,
  });

  const pendingCount = Array.isArray(leavesData?.items)
    ? leavesData.items.filter(
        (item: { status: string }) => item.status === "SUBMITTED" || item.status === "PENDING"
      ).length
    : 0;

  const actions = [
    {
      label: "Apply Leave",
      icon: CalendarPlus,
      href: "/leaves/apply",
      variant: "default" as const,
      className: "bg-blue-600 hover:bg-blue-700 text-white",
    },
    {
      label: "My Requests",
      icon: ClipboardCheck,
      href: "/leaves",
      variant: "outline" as const,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      label: "Policies",
      icon: FileText,
      href: "/policies",
      variant: "outline" as const,
    },
  ];

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {actions.map((action, index) => {
        const Icon = action.icon;

        return (
          <Button
            key={index}
            asChild
            variant={action.variant}
            className={`
              relative rounded-full px-4 py-2 font-medium transition-all ease-out duration-300
              ${action.className || ""}
            `}
          >
            <Link href={action.href}>
              <Icon className="h-4 w-4 mr-2" />
              {action.label}
              {action.badge && (
                <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">
                  {action.badge}
                </Badge>
              )}
            </Link>
          </Button>
        );
      })}
    </div>
  );
}

