"use client";

import * as React from "react";
import {
  Calendar,
  Users,
  FileText,
  Settings,
  Clock,
  TrendingUp,
  History,
  ArrowRight,
  Loader2,
  Moon,
  Sun,
  Monitor,
  HelpCircle,
  LogOut,
} from "lucide-react";

import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { useUser } from "@/components/providers/UserContext";
import { Badge } from "@/components/ui/badge";
import useSWR from "swr";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

// Simple fetcher for API calls
const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  badge?: string;
  keywords?: string[];
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Static navigation results
const staticResults: SearchResult[] = [
  {
    id: "apply-leave",
    title: "Apply for Leave",
    description: "Submit a new leave application",
    href: "/leaves/apply",
    icon: Calendar,
    category: "Actions",
    keywords: ["apply", "request", "leave", "vacation", "time off"],
  },
  {
    id: "my-leaves",
    title: "My Leaves",
    description: "View your leave history and status",
    href: "/leaves",
    icon: FileText,
    category: "Leaves",
    keywords: ["history", "status", "my", "leaves"],
  },
  {
    id: "leave-balance",
    title: "Leave Balance",
    description: "Check your available leave balance",
    href: "/balance",
    icon: Clock,
    category: "Balance",
    keywords: ["balance", "available", "remaining", "days"],
  },
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Overview of your leave management",
    href: "/dashboard",
    icon: TrendingUp,
    category: "Navigation",
    keywords: ["overview", "summary", "dashboard", "home"],
  },
  {
    id: "employees",
    title: "Employee Directory",
    description: "Browse and manage employees",
    href: "/employees",
    icon: Users,
    category: "Management",
    keywords: ["employees", "staff", "directory", "team"],
  },
  {
    id: "settings",
    title: "Settings",
    description: "Configure your preferences",
    href: "/settings",
    icon: Settings,
    category: "Settings",
    keywords: ["settings", "preferences", "configuration"],
  },
];

