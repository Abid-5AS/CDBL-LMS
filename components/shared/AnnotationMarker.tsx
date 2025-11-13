"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Info,
  Code,
  Database,
  Workflow,
  FileCode,
  Link as LinkIcon,
  Tag,
  ExternalLink,
} from "lucide-react";
import { useAnnotationMode } from "@/components/providers/AnnotationModeProvider";
import type { Annotation, AnnotationType } from "@/types/annotations";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface AnnotationMarkerProps {
  annotation: Annotation;
  children?: React.ReactNode;
}

const TYPE_ICONS: Record<AnnotationType, React.ElementType> = {
  component: Code,
  api: ExternalLink,
  hook: FileCode,
  service: Workflow,
  utility: FileCode,
  database: Database,
  workflow: Workflow,
};

const TYPE_COLORS: Record<AnnotationType, string> = {
  component: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  api: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  hook: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  service: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  utility: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20",
  database: "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20",
  workflow: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
};

export function AnnotationMarker({ annotation, children }: AnnotationMarkerProps) {
  const { config, isEnabled } = useAnnotationMode();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Don't render if annotation mode is disabled
  if (!isEnabled) {
    return <>{children}</>;
  }

  // Filter based on config
  const isVisible =
    config.visibleTypes.includes(annotation.type) &&
    config.visibleCategories.includes(annotation.category);

  if (!isVisible) {
    return <>{children}</>;
  }

  // Determine if annotation should be shown
  const shouldShowAnnotation =
    config.showMode === "always" ||
    (config.showMode === "hover" && isHovered) ||
    (config.showMode === "click" && isExpanded);

  const Icon = TYPE_ICONS[annotation.type];
  const colorClass = TYPE_COLORS[annotation.type];

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        if (config.showMode === "hover") {
          setIsExpanded(false);
        }
      }}
      onClick={() => {
        if (config.showMode === "click") {
          setIsExpanded(!isExpanded);
        }
      }}
    >
      {/* Original Content */}
      <div className={isEnabled ? "ring-2 ring-primary/20 ring-offset-2 rounded-lg" : ""}>
        {children}
      </div>

      {/* Annotation Indicator */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`
          absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center
          ${colorClass} border shadow-sm cursor-pointer z-10
        `}
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
      >
        <Icon className="h-3 w-3" />
      </motion.div>

      {/* Annotation Tooltip/Card */}
      <AnimatePresence>
        {shouldShowAnnotation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full mt-2 left-0 w-96"
            style={{ opacity: config.opacity || 0.9 }}
          >
            <Card className="p-4 shadow-xl border-2 border-primary/20 bg-background/98 backdrop-blur-sm">
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className={`p-2 rounded-lg ${colorClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{annotation.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {annotation.filePath}
                    {annotation.lineNumber && `:${annotation.lineNumber}`}
                  </p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-foreground/90 mb-3">{annotation.description}</p>

              <Separator className="my-3" />

              {/* Details Grid */}
              <div className="space-y-3 text-xs">
                {/* Type & Category */}
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="capitalize">
                    {annotation.type}
                  </Badge>
                  <Badge variant="secondary" className="capitalize">
                    {annotation.category.replace("-", " ")}
                  </Badge>
                </div>

                {/* API Endpoints */}
                {annotation.apiEndpoints && annotation.apiEndpoints.length > 0 && (
                  <div>
                    <div className="font-medium text-muted-foreground flex items-center gap-1 mb-1">
                      <ExternalLink className="h-3 w-3" />
                      API Endpoints:
                    </div>
                    <div className="space-y-1">
                      {annotation.apiEndpoints.map((endpoint, idx) => (
                        <code
                          key={idx}
                          className="block text-xs bg-muted px-2 py-1 rounded font-mono"
                        >
                          {endpoint}
                        </code>
                      ))}
                    </div>
                  </div>
                )}

                {/* Database Models */}
                {annotation.dbModels && annotation.dbModels.length > 0 && (
                  <div>
                    <div className="font-medium text-muted-foreground flex items-center gap-1 mb-1">
                      <Database className="h-3 w-3" />
                      Database Models:
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {annotation.dbModels.map((model, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {model}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Functions */}
                {annotation.keyFunctions && annotation.keyFunctions.length > 0 && (
                  <div>
                    <div className="font-medium text-muted-foreground flex items-center gap-1 mb-1">
                      <FileCode className="h-3 w-3" />
                      Key Functions:
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {annotation.keyFunctions.map((func, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs font-mono">
                          {func}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Workflow */}
                {annotation.workflow && (
                  <div>
                    <div className="font-medium text-muted-foreground flex items-center gap-1 mb-1">
                      <Workflow className="h-3 w-3" />
                      Workflow:
                    </div>
                    <p className="text-sm text-foreground/80">{annotation.workflow}</p>
                  </div>
                )}

                {/* Data Flow */}
                {annotation.dataFlow && (
                  <div>
                    <div className="font-medium text-muted-foreground flex items-center gap-1 mb-1">
                      <Info className="h-3 w-3" />
                      Data Flow:
                    </div>
                    <p className="text-sm text-foreground/80">{annotation.dataFlow}</p>
                  </div>
                )}

                {/* Related Files */}
                {annotation.relatedFiles && annotation.relatedFiles.length > 0 && (
                  <div>
                    <div className="font-medium text-muted-foreground flex items-center gap-1 mb-1">
                      <LinkIcon className="h-3 w-3" />
                      Related Files:
                    </div>
                    <div className="space-y-1">
                      {annotation.relatedFiles.map((file, idx) => (
                        <div key={idx} className="text-xs text-muted-foreground font-mono">
                          {file}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {annotation.notes && annotation.notes.length > 0 && (
                  <div>
                    <div className="font-medium text-muted-foreground flex items-center gap-1 mb-1">
                      <Info className="h-3 w-3" />
                      Notes:
                    </div>
                    <ul className="list-disc list-inside space-y-1">
                      {annotation.notes.map((note, idx) => (
                        <li key={idx} className="text-sm text-foreground/80">
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tags */}
                {annotation.tags && annotation.tags.length > 0 && (
                  <div>
                    <div className="font-medium text-muted-foreground flex items-center gap-1 mb-1">
                      <Tag className="h-3 w-3" />
                      Tags:
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {annotation.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
