"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

type NavLink = {
  href: string;
  label: string;
};

const EMPLOYEE_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leaves", label: "Requests" },
  { href: "/leaves/apply", label: "Apply" },
  { href: "/holidays", label: "Holidays" },
  { href: "/policies", label: "Policies" },
];

const HR_ADMIN_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/approvals", label: "Approvals" },
  { href: "/employees", label: "Employees" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

export function SegmentedNav({ role }: { role: "EMPLOYEE" | "HR_ADMIN" }) {
  const pathname = usePathname();
  const links = role === "HR_ADMIN" ? HR_ADMIN_LINKS : EMPLOYEE_LINKS;

  return (
    <nav className="flex items-center gap-1 rounded-full bg-gray-100 p-1" role="navigation" aria-label="Main navigation">
      {links.map((link) => {
        const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
        
        return (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              "relative px-4 py-2 text-sm font-medium transition-all duration-300 ease-out rounded-full",
              "focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2",
              "hover:bg-white/50",
              isActive
                ? "bg-indigo-100 text-indigo-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

