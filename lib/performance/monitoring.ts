/**
 * Performance Monitoring
 *
 * Utilities for collecting Web Vitals and performance metrics
 */

import {
  onCLS,
  onFCP,
  onLCP,
  onTTFB,
  onINP,
} from "web-vitals";
import {
  getMetricsCollector,
  recordWebVital,
  recordCustomMetric,
} from "./metrics";
import {
  WEB_VITALS_TARGETS,
  PERFORMANCE_THRESHOLDS,
  MONITORING_CONFIG,
} from "@/constants/performance";

/**
 * Initialize Web Vitals collection
 *
 * Sets up automatic collection of Core Web Vitals metrics
 */
export function initializeWebVitals(): void {
  if (typeof window === "undefined") {
    return;
  }

  // Collect LCP (Largest Contentful Paint)
  onLCP((metric) => {
    recordWebVital("LCP", metric.value);
    if (MONITORING_CONFIG.logWebVitals) {
      console.log("LCP:", metric.value);
    }
  });

  // Collect INP (Interaction to Next Paint - replaces FID)
  onINP((metric) => {
    recordWebVital("INP", metric.value);
    if (MONITORING_CONFIG.logWebVitals) {
      console.log("INP:", metric.value);
    }
  });

  // Collect CLS (Cumulative Layout Shift)
  onCLS((metric) => {
    recordWebVital("CLS", metric.value);
    if (MONITORING_CONFIG.logWebVitals) {
      console.log("CLS:", metric.value);
    }
  });

  // Collect FCP (First Contentful Paint)
  onFCP((metric) => {
    recordWebVital("FCP", metric.value);
    if (MONITORING_CONFIG.logWebVitals) {
      console.log("FCP:", metric.value);
    }
  });

  // Collect TTFB (Time to First Byte)
  onTTFB((metric) => {
    recordWebVital("TTFB", metric.value);
    if (MONITORING_CONFIG.logWebVitals) {
      console.log("TTFB:", metric.value);
    }
  });
}

/**
 * Track page load performance
 *
 * Records timing metrics for page load phases
 */
export function trackPageLoadPerformance(): void {
  if (typeof window === "undefined" || !window.performance) {
    return;
  }

  const perfData = window.performance.getEntriesByType("navigation");
  if (perfData.length === 0) {
    return;
  }

  const navTiming = perfData[0] as PerformanceNavigationTiming;

  // Calculate key timing metrics
  const dnsLookup = navTiming.domainLookupEnd - navTiming.domainLookupStart;
  const tcpConnection = navTiming.connectEnd - navTiming.connectStart;
  const requestTime = navTiming.responseStart - navTiming.requestStart;
  const responseTime = navTiming.responseEnd - navTiming.responseStart;
  const domParsing = navTiming.domInteractive - navTiming.domLoading;
  const domComplete = navTiming.domComplete - navTiming.domLoading;
  const resourceLoading = navTiming.loadEventStart - navTiming.domComplete;
  const totalLoadTime = navTiming.loadEventEnd - navTiming.fetchStart;

  // Record metrics
  recordCustomMetric("DNS Lookup", dnsLookup, "ms", {
    phase: "network",
  });
  recordCustomMetric("TCP Connection", tcpConnection, "ms", {
    phase: "network",
  });
  recordCustomMetric("Request Time", requestTime, "ms", {
    phase: "network",
  });
  recordCustomMetric("Response Time", responseTime, "ms", {
    phase: "transfer",
  });
  recordCustomMetric("DOM Parsing", domParsing, "ms", {
    phase: "dom",
  });
  recordCustomMetric("DOM Complete", domComplete, "ms", {
    phase: "dom",
  });
  recordCustomMetric("Resource Loading", resourceLoading, "ms", {
    phase: "resources",
  });
  recordCustomMetric("Total Load Time", totalLoadTime, "ms", {
    phase: "total",
  });

  if (MONITORING_CONFIG.logPageLoadMetrics) {
    console.group("Page Load Performance");
    console.log("DNS Lookup:", dnsLookup, "ms");
    console.log("TCP Connection:", tcpConnection, "ms");
    console.log("Request Time:", requestTime, "ms");
    console.log("Response Time:", responseTime, "ms");
    console.log("DOM Parsing:", domParsing, "ms");
    console.log("DOM Complete:", domComplete, "ms");
    console.log("Resource Loading:", resourceLoading, "ms");
    console.log("Total Load Time:", totalLoadTime, "ms");
    console.groupEnd();
  }
}

/**
 * Track memory usage
 *
 * Records memory consumption if available (Chrome/Edge only)
 */
