/**
 * Bundle Analysis
 *
 * Utilities for analyzing bundle size and performance
 */

import { recordCustomMetric } from "./metrics";
import { PERFORMANCE_THRESHOLDS, BUNDLE_CONFIG } from "@/constants/performance";

/**
 * Script bundle metadata
 */
export interface BundleMetadata {
  url: string;
  size: number;
  gzipSize?: number;
  brotliSize?: number;
  type: "chunk" | "main" | "vendor" | "other";
  async: boolean;
  module: string;
}

/**
 * Bundle analysis result
 */
export interface BundleAnalysisResult {
  totalSize: number;
  totalGzipSize: number;
  bundleCount: number;
  largestBundle: BundleMetadata | null;
  largestChunks: BundleMetadata[];
  overThreshold: BundleMetadata[];
  timeToAnalyze: number;
  timestamp: number;
}

/**
 * Analyze current bundle size from loaded scripts
 *
 * Returns analysis of all loaded JavaScript bundles
 */
export function analyzeBundleSize(): BundleAnalysisResult {
  const startTime = performance.now();
  const bundles: BundleMetadata[] = [];

  if (typeof window === "undefined" || !window.performance) {
    return {
      totalSize: 0,
      totalGzipSize: 0,
      bundleCount: 0,
      largestBundle: null,
      largestChunks: [],
      overThreshold: [],
      timeToAnalyze: 0,
      timestamp: Date.now(),
    };
  }

  // Get resource entries for scripts
  const resources = window.performance.getEntriesByType("resource");

  for (const resource of resources) {
    const url = resource.name;

    // Filter for JavaScript files
    if (!url.includes(".js") && !url.includes("application/javascript")) {
      continue;
    }

    const transferSize = (resource as PerformanceResourceTiming).transferSize || 0;
    const decodedBodySize = (resource as PerformanceResourceTiming).decodedBodySize || 0;

    // Determine bundle type
    let type: "chunk" | "main" | "vendor" | "other" = "other";
    if (url.includes("main")) {
      type = "main";
    } else if (url.includes("vendor") || url.includes("node_modules")) {
      type = "vendor";
    } else if (url.includes("chunk") || url.match(/\.\w{6}\.js/)) {
      type = "chunk";
    }

    const bundle: BundleMetadata = {
      url: url.split("/").pop() || url,
      size: decodedBodySize,
      gzipSize: transferSize,
      type,
      async: resource.initiatorType === "script",
      module: url,
    };

    bundles.push(bundle);
  }

  // Calculate totals
  const totalSize = bundles.reduce((sum, b) => sum + b.size, 0);
  const totalGzipSize = bundles.reduce((sum, b) => sum + (b.gzipSize || 0), 0);

  // Find largest bundles
  const sorted = [...bundles].sort((a, b) => b.size - a.size);
  const largestBundle = sorted[0] || null;
  const largestChunks = sorted.slice(0, 5);

  // Find bundles over threshold
  const overThreshold = bundles.filter((b) => b.size > BUNDLE_CONFIG.maxBundleSize);

  const timeToAnalyze = performance.now() - startTime;

  const result: BundleAnalysisResult = {
    totalSize,
    totalGzipSize,
    bundleCount: bundles.length,
    largestBundle,
    largestChunks,
    overThreshold,
    timeToAnalyze,
    timestamp: Date.now(),
  };

  // Record metrics
  recordCustomMetric("Total Bundle Size", totalSize, "bytes", {
    type: "bundle",
  });

  recordCustomMetric("Total Gzip Size", totalGzipSize, "bytes", {
    type: "bundle",
    compressed: "true",
  });

  recordCustomMetric("Bundle Count", bundles.length, "number", {
    type: "bundle",
  });

  // Warn if over threshold
  if (totalSize > BUNDLE_CONFIG.totalSizeLimit && BUNDLE_CONFIG.devWarnings) {
    console.warn(
      `⚠️  Total bundle size (${(totalSize / 1024).toFixed(2)}KB) exceeds limit (${(BUNDLE_CONFIG.totalSizeLimit / 1024).toFixed(2)}KB)`
    );
  }

  return result;
}

