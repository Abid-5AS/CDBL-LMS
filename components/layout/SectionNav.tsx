"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CalendarDays, ClipboardList, FileText, LayoutPanelTop, WalletCards } from "lucide-react";

type SectionLink = {
  href: string;
  label: string;
  icon?: LucideIcon;
  badge?: string;
};

function SectionNav({
  links,
  className,
}: {
  links: SectionLink[];
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Section navigation"
      className={cn(
        "w-full overflow-x-auto -mx-1",
        className,
      )}
    >
      <ul className="flex min-w-max items-center gap-1">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          const Icon = link.icon;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {Icon && <Icon className="h-4 w-4" aria-hidden />}
                <span>{link.label}</span>
                {link.badge && (
                  <span className="ml-1 rounded-full bg-primary/20 text-primary px-1.5 py-0.5 text-[10px] font-semibold">
                    {link.badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

const leaveLinks: SectionLink[] = [
  { href: "/leaves", label: "Requests", icon: ClipboardList },
  { href: "/leaves/apply", label: "Apply", icon: FileText },
  { href: "/leaves/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/balance", label: "Balances", icon: WalletCards },
  { href: "/policies", label: "Policies", icon: LayoutPanelTop },
];

export function LeaveSectionNav() {
  return <SectionNav links={leaveLinks} />;
}
