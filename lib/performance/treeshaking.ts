/**
 * Tree Shaking & Dead Code Analysis
 *
 * Utilities for identifying and optimizing unused code
 */

import { recordCustomMetric } from "./metrics";

/**
 * Module analysis result
 */
export interface ModuleAnalysis {
  name: string;
  size: number;
  exported: string[];
  used: string[];
  unused: string[];
  usagePercent: number;
}

/**
 * Unused export info
 */
export interface UnusedExport {
  module: string;
  exports: string[];
  estimatedSize: number;
}

/**
 * Side effects analysis
 */
export interface SideEffectsAnalysis {
  hasSideEffects: boolean;
  sideEffectFiles: string[];
  canBeTreeShaken: boolean;
  estimatedSavings: number;
}

/**
 * Configuration for tree-shaking analysis
 */
export interface TreeShakingConfig {
  /** Modules to analyze */
  modules?: string[];

  /** Known used exports (to avoid false positives) */
  knownUsed?: Record<string, string[]>;

  /** Minimum size threshold for warnings (bytes) */
  minSizeThreshold?: number;

  /** Enable detailed logging */
  verbose?: boolean;
}

/**
 * Detect unused dependencies
 *
 * Analyzes package.json and runtime imports to find unused packages
 */
export async function detectUnusedDependencies(): Promise<{
  unused: string[];
  potentialSize: number;
  estimatedReduction: number;
}> {
  // This would typically analyze package.json and bundled code
  // For runtime, we can check what's actually loaded

  if (typeof window === "undefined") {
    return {
      unused: [],
      potentialSize: 0,
      estimatedReduction: 0,
    };
  }

  // Get all loaded scripts
  const scripts = Array.from(document.querySelectorAll("script[src]"));
  const loadedResources = new Set(
    scripts.map((s) => (s as HTMLScriptElement).src)
  );

  // Common packages that might be unused
  const commonPackages = [
    "moment",
    "lodash",
    "underscore",
    "date-fns",
    "axios",
    "qs",
  ];

  const unusedPackages: string[] = [];

  for (const pkg of commonPackages) {
    const isLoaded = Array.from(loadedResources).some((url) =>
      url.includes(pkg)
    );

    // Check if actually used in window (heuristic)
    const isUsedGlobally = (window as any)[pkg] !== undefined;

    if (!isLoaded && !isUsedGlobally) {
      unusedPackages.push(pkg);
    }
  }

  // Estimate size reduction (average package size ~50KB)
  const estimatedReduction = unusedPackages.length * 50 * 1024;

  return {
    unused: unusedPackages,
    potentialSize: unusedPackages.length * 50000,
    estimatedReduction,
  };
}

/**
 * Analyze module exports and usage
 *
 * Identifies exported items that might not be used
 */
export function analyzeModuleExports(
  moduleName: string,
  config: TreeShakingConfig = {}
): ModuleAnalysis {
  const { verbose = false } = config;

  // This is a heuristic-based analysis
  // In production, use static analysis tools like webpack-bundle-analyzer

  const analysis: ModuleAnalysis = {
    name: moduleName,
    size: 0,
    exported: [],
    used: [],
    unused: [],
    usagePercent: 0,
  };

  if (typeof window === "undefined") {
    return analysis;
  }

  // Try to access the module
  const moduleRef = (window as any)[moduleName];

  if (!moduleRef) {
    if (verbose) {
      console.warn(`Module ${moduleName} not found on window`);
    }
    return analysis;
  }

  // Get all exports
  const exports = Object.keys(moduleRef);
  analysis.exported = exports;

  // Heuristic: assume commonly named exports are used
  const likelyUsed = [
    "default",
    "Component",
    "App",
    "Provider",
    "hook",
    "util",
    "helper",
  ];

  // Split into used and unused
  exports.forEach((exp) => {
    if (
      likelyUsed.some((word) => exp.toLowerCase().includes(word)) ||
      (config.knownUsed && config.knownUsed[moduleName]?.includes(exp))
    ) {
      analysis.used.push(exp);
    } else {
      analysis.unused.push(exp);
    }
  });

  analysis.usagePercent =
    exports.length > 0 ? (analysis.used.length / exports.length) * 100 : 0;

  if (verbose && analysis.unused.length > 0) {
    console.log(`${moduleName} - Potentially unused exports:`, analysis.unused);
  }

  return analysis;
}

/**
 * Check for dead code patterns
 *
 * Identifies common dead code patterns that tree-shakers might miss
 */
