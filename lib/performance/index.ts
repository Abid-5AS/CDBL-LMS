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

// Bundle analysis
export {
  analyzeBundleSize,
  estimateBundleReductionPotential,
  getBundleSizeComparison,
  analyzeBundleComposition,
  getBundleSummary,
  exportBundleAnalysis,
  type BundleMetadata,
  type BundleAnalysisResult,
} from "./bundleAnalysis";

// Tree shaking and dead code
export {
  detectUnusedDependencies,
  analyzeModuleExports,
  checkDeadCodePatterns,
  analyzeDependencySize,
  getTreeShakingRecommendations,
  estimateTreeShakingSavings,
  generateTreeShakingReport,
  type ModuleAnalysis,
  type UnusedExport,
  type SideEffectsAnalysis,
} from "./treeshaking";

// Lazy loading
export {
  dynamicImport,
  getImportMetrics,
  clearImportCache,
  useIntersectionObserver,
  preloadRoute,
  createRoutePrefetcher,
  recordComponentLazyLoad,
  analyzeCodeSplittingOpportunities,
  preloadCriticalResources,
  prefetchResources,
  getLazyLoadingSummary,
  type DynamicImportResult,
  type ChunkLoadStrategy,
} from "./lazyLoading";

// Code splitting
export {
  getOptimalSplitChunksConfig,
  getRouteChunksConfig,
  getWebpackOptimizationConfig,
  getNextJsOptimizationConfig,
  analyzeDependencies,
  getChunkSizeWarnings,
  getCodeSplittingStrategy,
  createChunkBudget,
  checkChunkBudget,
  getCodeSplittingRecommendations,
  generateCodeSplittingReport,
  type ChunkConfig,
  type ChunkAnalysis,
} from "./codeSplitting";
