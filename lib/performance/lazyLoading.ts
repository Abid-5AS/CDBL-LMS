/**
 * Lazy Loading Utilities
 *
 * Tools for implementing lazy loading and code splitting strategies
 */

import { recordCustomMetric } from "./metrics";

/**
 * Dynamic import result
 */
export interface DynamicImportResult<T = any> {
  module: T;
  loadTime: number;
  size?: number;
  cached: boolean;
}

/**
 * Chunk loading strategy
 */
export type ChunkLoadStrategy = "eager" | "lazy" | "on-visibility" | "on-interaction";

/**
 * Track dynamic imports
 */
const importCache = new Map<string, DynamicImportResult>();
const importMetrics = new Map<string, { count: number; totalTime: number }>();

/**
 * Dynamically import a module with tracking
 *
 * Measures and records import performance
 */
export async function dynamicImport<T = any>(
  importFn: () => Promise<T>,
  moduleName: string,
  cache = true
): Promise<DynamicImportResult<T>> {
  const startTime = performance.now();

  // Check cache
  if (cache && importCache.has(moduleName)) {
    return {
      ...importCache.get(moduleName)!,
      cached: true,
    };
  }

  try {
    const module = await importFn();
    const loadTime = performance.now() - startTime;

    const result: DynamicImportResult<T> = {
      module,
      loadTime,
      cached: false,
    };

    // Cache result
    if (cache) {
      importCache.set(moduleName, result);
    }

    // Track metrics
    recordImportMetric(moduleName, loadTime);

    // Record as custom metric
    recordCustomMetric("Dynamic Import Time", loadTime, "ms", {
      type: "lazy-load",
      module: moduleName,
    });

    return result;
  } catch (error) {
    console.error(`Failed to dynamically import ${moduleName}:`, error);
    throw error;
  }
}

/**
 * Track import metrics
 */
function recordImportMetric(moduleName: string, loadTime: number): void {
  const existing = importMetrics.get(moduleName);
  if (existing) {
    existing.count++;
    existing.totalTime += loadTime;
  } else {
    importMetrics.set(moduleName, { count: 1, totalTime: loadTime });
  }
}

/**
 * Get import metrics
 */
export function getImportMetrics(): Record<string, { count: number; avgTime: number }> {
  const result: Record<string, { count: number; avgTime: number }> = {};

  importMetrics.forEach((value, key) => {
    result[key] = {
      count: value.count,
      avgTime: value.totalTime / value.count,
    };
  });

  return result;
}

/**
 * Clear import cache
 */
export function clearImportCache(moduleName?: string): void {
  if (moduleName) {
    importCache.delete(moduleName);
  } else {
    importCache.clear();
  }
}

/**
 * Lazy load component on visibility
 *
 * Loads component when it becomes visible in viewport
 */
export function useIntersectionObserver(
  elementRef: React.RefObject<HTMLElement>,
  onVisible: () => void,
  options: IntersectionObserverInit = { threshold: 0.1 }
): void {
  if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        onVisible();
        observer.unobserve(entry.target);
      }
    });
  }, options);

  if (elementRef.current) {
    observer.observe(elementRef.current);
  }
}

/**
 * Route-based code splitting helper
 *
 * Preload chunks for anticipated routes
 */
export async function preloadRoute(
  routePath: string,
  importFn: () => Promise<any>
): Promise<void> {
  try {
    await dynamicImport(importFn, `route:${routePath}`);
  } catch (error) {
    console.warn(`Failed to preload route ${routePath}:`, error);
  }
}

/**
 * Prefetch routes based on user behavior
 */
export function createRoutePrefetcher(
  routeMap: Record<string, () => Promise<any>>
) {
  const prefetchedRoutes = new Set<string>();

  return {
    prefetch: async (route: string) => {
      if (prefetchedRoutes.has(route) || !routeMap[route]) {
        return;
      }

      try {
        await preloadRoute(route, routeMap[route]);
        prefetchedRoutes.add(route);
      } catch (error) {
        console.error(`Failed to prefetch route ${route}:`, error);
      }
    },

    isPrefetched: (route: string) => prefetchedRoutes.has(route),

    getPrefetchedRoutes: () => Array.from(prefetchedRoutes),
  };
}

