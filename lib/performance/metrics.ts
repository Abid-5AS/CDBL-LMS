/**
 * Memory-Efficient Performance Metrics Collection
 *
 * Collect and manage performance metrics optimized for memory usage
 */

import {
  WEB_VITALS_TARGETS,
  PERFORMANCE_THRESHOLDS,
  getPerformanceStatus,
} from "@/constants/performance";

/**
 * Core Web Vitals metric
 */
export interface WebVitalMetric {
  name: "LCP" | "FID" | "CLS" | "FCP" | "TTFB" | "TTI";
  value: number;
  target: number;
  status: "good" | "needs-improvement" | "poor";
  timestamp: number;
}

/**
 * Custom performance metric
 */
export interface CustomMetric {
  name: string;
  value: number;
  unit: "ms" | "bytes" | "number" | "percent";
  timestamp: number;
  tags?: Record<string, string>;
}

/**
 * Component render metric
 */
export interface RenderMetric {
  componentName: string;
  renderTime: number;
  rerenderCount: number;
  timestamp: number;
  status: "good" | "warning" | "error";
}

/**
 * API performance metric
 */
export interface ApiMetric {
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  responseTime: number;
  statusCode: number;
  size: number;
  timestamp: number;
  status: "good" | "warning" | "error";
}

/**
 * Memory-efficient performance metrics storage
 */
export class MetricsCollector {
  private webVitals: Map<string, WebVitalMetric> = new Map();
  private customMetrics: CustomMetric[] = [];
  private renderMetrics: Map<string, RenderMetric> = new Map();
  private apiMetrics: ApiMetric[] = [];
  private listeners: Set<(metric: WebVitalMetric | CustomMetric | RenderMetric | ApiMetric) => void> = new Set();

  // Memory limits to prevent excessive memory usage
  private readonly MAX_CUSTOM_METRICS = 50;  // Reduced from default
  private readonly MAX_API_METRICS = 30;    // Reduced from default

  /**
   * Record a Web Vitals metric
   */
  recordWebVital(
    name: keyof typeof WEB_VITALS_TARGETS,
    value: number
  ): WebVitalMetric {
    const target = WEB_VITALS_TARGETS[name];
    const status = getPerformanceStatus(name, value);

    const metric: WebVitalMetric = {
      name,
      value,
      target,
      status,
      timestamp: Date.now(),
    };

    this.webVitals.set(name, metric);
    this.notifyListeners(metric);

    return metric;
  }

  /**
   * Record a custom metric with memory limit enforcement
   */
  recordCustomMetric(
    name: string,
    value: number,
    unit: "ms" | "bytes" | "number" | "percent" = "ms",
    tags?: Record<string, string>
  ): CustomMetric {
    const metric: CustomMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags,
    };

    this.customMetrics.push(metric);

    // Enforce memory limit by removing oldest metrics
    if (this.customMetrics.length > this.MAX_CUSTOM_METRICS) {
      this.customMetrics = this.customMetrics.slice(-this.MAX_CUSTOM_METRICS);
    }

    this.notifyListeners(metric);

