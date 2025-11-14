"use client";

import { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  Info,
  TrendingUp,
  BarChart3,
  Users,
  Calendar,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { cn } from "@/lib/utils";

type ExpandableCardProps = {
  title: string;
  subtitle?: string;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  icon?: React.ComponentType<{ className?: string }>;
  children: ReactNode;
  expandedContent?: ReactNode;
  defaultExpanded?: boolean;
  className?: string;
  headerActions?: ReactNode;
};

type TabbedContentProps = {
  title: string;
  subtitle?: string;
  tabs: Array<{
    id: string;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    content: ReactNode;
    badge?: string;
  }>;
  defaultTab?: string;
  className?: string;
  headerActions?: ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
};

type CollapsibleSectionProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  variant?: "default" | "outlined" | "minimal";
};

type DataDrillDownProps = {
  title: string;
  summary: ReactNode;
  details: Array<{
    id: string;
    title: string;
    content: ReactNode;
    metadata?: {
      count?: number;
      status?: "success" | "warning" | "error" | "info";
      lastUpdated?: string;
    };
  }>;
  className?: string;
};

/**
 * Expandable Card Component
 *
 * Provides a card that can expand to show additional content,
 * perfect for progressive disclosure of detailed information.
 */
export function ExpandableCard({
  title,
  subtitle,
  badge,
  icon: Icon,
  children,
  expandedContent,
  defaultExpanded = false,
  className,
  headerActions,
}: ExpandableCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {Icon && (
              <div className="p-2 bg-muted/50 rounded-lg shrink-0">
                <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-base sm:text-lg truncate">
                  {title}
                </CardTitle>
                {badge && (
                  <Badge
                    variant={badge.variant || "secondary"}
                    className="text-xs"
                  >
                    {badge.text}
                  </Badge>
                )}
              </div>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {headerActions}
            {expandedContent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 h-auto"
                aria-label={isExpanded ? "Collapse" : "Expand"}
              >
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="size-4" aria-hidden="true" />
                </motion.div>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {children}

        <AnimatePresence>
          {isExpanded && expandedContent && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-border mt-4">
                {expandedContent}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

/**
 * Tabbed Content Component
 *
 * Organizes related content into tabs for better space utilization
 * and progressive disclosure of information.
 */
export function TabbedContent({
  title,
  subtitle,
  tabs,
  defaultTab,
  className,
  headerActions,
  value,
  onValueChange,
}: TabbedContentProps) {
  const defaultActiveTab = defaultTab || tabs[0]?.id;
  const [activeTab, setActiveTab] = useState<string | undefined>(
    value ?? defaultActiveTab
  );
  const resolvedActiveTab = activeTab ?? defaultActiveTab;

  useEffect(() => {
    if (value && value !== activeTab) {
      setActiveTab(value);
    }
  }, [value, activeTab]);

  const handleTabChange = (nextValue: string) => {
    setActiveTab(nextValue);
    onValueChange?.(nextValue);
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg mb-1">{title}</CardTitle>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {headerActions && <div className="shrink-0">{headerActions}</div>}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Tabs value={resolvedActiveTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 h-auto p-1">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-1.5 px-2 py-2 text-xs sm:text-sm data-[state=active]:bg-background"
                >
                  {TabIcon && <TabIcon className="size-3 sm:size-4" aria-hidden="true" />}
                  <span className="truncate">{tab.label}</span>
                  {tab.badge && (
                    <Badge variant="secondary" className="text-xs ml-1">
                      {tab.badge}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="mt-4">
            {tabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {tab.content}
                </motion.div>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}

/**
 * Collapsible Section Component
 *
 * Provides collapsible sections for organizing content hierarchically.
 */
export function CollapsibleSection({
  title,
  subtitle,
  children,
  defaultOpen = false,
  className,
  variant = "default",
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const containerClasses = cn(
    "space-y-3",
    variant === "outlined" && "border border-border rounded-lg p-4",
    variant === "minimal" && "border-l-2 border-muted pl-4",
    className
  );

  return (
    <div className={containerClasses}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start p-0 h-auto hover:bg-transparent"
          >
            <div className="flex items-center gap-2 w-full">
              <motion.div
                animate={{ rotate: isOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
              </motion.div>
              <div className="flex-1 text-left">
                <h3 className="text-sm font-medium text-foreground">{title}</h3>
                {subtitle && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="pl-6 pt-2"
          >
            {children}
          </motion.div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

/**
 * Data Drill-Down Component
 *
 * Provides a summary view with expandable details for data exploration.
 */
export function DataDrillDown({
  title,
  summary,
  details,
  className,
}: DataDrillDownProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const statusColors = {
    success: "text-green-600 dark:text-green-400",
    warning: "text-yellow-600 dark:text-yellow-400",
    error: "text-red-600 dark:text-red-400",
    info: "text-blue-600 dark:text-blue-400",
  };

  const statusIcons = {
    success: TrendingUp,
    warning: AlertCircle,
    error: AlertCircle,
    info: Info,
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="p-4 bg-muted/50 rounded-lg">{summary}</div>

        {/* Details */}
        <div className="space-y-2">
          {details.map((item) => {
            const isExpanded = expandedItems.has(item.id);
            const StatusIcon = item.metadata?.status
              ? statusIcons[item.metadata.status]
              : null;

            return (
              <div key={item.id} className="border border-border rounded-lg">
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full p-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight className="size-4 text-muted-foreground shrink-0" aria-hidden="true" />
                      </motion.div>
                      <span className="font-medium text-sm truncate">
                        {item.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.metadata?.count && (
                        <Badge variant="secondary" className="text-xs">
                          {item.metadata.count}
                        </Badge>
                      )}
                      {StatusIcon && item.metadata?.status && (
                        <StatusIcon
                          className={cn(
                            "w-4 h-4",
                            statusColors[item.metadata.status]
                          )}
                        />
                      )}
                    </div>
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 pt-0 border-t border-border">
                        {item.content}
                        {item.metadata?.lastUpdated && (
                          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                            <Clock className="size-3" aria-hidden="true" />
                            Last updated: {item.metadata.lastUpdated}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
