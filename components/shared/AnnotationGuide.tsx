"use client";

import { useAnnotationEnabled } from "@/hooks/useAnnotations";
import { AnnotationType } from "@/lib/annotations/config";
import { AlertCircle, Info, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * AnnotationGuide Component
 *
 * Display inline annotations and guidance based on toggle settings
 * Useful for showing contextual help without modifying component code
 */

interface AnnotationGuideProps {
  type: AnnotationType;
  title: string;
  content: React.ReactNode;
  variant?: "info" | "tip" | "warning" | "guide";
  className?: string;
}

export function AnnotationGuide({
  type,
  title,
  content,
  variant = "info",
  className,
}: AnnotationGuideProps) {
  const isEnabled = useAnnotationEnabled(type);

  if (!isEnabled) return null;

  const icons = {
    info: <Info className="w-4 h-4" />,
    tip: <BookOpen className="w-4 h-4" />,
    warning: <AlertCircle className="w-4 h-4" />,
    guide: <BookOpen className="w-4 h-4" />,
  };

  const styles = {
    info: "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800",
    tip: "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800",
    warning: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800",
    guide: "bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800",
  };

  const textStyles = {
    info: "text-blue-900 dark:text-blue-200",
    tip: "text-green-900 dark:text-green-200",
    warning: "text-yellow-900 dark:text-yellow-200",
    guide: "text-purple-900 dark:text-purple-200",
  };

  const titleStyles = {
    info: "text-blue-800 dark:text-blue-300",
    tip: "text-green-800 dark:text-green-300",
    warning: "text-yellow-800 dark:text-yellow-300",
    guide: "text-purple-800 dark:text-purple-300",
  };

  return (
    <div className={cn(
      "rounded-lg border p-4 space-y-2",
      styles[variant],
      className
    )}>
      <div className="flex items-start gap-2">
        <div className={cn("mt-0.5", textStyles[variant])}>
          {icons[variant]}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={cn("font-semibold text-sm", titleStyles[variant])}>
            {title}
          </h4>
          <div className={cn("text-sm mt-1 space-y-1", textStyles[variant])}>
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * AccessibilityGuide Component
 * Shortcut for accessibility annotations
 */
export function AccessibilityGuide({
  title,
  content,
  className,
}: Omit<AnnotationGuideProps, "type" | "variant">) {
  return (
    <AnnotationGuide
      type="accessibility"
      title={title}
      content={content}
      variant="info"
      className={className}
    />
  );
}

/**
 * PerformanceGuide Component
 * Shortcut for performance annotations
 */
export function PerformanceGuide({
  title,
  content,
  className,
}: Omit<AnnotationGuideProps, "type" | "variant">) {
  return (
    <AnnotationGuide
      type="performance"
      title={title}
      content={content}
      variant="tip"
      className={className}
    />
  );
}

/**
 * SecurityGuide Component
 * Shortcut for security annotations
 */
export function SecurityGuide({
  title,
  content,
  className,
}: Omit<AnnotationGuideProps, "type" | "variant">) {
  return (
    <AnnotationGuide
      type="security"
      title={title}
      content={content}
      variant="warning"
      className={className}
    />
  );
}

/**
 * KeyboardNavGuide Component
 * Shortcut for keyboard navigation annotations
 */
export function KeyboardNavGuide({
  title,
  content,
  className,
}: Omit<AnnotationGuideProps, "type" | "variant">) {
  return (
    <AnnotationGuide
      type="keyboard-nav"
      title={title}
      content={content}
      variant="guide"
      className={className}
    />
  );
}
