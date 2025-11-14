/**
 * API Library
 *
 * Export all API optimization utilities
 */

// API optimization
export {
  RequestDeduplicator,
  RequestBatcher,
  APIMemoizer,
  ConnectionPool,
  createOptimizedFetch,
  getAPIOptimizationRecommendations,
  generateAPIOptimizationReport,
  type RequestDeduplicationKey,
  type BatchRequest,
  type BatchResponse,
} from "./optimization";
