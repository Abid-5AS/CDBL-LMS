"use client";

import { useMemo, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Bell, LogOut, Settings } from "lucide-react";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { SegmentedNav } from "./SegmentedNav";
import { LogoutButton } from "@/components/logout-button";
import { useUser } from "@/lib/user-context";
import clsx from "clsx";

export function TopNavBar() {
  const pathname = usePathname();
  const user = useUser();
  
  // Scroll shadow detection
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  // System status chip - placeholder for real status
  const systemStatus = useMemo(() => {
    // In a real implementation, fetch from API or context
    return { text: "All Systems Normal", color: "text-green-600 bg-green-50" };
  }, []);

  if (!user) return null;

  return (
    <header 
      className={clsx(
        "sticky top-0 z-50 border-b border-gray-200 bg-white/70 backdrop-blur-md transition-shadow duration-200",
        scrolled ? "shadow-md" : "shadow-sm"
      )} 
      role="banner"
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
        {/* Left Section: Logo + Page Title */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">CDBL</div>
              <div className="text-xs text-gray-500">Leave Management</div>
            </div>
          </div>
          
          {/* Center Section: Segmented Control */}
          <div className="hidden lg:flex ml-8">
            <SegmentedNav role={user.role as "EMPLOYEE" | "HR_ADMIN"} />
          </div>
        </div>

        {/* Right Section: System Status + Notifications + Profile */}
        <div className="flex items-center gap-3 ml-4 shrink-0">
          {/* System Status Chip */}
          <div className={`hidden xl:flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${systemStatus.color}`}>
            {systemStatus.text}
          </div>

          {/* Notifications */}
          <NotificationDropdown />

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
                aria-label="User profile menu"
              >
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="hidden md:block text-left min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                    {user.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate max-w-[120px]">
                    {user.email}
                  </div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <div className="flex flex-col gap-1 p-2">
                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="/settings" className="flex items-center gap-2 cursor-pointer">
                  <Settings className="h-4 w-4" />
                  Settings
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="p-2">
                <LogoutButton className="w-full justify-start px-2" />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

