/**
 * Performance Configuration Constants
 *
 * Defines performance targets, thresholds, and configuration
 */

/**
 * Core Web Vitals targets (ms)
 * Based on Google Core Web Vitals standards
 */
export const WEB_VITALS_TARGETS = {
  /** Largest Contentful Paint - target < 2.5s */
  LCP: 2500,

  /** First Input Delay - target < 100ms */
  FID: 100,

  /** Cumulative Layout Shift - target < 0.1 */
  CLS: 0.1,

  /** First Contentful Paint - target < 1.8s */
  FCP: 1800,

  /** Time to First Byte - target < 600ms */
  TTFB: 600,

  /** Time to Interactive - target < 3.8s */
  TTI: 3800,
} as const;

/**
 * Performance thresholds for warnings
 * Used to trigger performance warnings in development
 */
export const PERFORMANCE_THRESHOLDS = {
  /** Component render time warning threshold (ms) */
  componentRender: 16, // 16ms = 60fps

  /** Component render time error threshold (ms) */
  componentRenderError: 100,

  /** API response time warning (ms) */
  apiResponseWarning: 500,

  /** API response time error (ms) */
  apiResponseError: 2000,

  /** Image load time warning (ms) */
  imageLoadWarning: 1000,

  /** Image load time error (ms) */
  imageLoadError: 3000,

  /** Bundle size warning (bytes) */
  bundleSizeWarning: 150000, // 150KB

  /** Bundle size error (bytes) */
  bundleSizeError: 250000, // 250KB

  /** Memory usage warning (MB) - Reduced for memory-constrained systems */
  memoryWarning: 50,

  /** Memory usage error (MB) - Reduced for memory-constrained systems */
  memoryError: 100,
} as const;

/**
 * Caching configuration optimized for memory usage
 */
export const CACHE_CONFIG = {
  /** Default TTL for cache entries (ms) - Reduced for memory efficiency */
  defaultTTL: 2 * 60 * 1000, // 2 minutes

  /** TTL for short-term cache (ms) */
  shortTTL: 30 * 1000, // 30 seconds

  /** TTL for long-term cache (ms) */
  longTTL: 15 * 60 * 1000, // 15 minutes

  /** TTL for API cache (ms) */
  apiTTL: 2 * 60 * 1000, // 2 minutes

  /** TTL for user data cache (ms) */
  userDataTTL: 5 * 60 * 1000, // 5 minutes

  /** Maximum cache entries - Reduced for memory efficiency */
  maxEntries: 50,

  /** Whether to use localStorage for persistence */
  persistent: false, // Changed to false to reduce memory usage

  /** Maximum localStorage size (bytes) */
  maxStorageSize: 2 * 1024 * 1024, // 2MB - Reduced from 5MB
} as const;

/**
 * API optimization configuration
 */
export const API_CONFIG = {
  /** Enable request deduplication */
  deduplication: true,

  /** Deduplication timeout (ms) */
  deduplicationTimeout: 100,

  /** Enable request batching */
  batching: true,

  /** Batch timeout (ms) */
  batchTimeout: 50,

  /** Maximum batch size */
  maxBatchSize: 5, // Reduced from 10 for memory efficiency

  /** Enable prefetching - Disabled in development for memory efficiency */
  prefetching: process.env.NODE_ENV === "production",

  /** Request timeout (ms) */
  timeout: 30000,

  /** Retry attempts for failed requests */
  retryAttempts: 2, // Reduced from 3 for memory efficiency

  /** Initial retry delay (ms) */
  retryDelay: 1000,
} as const;

/**
 * Image optimization configuration
 */
export const IMAGE_CONFIG = {
  /** Enable lazy loading */
  lazyLoading: true,

  /** Intersection observer options */
  observerOptions: {
    root: null,
    rootMargin: "100px", // Increased from 50px for better performance
    threshold: 0.01,
  },

  /** Supported image formats (in order of preference) */
  formats: ["webp", "jpeg"] as const, // Removed avif to reduce processing

  /** Responsive image sizes (px) */
  sizes: [320, 768, 1024, 1920] as const, // Reduced number of sizes

  /** LQIP blur radius (px) */
  lqipBlur: 10,

  /** LQIP quality (0-100) */
  lqipQuality: 10,

  /** Enable blur-up effect */
  blurUp: false, // Disabled to reduce memory usage

  /** Blur-up transition duration (ms) */
  blurUpDuration: 300,
} as const;