export function trackMemoryUsage(): void {
  if (
    typeof window === "undefined" ||
    !("memory" in performance) ||
    !MONITORING_CONFIG.trackMemory
  ) {
    return;
  }

  const memory = (performance as any).memory;

  const usedMemory = memory.usedJSHeapSize;
  const totalMemory = memory.totalJSHeapSize;
  const limit = memory.jsHeapSizeLimit;
  const usagePercent = (usedMemory / limit) * 100;

  recordCustomMetric("Heap Used", usedMemory, "bytes", {
    type: "memory",
  });
  recordCustomMetric("Heap Total", totalMemory, "bytes", {
    type: "memory",
  });
  recordCustomMetric("Heap Limit", limit, "bytes", {
    type: "memory",
  });
  recordCustomMetric("Memory Usage %", usagePercent, "percent", {
    type: "memory",
  });

  if (MONITORING_CONFIG.logMemoryMetrics) {
    console.group("Memory Usage");
    console.log(
      "Used:",
      (usedMemory / 1024 / 1024).toFixed(2),
      "MB"
    );
    console.log(
      "Total:",
      (totalMemory / 1024 / 1024).toFixed(2),
      "MB"
    );
    console.log(
      "Limit:",
      (limit / 1024 / 1024).toFixed(2),
      "MB"
    );
    console.log("Usage:", usagePercent.toFixed(2), "%");
    console.groupEnd();
  }

  // Warn if memory usage is high
  if (
    usagePercent > PERFORMANCE_THRESHOLDS.memoryUsageWarning &&
    MONITORING_CONFIG.devWarnings
  ) {
    console.warn(
      `High memory usage: ${usagePercent.toFixed(2)}% (threshold: ${PERFORMANCE_THRESHOLDS.memoryUsageWarning}%)`
    );
  }
}

/**
 * Track network information
 *
 * Records network connection type and bandwidth if available
 */
export function trackNetworkInformation(): void {
  if (typeof window === "undefined" || !navigator || !MONITORING_CONFIG.trackNetwork) {
    return;
  }

  const connection = (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection;

  if (!connection) {
    return;
  }

  const effectiveType = connection.effectiveType || "unknown";
  const downlink = connection.downlink || 0;
  const rtt = connection.rtt || 0;
  const saveData = connection.saveData || false;

  recordCustomMetric("Network RTT", rtt, "ms", {
    type: "network",
    effectiveType,
  });

  recordCustomMetric("Network Downlink", downlink, "number", {
    type: "network",
    effectiveType,
  });

  if (MONITORING_CONFIG.logNetworkMetrics) {
    console.group("Network Information");
    console.log("Effective Type:", effectiveType);
    console.log("RTT:", rtt, "ms");
    console.log("Downlink:", downlink, "Mbps");
    console.log("Save Data:", saveData);
    console.groupEnd();
  }
}

/**
 * Track cumulative layout shift details
 *
 * Records individual layout shift events for debugging
 */
export function trackLayoutShifts(): void {
  if (
    typeof window === "undefined" ||
    !("PerformanceObserver" in window) ||
    !MONITORING_CONFIG.trackLayoutShifts
  ) {
    return;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          const shift = (entry as any).value;
          recordCustomMetric("Layout Shift", shift, "number", {
            type: "cls",
            hasRecentInput: false,
          });

          if (MONITORING_CONFIG.logLayoutShifts) {
            console.log("Layout Shift:", shift, "- Affected elements:", entry);
          }
        }
      }
    });

    observer.observe({ entryTypes: ["layout-shift"] });

    // Clean up after some time
    setTimeout(() => observer.disconnect(), 60000);
  } catch (error) {
    if (MONITORING_CONFIG.devWarnings) {
      console.warn("Layout shift tracking not available:", error);
    }
  }
}

/**
 * Track resource loading performance
 *
 * Records timing for individual resource loads
 */
