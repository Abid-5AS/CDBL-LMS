"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code2,
  X,
  Settings,
  Eye,
  EyeOff,
  Filter,
  Info,
  Layers,
} from "lucide-react";
import { useAnnotationMode } from "@/components/providers/AnnotationModeProvider";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { AnnotationCategory, AnnotationType } from "@/types/annotations";

const CATEGORIES: Array<{ value: AnnotationCategory; label: string }> = [
  { value: "data-flow", label: "Data Flow" },
  { value: "user-action", label: "User Actions" },
  { value: "state-management", label: "State Management" },
  { value: "api-integration", label: "API Integration" },
  { value: "business-logic", label: "Business Logic" },
  { value: "ui-presentation", label: "UI Presentation" },
];

const TYPES: Array<{ value: AnnotationType; label: string }> = [
  { value: "component", label: "Components" },
  { value: "api", label: "API Routes" },
  { value: "hook", label: "Hooks" },
  { value: "service", label: "Services" },
  { value: "utility", label: "Utilities" },
  { value: "database", label: "Database" },
  { value: "workflow", label: "Workflows" },
];

export function AnnotationModeToggle() {
  const {
    isEnabled,
    toggle,
    config,
    setVisibleCategories,
    setVisibleTypes,
    setShowMode,
    reset,
  } = useAnnotationMode();

  const [settingsOpen, setSettingsOpen] = useState(false);

  // Only render in development mode
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const handleCategoryToggle = (category: AnnotationCategory) => {
    const current = config.visibleCategories;
    const updated = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category];
    setVisibleCategories(updated);
  };

  const handleTypeToggle = (type: AnnotationType) => {
    const current = config.visibleTypes;
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    setVisibleTypes(updated);
  };

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2"
      >
        {/* Settings Panel */}
        <AnimatePresence>
          {isEnabled && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shadow-lg bg-background/95 backdrop-blur-sm border-border"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-80 max-h-[600px] overflow-y-auto"
                >
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <Code2 className="h-4 w-4" />
                        Annotation Mode Settings
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Customize what annotations you want to see
                      </p>
                    </div>

                    <Separator />

                    {/* Show Mode */}
                    <div>
                      <Label className="text-sm font-medium">Display Mode</Label>
                      <div className="mt-2 space-y-2">
                        {["always", "hover", "click"].map((mode) => (
                          <div key={mode} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id={`mode-${mode}`}
                              checked={config.showMode === mode}
                              onChange={() => setShowMode(mode as any)}
                              className="h-4 w-4"
                            />
                            <Label htmlFor={`mode-${mode}`} className="text-sm capitalize">
                              {mode}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Categories */}
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Filter className="h-3.5 w-3.5" />
                        Categories
                      </Label>
                      <div className="mt-2 space-y-2">
                        {CATEGORIES.map(({ value, label }) => (
                          <div key={value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`cat-${value}`}
                              checked={config.visibleCategories.includes(value)}
                              onCheckedChange={() => handleCategoryToggle(value)}
                            />
                            <Label htmlFor={`cat-${value}`} className="text-sm">
                              {label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Types */}
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Layers className="h-3.5 w-3.5" />
                        Types
                      </Label>
                      <div className="mt-2 space-y-2">
                        {TYPES.map(({ value, label }) => (
                          <div key={value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`type-${value}`}
                              checked={config.visibleTypes.includes(value)}
                              onCheckedChange={() => handleTypeToggle(value)}
                            />
                            <Label htmlFor={`type-${value}`} className="text-sm">
                              {label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={reset} className="flex-1">
                        Reset
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setSettingsOpen(false)}
                        className="flex-1"
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Toggle Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={toggle}
              size="icon"
              className={`
                h-14 w-14 rounded-full shadow-lg transition-all duration-200
                ${
                  isEnabled
                    ? "bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    : "bg-background/95 backdrop-blur-sm border-2 border-border hover:border-primary"
                }
              `}
            >
              {isEnabled ? (
                <EyeOff className="h-6 w-6 text-white" />
              ) : (
                <Code2 className="h-6 w-6" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">
                {isEnabled ? "Hide" : "Show"} Developer Annotations
              </p>
              <p className="text-xs text-muted-foreground">
                Keyboard: {config.toggleShortcut?.toUpperCase()}
              </p>
              {isEnabled && (
                <Badge variant="secondary" className="mt-2">
                  <Eye className="h-3 w-3 mr-1" />
                  Annotation Mode Active
                </Badge>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Info Badge */}
        {isEnabled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-xs text-muted-foreground bg-background/95 backdrop-blur-sm border border-border rounded-full px-3 py-1.5 shadow-sm"
          >
            <Info className="h-3 w-3" />
            <span className="font-medium">
              {config.showMode === "always"
                ? "Showing all annotations"
                : config.showMode === "hover"
                ? "Hover to see annotations"
                : "Click to see annotations"}
            </span>
          </motion.div>
        )}
      </motion.div>
    </TooltipProvider>
  );
}
