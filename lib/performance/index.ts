/**
 * Performance Library
 *
 * Export all performance utilities and monitoring tools
 */

// Metrics collection
export {
  MetricsCollector,
  getMetricsCollector,
  recordWebVital,
  recordCustomMetric,
  recordRenderMetric,
  recordApiMetric,
  type WebVitalMetric,
  type CustomMetric,
  type RenderMetric,
  type ApiMetric,
} from "./metrics";

// Performance monitoring
export {
  initializeWebVitals,
  trackPageLoadPerformance,
  trackMemoryUsage,
  trackNetworkInformation,
  trackLayoutShifts,
  trackResourceTiming,
  checkWebVitalsStatus,
  initializePerformanceMonitoring,
  getPerformanceReport,
} from "./monitoring";