/**
 * Estimate bundle size reduction potential
 *
 * Analyzes current bundles and estimates what could be reduced
 */
export function estimateBundleReductionPotential(): {
  estimatedReduction: number;
  percentageReduction: number;
  recommendations: string[];
} {
  const result = analyzeBundleSize();

  const recommendations: string[] = [];
  let estimatedReduction = 0;

  // Check for code splitting opportunities
  if (result.largestBundle && result.largestBundle.size > BUNDLE_CONFIG.maxBundleSize) {
    recommendations.push(
      `Split ${result.largestBundle.url} (${(result.largestBundle.size / 1024).toFixed(2)}KB) into smaller chunks`
    );
    estimatedReduction += result.largestBundle.size * 0.2; // 20% reduction potential
  }

  // Check for vendor bundle
  const vendorBundles = result.largestChunks.filter((b) => b.type === "vendor");
  if (vendorBundles.length > 0) {
    const vendorSize = vendorBundles.reduce((sum, b) => sum + b.size, 0);
    recommendations.push(
      `Optimize vendor bundle (${(vendorSize / 1024).toFixed(2)}KB) - consider removing unused dependencies`
    );
    estimatedReduction += vendorSize * 0.15; // 15% reduction potential
  }

  // Check for unused code
  recommendations.push(
    "Enable tree-shaking in your bundler and ensure sideEffects are properly configured"
  );
  estimatedReduction += result.totalSize * 0.1; // 10% reduction potential

  // Check for dynamic imports
  recommendations.push(
    "Use dynamic imports and code-splitting for routes and heavy components"
  );
  estimatedReduction += result.totalSize * 0.15; // 15% reduction potential

  const percentageReduction = (estimatedReduction / result.totalSize) * 100;

  return {
    estimatedReduction: Math.round(estimatedReduction),
    percentageReduction: Math.round(percentageReduction * 10) / 10,
    recommendations,
  };
}

/**
 * Get bundle size comparison (useful for CI/CD)
 *
 * Compare against baseline sizes
 */
export function getBundleSizeComparison(
  baseline: {
    totalSize: number;
    totalGzipSize: number;
  } = {
    totalSize: BUNDLE_CONFIG.targetTotalSize,
    totalGzipSize: BUNDLE_CONFIG.targetGzipSize,
  }
) {
  const current = analyzeBundleSize();

  const sizeIncrease = current.totalSize - baseline.totalSize;
  const gzipIncrease = current.totalGzipSize - baseline.totalGzipSize;
  const sizeChangePercent = (sizeIncrease / baseline.totalSize) * 100;
  const gzipChangePercent = (gzipIncrease / baseline.totalGzipSize) * 100;

  return {
    current: {
      totalSize: current.totalSize,
      totalGzipSize: current.totalGzipSize,
    },
    baseline,
    changes: {
      sizeIncrease,
      gzipIncrease,
      sizeChangePercent: Math.round(sizeChangePercent * 100) / 100,
      gzipChangePercent: Math.round(gzipChangePercent * 100) / 100,
    },
    isWithinBudget:
      current.totalSize <= BUNDLE_CONFIG.totalSizeLimit &&
      current.totalGzipSize <= BUNDLE_CONFIG.gzipSizeLimit,
    exceeded: {
      total:
        current.totalSize > BUNDLE_CONFIG.totalSizeLimit
          ? current.totalSize - BUNDLE_CONFIG.totalSizeLimit
          : 0,
      gzip:
        current.totalGzipSize > BUNDLE_CONFIG.gzipSizeLimit
          ? current.totalGzipSize - BUNDLE_CONFIG.gzipSizeLimit
          : 0,
    },
  };
}

/**
 * Analyze bundle composition by type
 *
 * Break down bundles by category (main, vendor, chunks, etc.)
 */
export function analyzeBundleComposition(): Record<
  string,
  {
    count: number;
    totalSize: number;
    percentage: number;
    bundles: BundleMetadata[];
  }
