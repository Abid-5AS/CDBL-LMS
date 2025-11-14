/**
 * Code Splitting Utilities
 *
 * Advanced strategies for code splitting and chunk optimization
 */

import { recordCustomMetric } from "./metrics";

/**
 * Chunk configuration
 */
export interface ChunkConfig {
  name: string;
  pattern: RegExp;
  priority: number;
  minSize?: number;
  maxSize?: number;
}

/**
 * Chunk analysis result
 */
export interface ChunkAnalysis {
  chunks: Array<{
    name: string;
    modules: number;
    size: number;
    gzipSize: number;
  }>;
  totalSize: number;
  totalGzipSize: number;
  recommendations: string[];
}

/**
 * Webpack split chunks configuration
 */
export function getOptimalSplitChunksConfig(): Record<string, any> {
  return {
    chunks: "all",
    minSize: 20000,
    maxSize: 244000,
    minChunks: 1,
    maxAsyncRequests: 30,
    maxInitialRequests: 30,
    cacheGroups: {
      // Vendor code
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: "vendors",
        priority: 10,
        reuseExistingChunk: true,
        minSize: 0,
      },

      // React-specific vendor
      react: {
        test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
        name: "vendors-react",
        priority: 20,
      },

      // UI libraries
      ui: {
        test: /[\\/]node_modules[\\/](nextui|tailwindcss|framer-motion)[\\/]/,
        name: "vendors-ui",
        priority: 15,
      },

      // Common code
      common: {
        minChunks: 2,
        priority: 5,
        reuseExistingChunk: true,
        name: "common",
      },

      // Utilities
      utils: {
        test: /[\\/]lib[\\/]/,
        name: "utils",
        priority: 8,
      },

      // Styles
      styles: {
        type: "css/mini-extract",
        chunks: "all",
        enforce: true,
      },
    },
  };
}

/**
 * Route-based chunk configuration
 */
export function getRouteChunksConfig(): ChunkConfig[] {
  return [
    {
      name: "dashboard",
      pattern: /dashboard/,
      priority: 10,
      maxSize: 300000,
    },
    {
      name: "leaves",
      pattern: /leaves|leave/,
      priority: 10,
      maxSize: 300000,
    },
    {
      name: "users",
      pattern: /users|management/,
      priority: 9,
      maxSize: 250000,
    },
    {
      name: "reports",
      pattern: /reports/,
      priority: 8,
      maxSize: 400000,
    },
    {
      name: "settings",
      pattern: /settings|config/,
      priority: 7,
      maxSize: 200000,
    },
  ];
}

/**
 * Get webpack configuration for optimal code splitting
 */
export function getWebpackOptimizationConfig(): Record<string, any> {
  return {
    minimize: true,
    minimizer: [
      {
        implementation: "TerserPlugin",
        options: {
          terserOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true,
            },
            output: {
              comments: false,
            },
          },
          extractComments: false,
        },
      },
    ],
    runtimeChunk: "single",
    moduleIds: "deterministic",
    splitChunks: getOptimalSplitChunksConfig(),
  };
}

/**
 * Next.js specific optimization
 */
export function getNextJsOptimizationConfig(): Record<string, any> {
  return {
    swcMinify: true,
    compress: true,
    productionBrowserSourceMaps: false,
    webpack: (config: any) => {
      config.optimization = {
        ...config.optimization,
        ...getWebpackOptimizationConfig(),
      };
      return config;
    },
  };
}

/**
 * Analyze module dependencies for splitting
 */
export function analyzeDependencies(): {
  circularDeps: string[];
  heavyModules: Array<{ module: string; size: number }>;
  recommendations: string[];
} {
  const recommendations: string[] = [
    "Extract common utilities into shared chunks",
    "Split vendor dependencies into separate chunk",
    "Create route-specific chunks for lazy loading",
    "Move heavy libraries to on-demand imports",
    "Consider splitting Redux/state management if large",
  ];

  return {
    circularDeps: [
      // Would be detected by static analysis
    ],
    heavyModules: [
      // Would be identified by bundle analysis
    ],
    recommendations,
  };
}

/**
 * Get chunk size warnings
 */
