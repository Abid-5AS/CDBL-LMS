"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Command,
  Calendar,
  Users,
  FileText,
  Settings,
  Clock,
  TrendingUp,
  X,
  ArrowRight,
  History,
} from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { useUser } from "@/lib/user-context";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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

// Mock search results - in real app, this would come from API
const searchResults: SearchResult[] = [
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
    href: "/leaves/my",
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
  { title: "View History", href: "/leaves/my", icon: FileText },
  { title: "Dashboard", href: "/dashboard", icon: TrendingUp },
];

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = React.useState("");
  const [filteredResults, setFilteredResults] = React.useState<SearchResult[]>(
    []
  );
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const user = useUser();

  // Filter results based on query
  React.useEffect(() => {
    if (!query.trim()) {
      setFilteredResults([]);
      setSelectedIndex(0);
      return;
    }

    const filtered = searchResults.filter((result) => {
      const searchText = query.toLowerCase();
      return (
        result.title.toLowerCase().includes(searchText) ||
        result.description?.toLowerCase().includes(searchText) ||
        result.category.toLowerCase().includes(searchText) ||
        result.keywords?.some((keyword) =>
          keyword.toLowerCase().includes(searchText)
        )
      );
    });

    setFilteredResults(filtered);
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            Math.min(
              prev + 1,
              Math.max(filteredResults.length - 1, quickActions.length - 1)
            )
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (query.trim() && filteredResults.length > 0) {
            const selected = filteredResults[selectedIndex];
            if (selected) {
              handleResultClick(selected);
            }
          } else if (!query.trim() && quickActions.length > 0) {
            const selected = quickActions[selectedIndex];
            if (selected) {
              window.location.href = selected.href;
              onClose();
            }
          }
          break;
        case "Escape":
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredResults, selectedIndex, query, onClose]);

  // Focus input when modal opens
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleResultClick = (result: SearchResult) => {
    // Add to recent searches
    setRecentSearches((prev) => {
      const updated = [query, ...prev.filter((s) => s !== query)].slice(0, 5);
      return updated;
    });

    onClose();
    window.location.href = result.href;
  };

  const handleRecentSearchClick = (search: string) => {
    setQuery(search);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
  };

  if (!user) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-2xl glass-modal shadow-2xl border border-white/20 dark:border-white/10 rounded-3xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-4 p-6 border-b border-white/10">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for leaves, employees, settings..."
                className="flex-1 border-none bg-transparent text-lg placeholder:text-muted-foreground focus-visible:ring-0"
                variant="ghost"
              />
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors focus-ring"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto soft-scrollbar">
              {query.trim() ? (
                // Search Results
                <div className="p-4">
                  {filteredResults.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground px-3 py-2">
                        {filteredResults.length} result
                        {filteredResults.length !== 1 ? "s" : ""} for "{query}"
                      </p>
                      {filteredResults.map((result, index) => {
                        const Icon = result.icon;
                        return (
                          <motion.button
                            key={result.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => handleResultClick(result)}
                            className={cn(
                              "w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-200 focus-ring",
                              selectedIndex === index
                                ? "bg-primary/10 border border-primary/20"
                                : "hover:bg-white/5"
                            )}
                          >
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-foreground truncate">
                                  {result.title}
                                </h3>
                                <Badge variant="outline" size="xs">
                                  {result.category}
                                </Badge>
                                {result.badge && (
                                  <Badge variant="secondary" size="xs">
                                    {result.badge}
                                  </Badge>
                                )}
                              </div>
                              {result.description && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {result.description}
                                </p>
                              )}
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </motion.button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-medium text-foreground mb-2">
                        No results found
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Try searching for something else
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                // Quick Actions & Recent Searches
                <div className="p-4 space-y-6">
                  {/* Quick Actions */}
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-3 px-3">
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {quickActions.map((action, index) => {
                        const Icon = action.icon;
                        return (
                          <Link
                            key={action.href}
                            href={action.href}
                            onClick={onClose}
                            className={cn(
                              "flex items-center gap-3 p-4 rounded-2xl transition-all duration-200 focus-ring hover:bg-white/5",
                              selectedIndex === index && !query.trim()
                                ? "bg-primary/10 border border-primary/20"
                                : ""
                            )}
                          >
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="font-medium text-foreground">
                              {action.title}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3 px-3">
                        <h3 className="text-sm font-medium text-foreground">
                          Recent Searches
                        </h3>
                        <button
                          onClick={clearRecentSearches}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="space-y-1">
                        {recentSearches.map((search, index) => (
                          <button
                            key={index}
                            onClick={() => handleRecentSearchClick(search)}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left focus-ring"
                          >
                            <History className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">
                              {search}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-white/10 text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">↑↓</kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">↵</kbd>
                  <span>Select</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">esc</kbd>
                  <span>Close</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Command className="h-3 w-3" />
                <span>Search</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
