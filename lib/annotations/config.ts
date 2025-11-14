/**
 * Annotation & Guide Configuration
 *
 * Centralized system to manage which annotations, guides, and documentation
 * features are enabled/disabled without modifying code
 */

export type AnnotationType =
  | "accessibility"
  | "performance"
  | "security"
  | "deployment"
  | "testing"
  | "logging"
  | "error-handling"
  | "color-system"
  | "keyboard-nav"
  | "screen-reader"
  | "wcag-compliance";

export interface AnnotationConfig {
  enabled: boolean;
  title: string;
  description: string;
  icon: string;
  category: "accessibility" | "performance" | "security" | "deployment" | "quality";
  phase: number;
  documentPath?: string;
  inlineHelp: boolean;
}

export type AnnotationsState = {
  [key in AnnotationType]: AnnotationConfig;
};

/**
 * Default configuration for all annotations
 * Toggle enabled/disabled here without code changes
 */
export const DEFAULT_ANNOTATIONS: AnnotationsState = {
  accessibility: {
    enabled: true,
    title: "Accessibility Auditing",
    description: "WCAG 2.1 AA compliance checks and screen reader support",
    icon: "accessibility",
    category: "accessibility",
    phase: 6,
    documentPath: "/docs/ACCESSIBILITY_GUIDE.md",
    inlineHelp: true,
  },
  "wcag-compliance": {
    enabled: true,
    title: "WCAG Compliance",
    description: "Web Content Accessibility Guidelines level AA validation",
    icon: "check-circle",
    category: "accessibility",
    phase: 6,
    inlineHelp: false,
  },
  "keyboard-nav": {
    enabled: true,
    title: "Keyboard Navigation",
    description: "Full keyboard support and focus management",
    icon: "keyboard",
    category: "accessibility",
    phase: 6,
    inlineHelp: true,
  },
  "screen-reader": {
    enabled: true,
    title: "Screen Reader Support",
    description: "ARIA labels, live regions, and announcements",
    icon: "speaker",
    category: "accessibility",
    phase: 6,
    inlineHelp: true,
  },
  performance: {
    enabled: true,
    title: "Performance Optimization",
    description: "Web Vitals tracking, caching strategies, and optimization",
    icon: "zap",
    category: "performance",
    phase: 5,
    documentPath: "/docs/PERFORMANCE_GUIDE.md",
    inlineHelp: true,
  },
  security: {
    enabled: true,
    title: "Security Validation",
    description: "Input validation, XSS/SQL injection detection, CSRF protection",
    icon: "shield",
    category: "security",
    phase: 8,
    inlineHelp: false,
  },
  deployment: {
    enabled: true,
    title: "Deployment Configuration",
    description: "Docker, environment setup, production-ready configuration",
    icon: "cloud",
    category: "deployment",
    phase: 8,
    documentPath: "/docs/DEPLOYMENT_GUIDE.md",
    inlineHelp: true,
  },
  testing: {
    enabled: true,
    title: "Testing Utilities",
    description: "Jest setup, React Testing Library, mock data generation",
    icon: "check-square",
    category: "quality",
    phase: 8,
    inlineHelp: false,
  },
  logging: {
    enabled: true,
    title: "Structured Logging",
    description: "Centralized logging with local/remote transmission",
    icon: "log",
    category: "quality",
    phase: 8,
    inlineHelp: true,
  },
  "error-handling": {
    enabled: true,
    title: "Error Boundaries",
    description: "React error boundaries with recovery actions and logging",
    icon: "alert-circle",
    category: "quality",
    phase: 3,
    inlineHelp: true,
  },
  "color-system": {
    enabled: true,
    title: "Color System",
    description: "Semantic colors with WCAG contrast validation",
    icon: "palette",
    category: "accessibility",
    phase: 4,
    inlineHelp: false,
  },
};

/**
 * Get current annotations configuration from localStorage or defaults
 */
export function getAnnotationsConfig(): AnnotationsState {
  if (typeof window === "undefined") {
    return DEFAULT_ANNOTATIONS;
  }

  try {
    const stored = localStorage.getItem("annotations_config");
    if (stored) {
      return { ...DEFAULT_ANNOTATIONS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.warn("Failed to load annotations config from localStorage", error);
  }

  return DEFAULT_ANNOTATIONS;
}

/**
 * Save annotations configuration to localStorage
 */
export function saveAnnotationsConfig(config: AnnotationsState): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem("annotations_config", JSON.stringify(config));
  } catch (error) {
    console.warn("Failed to save annotations config to localStorage", error);
  }
}

/**
 * Check if a specific annotation is enabled
 */
export function isAnnotationEnabled(type: AnnotationType): boolean {
  const config = getAnnotationsConfig();
  return config[type]?.enabled ?? DEFAULT_ANNOTATIONS[type]?.enabled ?? false;
}

/**
 * Toggle a specific annotation
 */
export function toggleAnnotation(type: AnnotationType): void {
  const config = getAnnotationsConfig();
  if (config[type]) {
    config[type].enabled = !config[type].enabled;
    saveAnnotationsConfig(config);

    // Dispatch custom event for components to listen
    window.dispatchEvent(
      new CustomEvent("annotations-changed", { detail: { type, enabled: config[type].enabled } })
    );
  }
}

/**
 * Get all enabled annotations
 */
export function getEnabledAnnotations(): AnnotationType[] {
  const config = getAnnotationsConfig();
  return (Object.keys(config) as AnnotationType[]).filter(
    (type) => config[type]?.enabled
  );
}

/**
 * Get annotations by category
 */
export function getAnnotationsByCategory(
  category: AnnotationConfig["category"]
): AnnotationType[] {
  const config = getAnnotationsConfig();
  return (Object.keys(config) as AnnotationType[]).filter(
    (type) => config[type]?.category === category && config[type]?.enabled
  );
}

/**
 * Reset all annotations to defaults
 */
export function resetAnnotationsConfig(): void {
  saveAnnotationsConfig(DEFAULT_ANNOTATIONS);
  window.dispatchEvent(new CustomEvent("annotations-reset"));
}

/**
 * Toggle all annotations on/off
 */
export function toggleAllAnnotations(enabled: boolean): void {
  const config = getAnnotationsConfig();
  Object.keys(config).forEach((key) => {
    config[key as AnnotationType].enabled = enabled;
  });
  saveAnnotationsConfig(config);
  window.dispatchEvent(new CustomEvent("annotations-changed", { detail: { all: true, enabled } }));
}

/**
 * Get statistics about annotations
 */
export function getAnnotationsStats() {
  const config = getAnnotationsConfig();
  const total = Object.keys(config).length;
  const enabled = getEnabledAnnotations().length;

  const byCategory = {
    accessibility: getAnnotationsByCategory("accessibility").length,
    performance: getAnnotationsByCategory("performance").length,
    security: getAnnotationsByCategory("security").length,
    deployment: getAnnotationsByCategory("deployment").length,
    quality: getAnnotationsByCategory("quality").length,
  };

  return {
    total,
    enabled,
    disabled: total - enabled,
    byCategory,
  };
}