export function getChunkSizeWarnings(chunks: Array<{
  name: string;
  size: number;
}>): Array<{
  chunk: string;
  size: number;
  severity: "warning" | "error";
  message: string;
}> {
  const warnings: Array<{
    chunk: string;
    size: number;
    severity: "warning" | "error";
    message: string;
  }> = [];

  chunks.forEach((chunk) => {
    if (chunk.size > 500000) {
      warnings.push({
        chunk: chunk.name,
        size: chunk.size,
        severity: "error",
        message: `Chunk "${chunk.name}" exceeds 500KB limit (${(chunk.size / 1024).toFixed(2)}KB)`,
      });
    } else if (chunk.size > 250000) {
      warnings.push({
        chunk: chunk.name,
        size: chunk.size,
        severity: "warning",
        message: `Chunk "${chunk.name}" exceeds 250KB recommendation (${(chunk.size / 1024).toFixed(2)}KB)`,
      });
    }
  });

  return warnings;
}

/**
 * Recommend code splitting strategy
 */
export function getCodeSplittingStrategy(): {
  strategy: string;
  config: Record<string, any>;
  steps: string[];
} {
  return {
    strategy: "route-based + vendor splitting",
    config: getOptimalSplitChunksConfig(),
    steps: [
      "1. Separate vendor code into vendors chunk (~200KB)",
      "2. Create route-specific chunks for major routes (~100-150KB each)",
      "3. Extract common code shared across routes (~50KB)",
      "4. Lazy load non-critical routes and modals",
      "5. Monitor chunk sizes and adjust thresholds as needed",
    ],
  };
}

/**
 * Create chunk size budget
 */
export function createChunkBudget(): Record<string, number> {
  return {
    "vendors": 250000, // 250KB
    "vendors-react": 150000, // 150KB
    "vendors-ui": 100000, // 100KB
    "main": 200000, // 200KB
    "common": 100000, // 100KB
    "utils": 80000, // 80KB
    "dashboard": 150000, // 150KB
    "leaves": 150000, // 150KB
    "users": 120000, // 120KB
    "reports": 180000, // 180KB
    "settings": 80000, // 80KB
  };
}

/**
 * Check if chunks exceed budget
 */
export function checkChunkBudget(
  chunks: Record<string, number>,
  budget: Record<string, number> = createChunkBudget()
): Array<{
  chunk: string;
  current: number;
  budget: number;
  exceeded: number;
}> {
  const exceeded: Array<{
    chunk: string;
    current: number;
    budget: number;
    exceeded: number;
  }> = [];

  Object.entries(chunks).forEach(([chunk, size]) => {
    const limit = budget[chunk] || budget["main"] || 200000;
    if (size > limit) {
      exceeded.push({
        chunk,
        current: size,
        budget: limit,
        exceeded: size - limit,
      });
    }
  });

  return exceeded;
}

/**
 * Get code splitting recommendations
 */
export function getCodeSplittingRecommendations(): string[] {
  return [
    "Use route-based code splitting for SPA applications",
    "Implement lazy loading for non-critical routes",
    "Separate vendor code into dedicated chunks",
    "Extract common code into shared chunks",
    "Monitor chunk sizes and set budget limits",
    "Use dynamic imports for conditional code loading",
    "Implement prefetching for anticipated next routes",
    "Consider implementing service worker for caching chunks",
  ];
}

/**
 * Generate code splitting report
 */
export function generateCodeSplittingReport(chunks: Record<string, number>): string {
  const budget = createChunkBudget();
  const exceeded = checkChunkBudget(chunks, budget);

  let report = `Code Splitting & Bundle Optimization Report\n`;
  report += `===========================================\n\n`;

  report += `Chunk Analysis:\n`;
  Object.entries(chunks).forEach(([chunk, size]) => {
    const limit = budget[chunk] || 200000;
    const status = size > limit ? "❌" : size > limit * 0.8 ? "⚠️ " : "✅";
    report += `  ${status} ${chunk}: ${(size / 1024).toFixed(2)}KB / ${(limit / 1024).toFixed(2)}KB\n`;
  });

  if (exceeded.length > 0) {
    report += `\nChunks Exceeding Budget:\n`;
    exceeded.forEach((item) => {
      report += `  ❌ ${item.chunk}: ${(item.exceeded / 1024).toFixed(2)}KB over budget\n`;
    });
  }

  report += `\nRecommendations:\n`;
  getCodeSplittingRecommendations().forEach((rec) => {
    report += `  - ${rec}\n`;
  });

  return report;
}
