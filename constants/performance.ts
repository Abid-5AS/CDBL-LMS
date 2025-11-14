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

  /** Memory usage warning (MB) */
  memoryWarning: 100,

  /** Memory usage error (MB) */
  memoryError: 200,
} as const;

/**
 * Caching configuration
 */
export const CACHE_CONFIG = {
  /** Default TTL for cache entries (ms) */
  defaultTTL: 5 * 60 * 1000, // 5 minutes

  /** TTL for short-term cache (ms) */
  shortTTL: 1 * 60 * 1000, // 1 minute

  /** TTL for long-term cache (ms) */
  longTTL: 30 * 60 * 1000, // 30 minutes

  /** TTL for API cache (ms) */
  apiTTL: 5 * 60 * 1000, // 5 minutes

  /** TTL for user data cache (ms) */
  userDataTTL: 10 * 60 * 1000, // 10 minutes

  /** Maximum cache entries */
  maxEntries: 100,

  /** Whether to use localStorage for persistence */
  persistent: true,

  /** Maximum localStorage size (bytes) */
  maxStorageSize: 5 * 1024 * 1024, // 5MB
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
  maxBatchSize: 10,

  /** Enable prefetching */
  prefetching: true,

  /** Request timeout (ms) */
  timeout: 30000,

  /** Retry attempts for failed requests */
  retryAttempts: 3,

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
    rootMargin: "50px",
    threshold: 0.01,
  },

  /** Supported image formats (in order of preference) */
  formats: ["webp", "avif", "jpeg"] as const,

  /** Responsive image sizes (px) */
  sizes: [320, 480, 768, 1024, 1280, 1536, 1920] as const,

  /** LQIP blur radius (px) */
  lqipBlur: 10,

  /** LQIP quality (0-100) */
  lqipQuality: 10,

  /** Enable blur-up effect */
  blurUp: true,

  /** Blur-up transition duration (ms) */
  blurUpDuration: 300,
} as const;

/**
 * Bundle configuration
 */
export const BUNDLE_CONFIG = {
  /** Maximum initial bundle size (bytes) */
  maxInitialSize: 100000, // 100KB

  /** Maximum route bundle size (bytes) */
  maxRouteSize: 50000, // 50KB

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
 * Monitoring configuration
 */
export const MONITORING_CONFIG = {
  /** Enable performance monitoring */
  enabled: true,

  /** Report metrics in development */
  reportInDevelopment: true,

  /** Report metrics in production */
  reportInProduction: true,

  /** Metrics reporting endpoint */
  reportingEndpoint: "/api/metrics",

  /** Batch metrics before sending */
  batchMetrics: true,

  /** Metrics batch interval (ms) */
  batchInterval: 30000, // 30 seconds

  /** Maximum metrics to batch */
  maxBatchSize: 50,

  /** Enable Web Vitals tracking */
  trackWebVitals: true,

  /** Enable custom metrics tracking */
  trackCustomMetrics: true,

  /** Enable performance profiling */
  profiling: process.env.NODE_ENV === "development",
} as const;

/**
 * Development warnings configuration
 */
export const DEV_WARNINGS = {
  /** Warn on slow renders */
  slowRenders: true,

  /** Warn on slow API calls */
  slowApis: true,

  /** Warn on slow images */
  slowImages: true,

  /** Warn on bundle size */
  bundleSize: true,

  /** Warn on memory issues */
  memory: true,

  /** Show warnings in console */
  console: true,

  /** Show warnings as overlays */
  overlay: false,
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