export function checkDeadCodePatterns(): {
  patterns: Array<{
    type: string;
    description: string;
    count: number;
  }>;
  estimatedSavings: number;
} {
  const patterns: Array<{
    type: string;
    description: string;
    count: number;
  }> = [];

  if (typeof window === "undefined") {
    return {
      patterns,
      estimatedSavings: 0,
    };
  }

  let estimatedSavings = 0;

  // Check for console statements in production
  const consoleRegex = /console\.(log|warn|error|info|debug)/g;
  const consoleMatches = new RegExp(consoleRegex);
  if (consoleMatches.test(document.body.innerText)) {
    patterns.push({
      type: "console-statements",
      description: "Remove console.log statements in production",
      count: 1,
    });
    estimatedSavings += 5 * 1024; // ~5KB savings
  }

  // Check for commented-out code
  const scripts = document.querySelectorAll("script");
  let commentedCodeCount = 0;
  scripts.forEach((script) => {
    const matches = (script.textContent || "").match(/\/\/.*|\/\*[\s\S]*?\*\//g);
    if (matches) {
      commentedCodeCount += matches.length;
    }
  });

  if (commentedCodeCount > 0) {
    patterns.push({
      type: "commented-code",
      description: "Remove commented-out code",
      count: commentedCodeCount,
    });
    estimatedSavings += 10 * 1024; // ~10KB savings
  }

  // Check for unused CSS classes
  const styles = document.querySelectorAll("style");
  let unusedStyleCount = 0;
  styles.forEach((style) => {
    const cssText = style.textContent || "";
    // Simple heuristic: count all classes and approximate unused
    const allClasses = cssText.match(/\.\w+/g) || [];
    unusedStyleCount += Math.ceil(allClasses.length * 0.2); // Assume 20% unused
  });

  if (unusedStyleCount > 0) {
    patterns.push({
      type: "unused-css",
      description: "Remove unused CSS classes",
      count: unusedStyleCount,
    });
    estimatedSavings += 15 * 1024; // ~15KB savings
  }

  return {
    patterns,
    estimatedSavings,
  };
}

/**
 * Analyze dependency bundle sizes
 *
 * Identifies the most expensive dependencies
 */
export function analyzeDependencySize(): Array<{
  name: string;
  size: number;
  minified: number;
  gzipped: number;
  priority: "critical" | "high" | "medium" | "low";
}> {
  // This data would come from a bundle analyzer
  // Here we return estimated sizes for common packages

  const dependencies = [
    {
      name: "react",
      size: 42000,
      minified: 42000,
      gzipped: 13000,
    },
    {
      name: "next",
      size: 150000,
      minified: 150000,
      gzipped: 45000,
    },
    {
      name: "react-dom",
      size: 128000,
      minified: 128000,
      gzipped: 35000,
    },
  ];

  return dependencies.map((dep) => ({
    ...dep,
    priority: dep.gzipped > 50000 ? "critical" : dep.gzipped > 20000 ? "high" : dep.gzipped > 10000 ? "medium" : "low",
  }));
}

/**
 * Recommend tree-shaking configuration
 *
 * Provides webpack/bundler configuration recommendations
 */
export function getTreeShakingRecommendations(): {
  webpackConfig: {
    mode: string;
    optimization: Record<string, any>;
    module: Record<string, any>;
  };
  packageJsonConfig: {
    sideEffects: string[] | boolean;
  };
  recommendations: string[];
} {
  const recommendations: string[] = [
    "Set mode: 'production' for automatic minification and tree-shaking",
    "Enable usedExports: true in optimization for better dead code elimination",
    "Configure sideEffects: false in package.json if no global imports are used",
    "Use ESM imports instead of CommonJS for better tree-shaking",
    "Remove source maps in production for smaller bundle size",
    "Use dynamic imports for route-based code splitting",
  ];

  return {
    webpackConfig: {
      mode: "production",
      optimization: {
        usedExports: true,
        sideEffects: true,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              priority: 10,
            },
          },
        },
        minimize: true,
        minimizer: [
          {
            implementation: "TerserPlugin",
            options: {
              compress: {
                drop_console: true,
              },
            },
          },
        ],
      },
      module: {
        rules: [
          {
            test: /\.js$/,
            sideEffects: false,
          },
        ],
      },
    },
    packageJsonConfig: {
      sideEffects: false,
    },
    recommendations,
  };
}

/**
 * Estimate tree-shaking savings
 *
 * Based on current analysis, estimate how much could be saved
 */
export function estimateTreeShakingSavings(config: TreeShakingConfig = {}): {
  estimatedSavings: number;
  percentageSavings: number;
  breakdown: Array<{
    category: string;
    savings: number;
  }>;
  recommendations: string[];
} {
  const deadCodeAnalysis = checkDeadCodePatterns();
  const unusedAnalysis = detectUnusedDependencies();

  const breakdown: Array<{
    category: string;
    savings: number;
  }> = [];

  // Dead code savings
  deadCodeAnalysis.patterns.forEach((pattern) => {
    breakdown.push({
      category: pattern.type,
      savings: deadCodeAnalysis.estimatedSavings / deadCodeAnalysis.patterns.length,
    });
  });

  // Add unused dependencies
  if (unusedAnalysis.estimatedReduction > 0) {
    breakdown.push({
      category: "unused-dependencies",
      savings: unusedAnalysis.estimatedReduction,
    });
  }

  const totalSavings = breakdown.reduce((sum, item) => sum + item.savings, 0);
  const estimatedCurrentSize = 500 * 1024; // Estimate
  const percentageSavings = (totalSavings / estimatedCurrentSize) * 100;

  const recommendations: string[] = [
    "Enable production mode for automatic optimizations",
    "Use tree-shaking compatible imports (ESM)",
    "Remove unused dependencies",
    ...deadCodeAnalysis.patterns.map((p) => p.description),
  ];

  return {
    estimatedSavings: totalSavings,
    percentageSavings: Math.round(percentageSavings * 100) / 100,
    breakdown,
    recommendations,
  };
}

/**
 * Generate tree-shaking optimization report
 */
export function generateTreeShakingReport(): string {
  const savings = estimateTreeShakingSavings();
  const deadCode = checkDeadCodePatterns();

  let report = `Tree Shaking & Dead Code Analysis Report\n`;
  report += `=========================================\n\n`;

  report += `Estimated Savings: ${(savings.estimatedSavings / 1024).toFixed(2)} KB (${savings.percentageSavings.toFixed(1)}%)\n\n`;

  if (deadCode.patterns.length > 0) {
    report += `Dead Code Patterns Found:\n`;
    deadCode.patterns.forEach((pattern) => {
      report += `  - ${pattern.type}: ${pattern.description} (${pattern.count} instances)\n`;
    });
    report += "\n";
  }

  report += `Recommendations:\n`;
  savings.recommendations.forEach((rec) => {
    report += `  - ${rec}\n`;
  });

  return report;
}
