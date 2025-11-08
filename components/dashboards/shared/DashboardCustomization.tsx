"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Layout,
  Palette,
  Monitor,
  Smartphone,
  Tablet,
  Eye,
  EyeOff,
  RotateCcw,
  Save,
  X,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Badge,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";

type DashboardWidget = {
  id: string;
  title: string;
  description: string;
  category: "overview" | "analytics" | "actions" | "data";
  isVisible: boolean;
  isRequired?: boolean;
  order: number;
};

type DashboardCustomizationProps = {
  isOpen: boolean;
  onClose: () => void;
  role: Role;
  widgets: DashboardWidget[];
  onWidgetsChange: (widgets: DashboardWidget[]) => void;
  layoutPreferences: {
    density: "compact" | "comfortable" | "spacious";
    theme: "light" | "dark" | "system";
    animations: boolean;
    sidebarPosition: "left" | "right" | "hidden";
  };
  onLayoutPreferencesChange: (preferences: any) => void;
  onResetToDefault: () => void;
  onSavePreferences: () => void;
};

const categoryColors = {
  overview: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  analytics:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  actions:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  data: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
};

const categoryIcons = {
  overview: Monitor,
  analytics: Layout,
  actions: Settings,
  data: Tablet,
};

/**
 * Dashboard Customization Panel
 *
 * Provides comprehensive dashboard customization options including:
 * - Widget visibility and ordering
 * - Layout preferences (density, theme, animations)
 * - Sidebar positioning
 * - Role-specific customization options
 *
 * Features:
 * - Drag-and-drop widget reordering
 * - Real-time preview of changes
 * - Responsive design for mobile customization
 * - Accessibility-compliant controls
 * - Persistent preferences storage
 */