/**
 * Bundle configuration
 */
export const BUNDLE_CONFIG = {
  /** Maximum initial bundle size (bytes) */
  maxInitialSize: 75000, // 75KB - Reduced from 100KB

  /** Maximum route bundle size (bytes) */
  maxRouteSize: 35000, // 35KB - Reduced from 50KB

  /** Chunks to exclude from analysis */
  excludeChunks: [
    "vendor",
    "common",
    "styles",
  ],

  /** Enable tree-shaking */
  treeShaking: true,

  /** Gzip compression threshold (bytes) */
  gzipThreshold: 1024,
} as const;

/**
 * Monitoring configuration - optimized for memory constrained systems
 * but maintaining essential development feedback
 */
export const MONITORING_CONFIG = {
  /** Enable performance monitoring - now enabled in development too */
  enabled: true, // Now enabled in development for feedback but optimized

  /** Report metrics in development - now enabled */
  reportInDevelopment: true, // Now enabled to provide development feedback

  /** Report metrics in production */
  reportInProduction: true,

  /** Metrics reporting endpoint */
  reportingEndpoint: "/api/metrics",

  /** Batch metrics before sending */
  batchMetrics: true,

  /** Metrics batch interval (ms) - Increased for memory efficiency */
  batchInterval: 60000, // 60 seconds - Increased from 30

  /** Maximum metrics to batch */
  maxBatchSize: 25, // Reduced from 50 for memory efficiency

  /** Enable Web Vitals tracking - now enabled in development */
  trackWebVitals: true, // Now enabled in development for performance feedback

  /** Enable custom metrics tracking - now enabled in development */
  trackCustomMetrics: true, // Now enabled in development for feedback

  /** Enable performance profiling - Only in development when needed */
  profiling: process.env.PERFORMANCE_PROFILING === "true" && process.env.NODE_ENV === "development",
} as const;

/**
 * Development warnings configuration - optimized for memory constrained systems
 * but keeping important developer feedback
 */
export const DEV_WARNINGS = {
  /** Warn on slow renders */
  slowRenders: true, // Kept enabled for performance feedback

  /** Warn on slow API calls */
  slowApis: true, // Kept enabled for performance feedback

  /** Warn on slow images */
  slowImages: true, // Kept enabled for performance feedback

  /** Warn on bundle size */
  bundleSize: true, // Kept enabled for performance feedback

  /** Warn on memory issues */
  memory: true, // Kept enabled for memory feedback

  /** Show warnings in console */
  console: true, // Kept enabled for developer feedback

  /** Show warnings as overlays */
  overlay: false, // Kept disabled to reduce memory usage but can be enabled when needed
} as const;

/**
 * Get performance target for a metric
 * @param metric - Metric name
 * @returns Target value in milliseconds
 */
export function getWebVitalsTarget(
  metric: keyof typeof WEB_VITALS_TARGETS
): number {
  return WEB_VITALS_TARGETS[metric];
}

/**
 * Check if metric is within target
 * @param metric - Metric name
 * @param value - Actual value
 * @returns true if within target
 */
export function isWithinTarget(
  metric: keyof typeof WEB_VITALS_TARGETS,
  value: number
): boolean {
  const target = getWebVitalsTarget(metric);
  return value <= target;
}

/**
 * Get performance status
 * @param metric - Metric name
 * @param value - Actual value
 * @returns "good" | "needs-improvement" | "poor"
 */
export function getPerformanceStatus(
  metric: keyof typeof WEB_VITALS_TARGETS,
  value: number
): "good" | "needs-improvement" | "poor" {
  const target = getWebVitalsTarget(metric);
  const threshold = target * 1.25; // 25% above target

  if (value <= target) return "good";
  if (value <= threshold) return "needs-improvement";
  return "poor";
}