    return metric;
  }

  /**
   * Record a component render metric
   */
  recordRenderMetric(
    componentName: string,
    renderTime: number,
    rerenderCount: number = 0
  ): RenderMetric {
    let status: "good" | "warning" | "error" = "good";

    if (renderTime > PERFORMANCE_THRESHOLDS.componentRenderError) {
      status = "error";
    } else if (renderTime > PERFORMANCE_THRESHOLDS.componentRender) {
      status = "warning";
    }

    const metric: RenderMetric = {
      componentName,
      renderTime,
      rerenderCount,
      timestamp: Date.now(),
      status,
    };

    this.renderMetrics.set(componentName, metric);
    this.notifyListeners(metric);

    return metric;
  }

  /**
   * Record an API metric with memory limit enforcement
   */
  recordApiMetric(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    responseTime: number,
    statusCode: number,
    size: number
  ): ApiMetric {
    let status: "good" | "warning" | "error" = "good";

    if (responseTime > PERFORMANCE_THRESHOLDS.apiResponseError) {
      status = "error";
    } else if (responseTime > PERFORMANCE_THRESHOLDS.apiResponseWarning) {
      status = "warning";
    }

    const metric: ApiMetric = {
      endpoint,
      method,
      responseTime,
      statusCode,
      size,
      timestamp: Date.now(),
      status,
    };

    this.apiMetrics.push(metric);

    // Enforce memory limit by removing oldest metrics
    if (this.apiMetrics.length > this.MAX_API_METRICS) {
      this.apiMetrics = this.apiMetrics.slice(-this.MAX_API_METRICS);
    }

    this.notifyListeners(metric);

    return metric;
  }

  /**
   * Get all Web Vitals metrics
   */
  getWebVitals(): WebVitalMetric[] {
    return Array.from(this.webVitals.values());
  }

  /**
   * Get specific Web Vital
   */
  getWebVital(name: keyof typeof WEB_VITALS_TARGETS): WebVitalMetric | undefined {
    return this.webVitals.get(name);
  }

  /**
   * Get all custom metrics
   */
  getCustomMetrics(): CustomMetric[] {
    return [...this.customMetrics];
  }

  /**
   * Get all render metrics
   */
  getRenderMetrics(): RenderMetric[] {
    return Array.from(this.renderMetrics.values());
  }

  /**
   * Get all API metrics
   */
  getApiMetrics(): ApiMetric[] {
    return [...this.apiMetrics];
  }

  /**
   * Get metrics summary
   */
  getSummary() {
    return {
      webVitals: this.getWebVitals(),
      customMetrics: this.getCustomMetrics(),
      renderMetrics: this.getRenderMetrics(),
      apiMetrics: this.getApiMetrics(),
      timestamp: Date.now(),
    };
  }

  /**
   * Get slow API calls
   */
  getSlowApis(threshold: number = PERFORMANCE_THRESHOLDS.apiResponseWarning): ApiMetric[] {
    return this.apiMetrics.filter(m => m.responseTime > threshold);
  }

  /**
   * Get slow renders
   */
  getSlowRenders(threshold: number = PERFORMANCE_THRESHOLDS.componentRender): RenderMetric[] {
    return Array.from(this.renderMetrics.values()).filter(m => m.renderTime > threshold);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.webVitals.clear();
    this.customMetrics = [];
    this.renderMetrics.clear();
    this.apiMetrics = [];
  }

  /**
   * Trim metrics to stay within memory limits
   */
  trimMetrics(): void {
    // Trim custom metrics if they exceed the limit
    if (this.customMetrics.length > this.MAX_CUSTOM_METRICS) {
      this.customMetrics = this.customMetrics.slice(-this.MAX_CUSTOM_METRICS);
    }

    // Trim API metrics if they exceed the limit
    if (this.apiMetrics.length > this.MAX_API_METRICS) {
      this.apiMetrics = this.apiMetrics.slice(-this.MAX_API_METRICS);
    }
  }

  /**
   * Subscribe to metric changes
   */
  subscribe(
    listener: (metric: WebVitalMetric | CustomMetric | RenderMetric | ApiMetric) => void
  ): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(
    metric: WebVitalMetric | CustomMetric | RenderMetric | ApiMetric
  ): void {
    // Execute listeners in a memory-efficient way
    const listenersArray = [...this.listeners];
    for (const listener of listenersArray) {
      try {
        listener(metric);
      } catch (error) {
        console.error("Error in metrics listener:", error);
      }
    }
  }
}

/**
 * Global metrics collector instance with memory management
 */
let globalCollector: MetricsCollector | null = null;

/**
 * Get or create global metrics collector
 */
export function getMetricsCollector(): MetricsCollector {
  if (!globalCollector) {
    globalCollector = new MetricsCollector();
  }
  return globalCollector;
}

/**
 * Record Web Vitals metric globally
 */
export function recordWebVital(
  name: keyof typeof WEB_VITALS_TARGETS,
  value: number
): WebVitalMetric {
  return getMetricsCollector().recordWebVital(name, value);
}

/**
 * Record custom metric globally
 */
export function recordCustomMetric(
  name: string,
  value: number,
  unit?: "ms" | "bytes" | "number" | "percent",
  tags?: Record<string, string>
): CustomMetric {
  return getMetricsCollector().recordCustomMetric(name, value, unit, tags);
}

/**
 * Record render metric globally
 */
export function recordRenderMetric(
  componentName: string,
  renderTime: number,
  rerenderCount?: number
): RenderMetric {
  return getMetricsCollector().recordRenderMetric(componentName, renderTime, rerenderCount);
}

/**
 * Record API metric globally
 */
export function recordApiMetric(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  responseTime: number,
  statusCode: number,
  size: number
): ApiMetric {
  return getMetricsCollector().recordApiMetric(endpoint, method, responseTime, statusCode, size);
}
