"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, Clock, FileText, Info, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * Action Item Interface
 */
export interface ActionItem {
  id: string | number;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  link?: string;
  actionType: "info_needed" | "approval_required" | "certificate_missing" | "other";
  timestamp?: Date | string;
}

/**
 * ActionCenter Props Interface
 *
 * @interface ActionCenterProps
 * @property {ActionItem[]} actions - Array of pending actions
 * @property {(id: string | number) => void} [onDismiss] - Optional dismiss callback
 * @property {number} [maxItems] - Maximum items to display (default: 5)
 * @property {boolean} [showViewAll] - Show "View All" link
 * @property {string} [viewAllLink] - Link for "View All" button
 */
export interface ActionCenterProps {
  actions: ActionItem[];
  onDismiss?: (id: string | number) => void;
  maxItems?: number;
  showViewAll?: boolean;
  viewAllLink?: string;
  isLoading?: boolean;
  className?: string;
}

const priorityStyles = {
  high: {
    badge: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800",
    border: "border-l-red-500",
  },
  medium: {
    badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
    border: "border-l-yellow-500",
  },
  low: {
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    border: "border-l-blue-500",
  },
};

const actionTypeLabels = {
  info_needed: "Info Needed",
  approval_required: "Approval Required",
  certificate_missing: "Certificate Missing",
  other: "Action Required",
};

const actionTypeIcons = {
  info_needed: Info,
  approval_required: Clock,
  certificate_missing: FileText,
  other: AlertCircle,
};

/**
 * ActionCenter Component
 *
 * Widget showing pending tasks/actions needed from user.
 * Features priority badges, dismissible items, and empty states.
 *
 * @example
 * ```tsx
 * <ActionCenter
 *   actions={[
 *     {
 *       id: '1',
 *       title: 'Missing medical certificate',
 *       description: 'Please upload certificate for leave #123',
 *       priority: 'high',
 *       actionType: 'certificate_missing',
 *       link: '/leaves/123'
 *     }
 *   ]}
 *   onDismiss={(id) => handleDismiss(id)}
 *   maxItems={5}
 *   showViewAll
 * />
 * ```
 */
export function ActionCenter({
  actions,
  onDismiss,
  maxItems = 5,
  showViewAll = true,
  viewAllLink = "/actions",
  isLoading = false,
  className,
}: ActionCenterProps) {
  const displayedActions = actions.slice(0, maxItems);
  const hasMore = actions.length > maxItems;

  const handleItemClick = (action: ActionItem) => {
    if (action.link) {
      window.location.href = action.link;
    }
  };

  return (
    <Card className={cn("bg-card border-border", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            Action Center
            {actions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {actions.length}
              </Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-lg border border-border"
              >
                <div className="space-y-2">
                  <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                  <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                  <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : actions.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-3">>
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              All caught up!
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              No pending actions at this time
            </p>
          </div>
        ) : (
          <ScrollArea className="h-auto max-h-[400px]">
            <AnimatePresence mode="popLayout">
              <div className="space-y-3">
                {displayedActions.map((action, index) => {
                  const Icon = actionTypeIcons[action.actionType];
                  const priorityStyle = priorityStyles[action.priority];

                  return (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "group relative p-4 rounded-lg border-l-4 bg-muted/30",
                        "border-t border-r border-b border-border",
                        priorityStyle.border,
                        action.link && "cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800",
                        "transition-all duration-200"
                      )}
                      onClick={() => handleItemClick(action)}
                      role={action.link ? "button" : undefined}
                      tabIndex={action.link ? 0 : undefined}
                      onKeyDown={
                        action.link
                          ? (e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleItemClick(action);
                              }
                            }
                          : undefined
                      }
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {action.title}
                            </h4>
                            {onDismiss && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDismiss(action.id);
                                }}
                                className="flex-shrink-0 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                aria-label="Dismiss action"
                              >
                                <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              </button>
                            )}
                          </div>

                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            {action.description}
                          </p>

                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={cn("text-xs", priorityStyle.badge)}>
                              {action.priority.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {actionTypeLabels[action.actionType]}
                            </Badge>
                            {action.timestamp && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(action.timestamp).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        {action.link && (
                          <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-600 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>

            {showViewAll && hasMore && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
              >
                <a
                  href={viewAllLink}
                  className="block w-full text-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  View All {actions.length} Actions
                </a>
              </motion.div>
            )}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * ActionCenter Skeleton Loader
 */
export function ActionCenterSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("bg-card border-border", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-lg border border-border"
            >
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