export function trackResourceTiming(): void {
  if (
    typeof window === "undefined" ||
    !window.performance ||
    !MONITORING_CONFIG.trackResources
  ) {
    return;
  }

  try {
    const resources = window.performance.getEntriesByType("resource");

    // Group resources by type
    const resourcesByType: Record<string, PerformanceResourceTiming[]> = {};

    for (const resource of resources) {
      const url = resource.name;
      let type = "other";

      if (url.includes(".js")) {
        type = "script";
      } else if (url.includes(".css")) {
        type = "stylesheet";
      } else if (
        url.includes(".jpg") ||
        url.includes(".png") ||
        url.includes(".webp") ||
        url.includes(".gif")
      ) {
        type = "image";
      } else if (url.includes(".woff") || url.includes(".ttf")) {
        type = "font";
      } else if (url.includes("/api/") || url.includes("http")) {
        type = "fetch";
      }

      if (!resourcesByType[type]) {
        resourcesByType[type] = [];
      }
      resourcesByType[type].push(resource as PerformanceResourceTiming);
    }

    // Record aggregate metrics per type
    for (const [type, entries] of Object.entries(resourcesByType)) {
      const totalTime = entries.reduce((sum, r) => sum + r.duration, 0);
      const avgTime = totalTime / entries.length;
      const totalSize = entries.reduce((sum, r) => sum + (r.transferSize || 0), 0);

      recordCustomMetric(`Resource Load Time (${type})`, avgTime, "ms", {
        type: "resource",
        resourceType: type,
      });

      recordCustomMetric(`Resource Size (${type})`, totalSize, "bytes", {
        type: "resource",
        resourceType: type,
      });

      if (MONITORING_CONFIG.logResourceTiming) {
        console.log(`${type}: ${entries.length} resources, ${avgTime.toFixed(2)}ms avg, ${(totalSize / 1024).toFixed(2)}KB total`);
      }
    }
  } catch (error) {
    if (MONITORING_CONFIG.devWarnings) {
      console.warn("Resource timing tracking failed:", error);
    }
  }
}

/**
 * Check Web Vitals status and log warnings for poor performance
 *
 * Compares recorded metrics against targets and logs warnings
 */
export function checkWebVitalsStatus(): void {
  if (!MONITORING_CONFIG.devWarnings) {
    return;
  }

  const collector = getMetricsCollector();
  const vitals = collector.getWebVitals();

  const warnings: string[] = [];

  for (const vital of vitals) {
    if (vital.status === "poor") {
      warnings.push(
        `❌ ${vital.name}: ${vital.value.toFixed(2)} (target: ${vital.target})`
      );
    } else if (vital.status === "needs-improvement") {
      warnings.push(
        `⚠️  ${vital.name}: ${vital.value.toFixed(2)} (target: ${vital.target})`
      );
    }
  }

  if (warnings.length > 0) {
    console.group("Performance Warnings");
    warnings.forEach((warning) => console.warn(warning));
    console.groupEnd();
  }
}

/**
 * Initialize all performance monitoring
 *
 * Call this once on app startup to begin tracking all metrics
 */
export function initializePerformanceMonitoring(): void {
  if (typeof window === "undefined") {
    return;
  }

  // Initialize Web Vitals collection
  if (MONITORING_CONFIG.trackWebVitals) {
    initializeWebVitals();
  }

  // Track page load performance
  if (MONITORING_CONFIG.trackPageLoad) {
    // Wait for page load event
    window.addEventListener("load", () => {
      trackPageLoadPerformance();
    });
  }

  // Track memory usage periodically
  if (MONITORING_CONFIG.trackMemory) {
    trackMemoryUsage();
    setInterval(
      () => trackMemoryUsage(),
      MONITORING_CONFIG.memoryCheckInterval
    );
  }

  // Track network information
  if (MONITORING_CONFIG.trackNetwork) {
    trackNetworkInformation();
  }

  // Track layout shifts
  if (MONITORING_CONFIG.trackLayoutShifts) {
    trackLayoutShifts();
  }

  // Track resource timing
  if (MONITORING_CONFIG.trackResources) {
    // Wait for resources to load
    window.addEventListener("load", () => {
      trackResourceTiming();
    });
  }

  // Check Web Vitals status periodically
  if (MONITORING_CONFIG.checkVitalsInterval > 0) {
    setInterval(
      () => checkWebVitalsStatus(),
      MONITORING_CONFIG.checkVitalsInterval
    );
  }
}

/**
 * Get performance report
 *
 * Returns comprehensive performance metrics summary
 */
export function getPerformanceReport() {
  const collector = getMetricsCollector();
  const summary = collector.getSummary();

  return {
    timestamp: new Date(summary.timestamp).toISOString(),
    webVitals: summary.webVitals,
    customMetrics: summary.customMetrics,
    renderMetrics: summary.renderMetrics,
    apiMetrics: summary.apiMetrics,
    slowApis: collector.getSlowApis(),
    slowRenders: collector.getSlowRenders(),
    summary: {
      totalWebVitals: summary.webVitals.length,
      totalCustomMetrics: summary.customMetrics.length,
      totalRenderMetrics: summary.renderMetrics.length,
      totalApiMetrics: summary.apiMetrics.length,
    },
  };
}