const quickActions = [
  { title: "Apply Leave", href: "/leaves/apply", icon: Calendar },
  { title: "Check Balance", href: "/balance", icon: Clock },
  { title: "View History", href: "/leaves", icon: FileText },
  { title: "Dashboard", href: "/dashboard", icon: TrendingUp },
];

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = React.useState("");
  const [filteredResults, setFilteredResults] = React.useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);
  const user = useUser();
  const { setTheme } = useTheme();

  // Debounce the query
  const debouncedQuery = useDebounce(query, 300);

  // Fetch leave requests
  const { data: leavesData, isLoading: isLoadingLeaves } = useSWR(
    debouncedQuery.trim() && isOpen
      ? `/api/leaves?mine=1&limit=5`
      : null,
    fetcher
  );

  // Fetch employees
  const { data: employeesData, isLoading: isLoadingEmployees } = useSWR(
    debouncedQuery.trim() && isOpen && (user?.role === "SYSTEM_ADMIN" || user?.role === "HR_ADMIN" || user?.role === "DEPT_HEAD")
      ? `/api/employees?limit=5`
      : null,
    fetcher
  );

  const isLoading = isLoadingLeaves || isLoadingEmployees;

  // Filter Logic
  React.useEffect(() => {
    if (!debouncedQuery.trim()) {
      setFilteredResults([]);
      return;
    }

    const results: SearchResult[] = [];
    const searchText = debouncedQuery.toLowerCase();

    // Static
    const filteredStatic = staticResults.filter((result) =>
      result.title.toLowerCase().includes(searchText) ||
      result.description?.toLowerCase().includes(searchText) ||
      result.category.toLowerCase().includes(searchText) ||
      result.keywords?.some((keyword) =>
        keyword.toLowerCase().includes(searchText)
      )
    );
    results.push(...filteredStatic);

    // Leaves
    if (leavesData?.leaves && Array.isArray(leavesData.leaves)) {
      const leaveResults = leavesData.leaves
        .filter((leave: any) => {
          const leaveSearchText = `${leave.id} ${leave.type} ${leave.status} ${leave.requester?.name || ""}`.toLowerCase();
          return leaveSearchText.includes(searchText);
        })
        .slice(0, 5)
        .map((leave: any) => ({
          id: `leave-${leave.id}`,
          title: `Leave Request #${leave.id}`,
          description: `${leave.type} - ${leave.status}`,
          href: `/leaves/${leave.id}`,
          icon: Calendar,
          category: "Leaves",
          badge: leave.status,
          keywords: []
        }));
      results.push(...leaveResults);
    }

    // Employees
    if (employeesData?.employees && Array.isArray(employeesData.employees)) {
      const employeeResults = employeesData.employees
        .filter((emp: any) => {
          const empSearchText = `${emp.name} ${emp.email} ${emp.department || ""}`.toLowerCase();
          return empSearchText.includes(searchText);
        })
        .slice(0, 5)
        .map((emp: any) => ({
          id: `employee-${emp.id}`,
          title: emp.name,
          description: emp.department ? `${emp.department} • ${emp.email}` : emp.email,
          href: `/employees/${emp.id}`,
          icon: Users,
          category: "Employees",
          badge: emp.role,
           keywords: []
        }));
      results.push(...employeeResults);
    }

    setFilteredResults(results);
  }, [debouncedQuery, leavesData, employeesData]);

  const handleSelect = (href: string) => {
    setRecentSearches((prev) => {
      const updated = [query.trim() || "Navigation", ...prev.filter((s) => s !== query.trim())].slice(0, 5);
      return updated;
    });
    onClose();
    window.location.href = href;
  };

  if (!user) return null;

  return (
    <CommandDialog open={isOpen} onOpenChange={onClose}>
      <CommandInput 
        placeholder="Type a command or search..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
           {isLoading ? (
             <div className="flex flex-col items-center justify-center py-6 gap-2">
               <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
               <p className="text-sm text-muted-foreground">Searching...</p>
             </div>
           ) : (
             "No results found."
           )}
        </CommandEmpty>

        {/* Quick Actions (Show when query is empty) */}
        {!query && (
          <CommandGroup heading="Quick Actions">
            {quickActions.map((action) => (
              <CommandItem
                key={action.href}
                value={action.title}
                onSelect={() => handleSelect(action.href)}
                className="cursor-pointer"
              >
                <div className="mr-2 flex h-4 w-4 items-center justify-center">
                  <action.icon className="h-3 w-3" />
                </div>
                <span>{action.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Recent Searches (Show when query is empty) */}
        {!query && recentSearches.length > 0 && (
           <>
            <CommandSeparator />
            <CommandGroup heading="Recent">
              {recentSearches.map((search, i) => (
                <CommandItem key={i} value={search} onSelect={() => setQuery(search)}>
                  <History className="mr-2 h-4 w-4" />
                  <span>{search}</span>
                </CommandItem>
              ))}
            </CommandGroup>
           </>
        )}

        {/* Search Results */}
        {query && (
          <CommandGroup heading="Suggestions">
            {filteredResults.map((result) => {
               const Icon = result.icon;
               return (
                <CommandItem
                  key={result.id}
                  value={result.title + result.description} // Search against both title and desc
                  onSelect={() => handleSelect(result.href)}
                  className="cursor-pointer"
                >
                  <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted/50">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{result.title}</span>
                      {result.badge && (
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                          {result.badge}
                        </Badge>
                      )}
                    </div>
                     {result.description && (
                      <span className="text-xs text-muted-foreground">{result.description}</span>
                    )}
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground/50 opacity-0 group-data-[selected=true]:opacity-100" />
                </CommandItem>
              )
            })}
          </CommandGroup>
        )}

        {/* System & Help Commands */}
        <CommandSeparator />
        <CommandGroup heading="System & Preferences">
          <CommandItem onSelect={() => { setTheme("light"); onClose(); }}>
            <Sun className="mr-2 h-4 w-4" />
            <span>Switch to Light Mode</span>
          </CommandItem>
          <CommandItem onSelect={() => { setTheme("dark"); onClose(); }}>
            <Moon className="mr-2 h-4 w-4" />
            <span>Switch to Dark Mode</span>
          </CommandItem>
          <CommandItem onSelect={() => { setTheme("system"); onClose(); }}>
             <Monitor className="mr-2 h-4 w-4" />
             <span>System Theme</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("/help")}>
             <HelpCircle className="mr-2 h-4 w-4" />
             <span>Help Center</span>
          </CommandItem>
        </CommandGroup>

      </CommandList>
    </CommandDialog>
  );
}