> {
  const result = analyzeBundleSize();

  // Get all resources again for detailed analysis
  if (typeof window === "undefined" || !window.performance) {
    return {};
  }

  const resources = window.performance.getEntriesByType("resource");
  const bundlesByType: Record<string, BundleMetadata[]> = {
    main: [],
    vendor: [],
    chunk: [],
    other: [],
  };

  for (const resource of resources) {
    const url = resource.name;

    if (!url.includes(".js")) {
      continue;
    }

    const transferSize = (resource as PerformanceResourceTiming).transferSize || 0;
    const decodedBodySize = (resource as PerformanceResourceTiming).decodedBodySize || 0;

    let type: "chunk" | "main" | "vendor" | "other" = "other";
    if (url.includes("main")) {
      type = "main";
    } else if (url.includes("vendor") || url.includes("node_modules")) {
      type = "vendor";
    } else if (url.includes("chunk") || url.match(/\.\w{6}\.js/)) {
      type = "chunk";
    }

    bundlesByType[type].push({
      url: url.split("/").pop() || url,
      size: decodedBodySize,
      gzipSize: transferSize,
      type,
      async: resource.initiatorType === "script",
      module: url,
    });
  }

  // Calculate composition
  const composition: Record<
    string,
    {
      count: number;
      totalSize: number;
      percentage: number;
      bundles: BundleMetadata[];
    }
  > = {};

  for (const [type, bundles] of Object.entries(bundlesByType)) {
    const totalSize = bundles.reduce((sum, b) => sum + b.size, 0);
    composition[type] = {
      count: bundles.length,
      totalSize,
      percentage: result.totalSize > 0 ? (totalSize / result.totalSize) * 100 : 0,
      bundles: bundles.sort((a, b) => b.size - a.size),
    };
  }

  return composition;
}

/**
 * Get bundle metrics summary
 *
 * Returns formatted summary of bundle analysis
 */
export function getBundleSummary(): string {
  const analysis = analyzeBundleSize();
  const composition = analyzeBundleComposition();
  const potential = estimateBundleReductionPotential();

  let summary = `Bundle Analysis Summary (${new Date(analysis.timestamp).toLocaleTimeString()})\n`;
  summary += `=====================================\n`;
  summary += `Total Size: ${(analysis.totalSize / 1024).toFixed(2)} KB\n`;
  summary += `Total Gzip: ${(analysis.totalGzipSize / 1024).toFixed(2)} KB\n`;
  summary += `Bundle Count: ${analysis.bundleCount}\n`;
  summary += `\nComposition:\n`;

  for (const [type, data] of Object.entries(composition)) {
    summary += `  ${type}: ${data.count} files, ${(data.totalSize / 1024).toFixed(2)} KB (${data.percentage.toFixed(1)}%)\n`;
  }

  if (analysis.largestBundle) {
    summary += `\nLargest Bundle:\n`;
    summary += `  ${analysis.largestBundle.url}: ${(analysis.largestBundle.size / 1024).toFixed(2)} KB\n`;
  }

  if (potential.estimatedReduction > 0) {
    summary += `\nOptimization Potential:\n`;
    summary += `  Could reduce by: ${(potential.estimatedReduction / 1024).toFixed(2)} KB (${potential.percentageReduction}%)\n`;
    summary += `  Recommendations:\n`;
    potential.recommendations.forEach((rec) => {
      summary += `    - ${rec}\n`;
    });
  }

  return summary;
}

/**
 * Export bundle analysis as JSON
 *
 * Useful for CI/CD and monitoring
 */
export function exportBundleAnalysis(): {
  analysis: BundleAnalysisResult;
  composition: Record<
    string,
    {
      count: number;
      totalSize: number;
      percentage: number;
      bundles: BundleMetadata[];
    }
  >;
  potential: {
    estimatedReduction: number;
    percentageReduction: number;
    recommendations: string[];
  };
  comparison: ReturnType<typeof getBundleSizeComparison>;
} {
  return {
    analysis: analyzeBundleSize(),
    composition: analyzeBundleComposition(),
    potential: estimateBundleReductionPotential(),
    comparison: getBundleSizeComparison(),
  };
}