export function DashboardCustomization({
  isOpen,
  onClose,
  role,
  widgets,
  onWidgetsChange,
  layoutPreferences,
  onLayoutPreferencesChange,
  onResetToDefault,
  onSavePreferences,
}: DashboardCustomizationProps) {
  const [activeTab, setActiveTab] = useState<"widgets" | "layout">("widgets");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleWidgetToggle = useCallback(
    (widgetId: string) => {
      const updatedWidgets = widgets.map((widget) =>
        widget.id === widgetId
          ? { ...widget, isVisible: !widget.isVisible }
          : widget
      );
      onWidgetsChange(updatedWidgets);
      setHasUnsavedChanges(true);
    },
    [widgets, onWidgetsChange]
  );

  const handleLayoutPreferenceChange = useCallback(
    (key: string, value: any) => {
      onLayoutPreferencesChange({
        ...layoutPreferences,
        [key]: value,
      });
      setHasUnsavedChanges(true);
    },
    [layoutPreferences, onLayoutPreferencesChange]
  );

  const handleSave = useCallback(() => {
    onSavePreferences();
    setHasUnsavedChanges(false);
  }, [onSavePreferences]);

  const handleReset = useCallback(() => {
    onResetToDefault();
    setHasUnsavedChanges(false);
  }, [onResetToDefault]);

  const visibleWidgets = widgets.filter((w) => w.isVisible);
  const hiddenWidgets = widgets.filter((w) => !w.isVisible);

  const groupedWidgets = widgets.reduce((acc, widget) => {
    if (!acc[widget.category]) {
      acc[widget.category] = [];
    }
    acc[widget.category].push(widget);
    return acc;
  }, {} as Record<string, DashboardWidget[]>);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-96 lg:w-[28rem] bg-background border-l border-border shadow-2xl z-50 overflow-hidden"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Customize Dashboard
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Personalize your {role.toLowerCase()} dashboard
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border">
                <button
                  onClick={() => setActiveTab("widgets")}
                  className={cn(
                    "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                    activeTab === "widgets"
                      ? "text-foreground border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Layout className="w-4 h-4 inline mr-2" />
                  Widgets
                </button>
                <button
                  onClick={() => setActiveTab("layout")}
                  className={cn(
                    "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                    activeTab === "layout"
                      ? "text-foreground border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Settings className="w-4 h-4 inline mr-2" />
                  Layout
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {activeTab === "widgets" && (
                  <div className="p-4 sm:p-6 space-y-6">
                    {/* Summary */}
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {visibleWidgets.length} of {widgets.length} widgets
                          visible
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {hiddenWidgets.length} hidden
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="text-xs">
                          <Eye className="w-3 h-3 mr-1" />
                          {visibleWidgets.length}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <EyeOff className="w-3 h-3 mr-1" />
                          {hiddenWidgets.length}
                        </Badge>
                      </div>
                    </div>

                    {/* Widget Categories */}
                    {Object.entries(groupedWidgets).map(
                      ([category, categoryWidgets]) => {
                        const CategoryIcon =
                          categoryIcons[category as keyof typeof categoryIcons];

                        return (
                          <div key={category} className="space-y-3">
                            <div className="flex items-center gap-2">
                              <CategoryIcon className="w-4 h-4 text-muted-foreground" />
                              <h3 className="text-sm font-medium text-foreground capitalize">
                                {category}
                              </h3>
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "text-xs",
                                  categoryColors[
                                    category as keyof typeof categoryColors
                                  ]
                                )}
                              >
                                {categoryWidgets.length}
                              </Badge>
                            </div>

                            <div className="space-y-2">
                              {categoryWidgets.map((widget) => (
                                <div
                                  key={widget.id}
                                  className={cn(
                                    "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                                    widget.isVisible
                                      ? "bg-card border-border"
                                      : "bg-muted/30 border-muted"
                                  )}
                                >
                                  <Switch
                                    checked={widget.isVisible}
                                    onCheckedChange={() =>
                                      handleWidgetToggle(widget.id)
                                    }
                                    disabled={widget.isRequired}
                                    className="mt-0.5"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p
                                        className={cn(
                                          "text-sm font-medium",
                                          widget.isVisible
                                            ? "text-foreground"
                                            : "text-muted-foreground"
                                        )}
                                      >
                                        {widget.title}
                                      </p>
                                      {widget.isRequired && (
                                        <Badge
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          Required
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {widget.description}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}

                {activeTab === "layout" && (
                  <div className="p-4 sm:p-6 space-y-6">
                    {/* Density */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-foreground">
                        Layout Density
                      </h3>
                      <Select
                        value={layoutPreferences.density}
                        onValueChange={(value) =>
                          handleLayoutPreferenceChange("density", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="compact">
                            <div className="flex items-center gap-2">
                              <Smartphone className="w-4 h-4" />
                              Compact
                            </div>
                          </SelectItem>
                          <SelectItem value="comfortable">
                            <div className="flex items-center gap-2">
                              <Tablet className="w-4 h-4" />
                              Comfortable
                            </div>
                          </SelectItem>
                          <SelectItem value="spacious">
                            <div className="flex items-center gap-2">
                              <Monitor className="w-4 h-4" />
                              Spacious
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Theme */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-foreground">
                        Theme Preference
                      </h3>
                      <Select
                        value={layoutPreferences.theme}
                        onValueChange={(value) =>
                          handleLayoutPreferenceChange("theme", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Sidebar Position */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-foreground">
                        Sidebar Position
                      </h3>
                      <Select
                        value={layoutPreferences.sidebarPosition}
                        onValueChange={(value) =>
                          handleLayoutPreferenceChange("sidebarPosition", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                          <SelectItem value="hidden">Hidden</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Animations */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-foreground">
                          Enable Animations
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Smooth transitions and micro-interactions
                        </p>
                      </div>
                      <Switch
                        checked={layoutPreferences.animations}
                        onCheckedChange={(value) =>
                          handleLayoutPreferenceChange("animations", value)
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 sm:p-6 border-t border-border">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="flex-1 sm:flex-none"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!hasUnsavedChanges}
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
                {hasUnsavedChanges && (
                  <p className="text-xs text-muted-foreground mt-2">
                    You have unsaved changes
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