/**
 * Component lazy loading configuration
 */
export interface LazyComponentConfig {
  /** Fallback component while loading */
  fallback?: React.ReactNode;

  /** Delay before showing fallback (ms) */
  delay?: number;

  /** Preload component */
  preload?: boolean;

  /** Loading strategy */
  strategy?: ChunkLoadStrategy;
}

/**
 * Track component lazy load performance
 */
export function recordComponentLazyLoad(
  componentName: string,
  loadTime: number,
  strategy: ChunkLoadStrategy = "lazy"
): void {
  recordCustomMetric("Component Lazy Load Time", loadTime, "ms", {
    type: "component-lazy-load",
    component: componentName,
    strategy,
  });
}

/**
 * Estimate code splitting opportunities
 *
 * Returns recommendations for code splitting
 */
export function analyzeCodeSplittingOpportunities(): {
  routes: string[];
  modals: string[];
  heavyComponents: string[];
  recommendations: string[];
} {
  const recommendations: string[] = [
    "Split code by route: use React.lazy for route components",
    "Load modals on-demand: lazy load modal components",
    "Defer non-critical components: use intersection observer for below-fold content",
    "Split vendor code: separate vendor dependencies from application code",
    "Use dynamic imports: import(path) for conditional code loading",
    "Monitor chunk sizes: keep chunks under 250KB for optimal loading",
  ];

  return {
    routes: [
      "Dashboard",
      "LeaveRequests",
      "UserManagement",
      "Reports",
      "Settings",
    ],
    modals: [
      "LeaveApprovalModal",
      "ConfirmationDialog",
      "DetailViewModal",
    ],
    heavyComponents: [
      "DataTable",
      "ChartComponent",
      "ReportBuilder",
    ],
    recommendations,
  };
}

/**
 * Preload critical resources
 */
export function preloadCriticalResources(
  resources: Array<{
    url: string;
    type: "script" | "style" | "font" | "image";
  }>
): void {
  if (typeof window === "undefined" || !document) {
    return;
  }

  resources.forEach((resource) => {
    const link = document.createElement("link");
    link.rel = "preload";

    switch (resource.type) {
      case "script":
        link.as = "script";
        break;
      case "style":
        link.as = "style";
        break;
      case "font":
        link.as = "font";
        link.crossOrigin = "anonymous";
        break;
      case "image":
        link.as = "image";
        break;
    }

    link.href = resource.url;
    document.head.appendChild(link);
  });
}

/**
 * Prefetch resources
 */
export function prefetchResources(urls: string[]): void {
  if (typeof window === "undefined" || !document) {
    return;
  }

  urls.forEach((url) => {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Get lazy loading summary
 */
export function getLazyLoadingSummary(): string {
  const metrics = getImportMetrics();
  const opportunities = analyzeCodeSplittingOpportunities();

  let summary = `Lazy Loading & Code Splitting Summary\n`;
  summary += `====================================\n\n`;

  if (Object.keys(metrics).length > 0) {
    summary += `Loaded Modules:\n`;
    Object.entries(metrics).forEach(([module, data]) => {
      summary += `  ${module}: ${data.count} loads, ${data.avgTime.toFixed(2)}ms avg\n`;
    });
    summary += "\n";
  }

  summary += `Code Splitting Opportunities:\n`;
  summary += `  Routes: ${opportunities.routes.length} suggested\n`;
  summary += `  Modals: ${opportunities.modals.length} suggested\n`;
  summary += `  Heavy Components: ${opportunities.heavyComponents.length} identified\n\n`;

  summary += `Recommendations:\n`;
  opportunities.recommendations.forEach((rec) => {
    summary += `  - ${rec}\n`;
  });

  return summary;
}
