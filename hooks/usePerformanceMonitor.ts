/**
 * usePerformanceMonitor Hook
 *
 * Monitor and access performance metrics in React components
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  getMetricsCollector,
  type WebVitalMetric,
  type CustomMetric,
  type RenderMetric,
  type ApiMetric,
} from "@/lib/performance/metrics";
import {
  initializePerformanceMonitoring,
  getPerformanceReport,
} from "@/lib/performance/monitoring";
import { MONITORING_CONFIG } from "@/constants/performance";

/**
 * Performance metrics snapshot
 */
export interface PerformanceMetricsSnapshot {
  webVitals: WebVitalMetric[];
  customMetrics: CustomMetric[];
  renderMetrics: RenderMetric[];
  apiMetrics: ApiMetric[];
  timestamp: number;
}

/**
 * Hook options
 */
interface UsePerformanceMonitorOptions {
  /** Enable automatic monitoring initialization */
  autoStart?: boolean;

  /** Callback when metrics are updated */
  onMetricsUpdate?: (metrics: PerformanceMetricsSnapshot) => void;

  /** Callback when specific metric type is recorded */
  onMetricRecorded?: (metric: WebVitalMetric | CustomMetric | RenderMetric | ApiMetric) => void;
}

// Global flag to prevent multiple initializations
let isMonitoringInitialized = false;

/**
 * Hook to monitor performance metrics
 *
 * Provides access to collected performance metrics and subscribes to updates
 *
 * @example
 * ```typescript
 * function PerformanceMonitor() {
 *   const { metrics, isInitialized } = usePerformanceMonitor({
 *     autoStart: true,
 *     onMetricsUpdate: (metrics) => {
 *       console.log('Metrics updated:', metrics);
 *     }
 *   });
 *
 *   if (!isInitialized) return <div>Initializing...</div>;
 *
 *   return (
 *     <div>
 *       <p>LCP: {metrics.webVitals[0]?.value}ms</p>
 *       <p>Total API Calls: {metrics.apiMetrics.length}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePerformanceMonitor(
  options: UsePerformanceMonitorOptions = {}
) {
  const {
    autoStart = true,
    onMetricsUpdate,
    onMetricRecorded,
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetricsSnapshot>(() => {
    const collector = getMetricsCollector();
    const summary = collector.getSummary();
    return {
      webVitals: summary.webVitals,
      customMetrics: summary.customMetrics,
      renderMetrics: summary.renderMetrics,
      apiMetrics: summary.apiMetrics,
      timestamp: summary.timestamp,
    };
  });

  const [isInitialized, setIsInitialized] = useState(!autoStart);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Initialize monitoring
  useEffect(() => {
    if (!autoStart) {
      return;
    }

    if (!isMonitoringInitialized && MONITORING_CONFIG.enabled) {
      try {
        initializePerformanceMonitoring();
        isMonitoringInitialized = true;
      } catch (error) {
        console.error("Failed to initialize performance monitoring:", error);
      }
    }

    setIsInitialized(true);
  }, [autoStart]);

  // Subscribe to metrics updates
  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    const collector = getMetricsCollector();

    // Subscribe to metric changes
    const unsubscribe = collector.subscribe((metric) => {
      // Update metrics snapshot
      const summary = collector.getSummary();
      const newMetrics: PerformanceMetricsSnapshot = {
        webVitals: summary.webVitals,
        customMetrics: summary.customMetrics,
        renderMetrics: summary.renderMetrics,
        apiMetrics: summary.apiMetrics,
        timestamp: summary.timestamp,
      };

      setMetrics(newMetrics);

      // Call callbacks
      onMetricRecorded?.(metric);
      onMetricsUpdate?.(newMetrics);
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [isInitialized, onMetricsUpdate, onMetricRecorded]);

  // Get specific metric by name
  const getWebVital = useCallback(
    (name: string): WebVitalMetric | undefined => {
      return metrics.webVitals.find((v) => v.name === name);
    },
    [metrics.webVitals]
  );

  // Get custom metric by name
  const getCustomMetric = useCallback(
    (name: string): CustomMetric | undefined => {
      return metrics.customMetrics.find((m) => m.name === name);
    },
    [metrics.customMetrics]
  );

  // Get render metric for component
  const getRenderMetric = useCallback(
    (componentName: string): RenderMetric | undefined => {
      return metrics.renderMetrics.find((m) => m.componentName === componentName);
    },
    [metrics.renderMetrics]
  );

  // Get API metrics for endpoint
  const getApiMetrics = useCallback(
    (endpoint: string): ApiMetric[] => {
      return metrics.apiMetrics.filter((m) => m.endpoint === endpoint);
    },
    [metrics.apiMetrics]
  );

  // Get slow API calls
  const getSlowApis = useCallback((): ApiMetric[] => {
    const collector = getMetricsCollector();
    return collector.getSlowApis();
  }, []);

  // Get slow renders
  const getSlowRenders = useCallback((): RenderMetric[] => {
    const collector = getMetricsCollector();
    return collector.getSlowRenders();
  }, []);

  // Get full performance report
  const getReport = useCallback((): ReturnType<typeof getPerformanceReport> => {
    return getPerformanceReport();
  }, []);

  // Clear all metrics
  const clearMetrics = useCallback((): void => {
    const collector = getMetricsCollector();
    collector.clear();
    const summary = collector.getSummary();
    setMetrics({
      webVitals: summary.webVitals,
      customMetrics: summary.customMetrics,
      renderMetrics: summary.renderMetrics,
      apiMetrics: summary.apiMetrics,
      timestamp: summary.timestamp,
    });
  }, []);

  // Export metrics as JSON
  const exportMetrics = useCallback((): string => {
    const report = getReport();
    return JSON.stringify(report, null, 2);
  }, [getReport]);

  // Check if metrics are within performance targets
  const areMetricsHealthy = useCallback((): boolean => {
    const allGood = metrics.webVitals.every((v) => v.status === "good");
    const slowApis = getSlowApis();
    const slowRenders = getSlowRenders();

    return allGood && slowApis.length === 0 && slowRenders.length === 0;
  }, [metrics.webVitals, getSlowApis, getSlowRenders]);

  // Get health status as percentage
  const getHealthScore = useCallback((): number => {
    let score = 100;

    // Deduct points for non-good Web Vitals
    metrics.webVitals.forEach((vital) => {
      if (vital.status === "needs-improvement") {
        score -= 10;
      } else if (vital.status === "poor") {
        score -= 25;
      }
    });

    // Deduct points for slow APIs
    const slowApis = getSlowApis();
    score -= Math.min(slowApis.length * 5, 20);

    // Deduct points for slow renders
    const slowRenders = getSlowRenders();
    score -= Math.min(slowRenders.length * 3, 15);

    return Math.max(0, Math.min(100, score));
  }, [metrics.webVitals, getSlowApis, getSlowRenders]);

  return {
    // Metrics snapshots
    metrics,

    // Status
    isInitialized,

    // Getters
    getWebVital,
    getCustomMetric,
    getRenderMetric,
    getApiMetrics,
    getSlowApis,
    getSlowRenders,
    getReport,

    // Actions
    clearMetrics,
    exportMetrics,

    // Health checks
    areMetricsHealthy,
    getHealthScore,
  };
}
