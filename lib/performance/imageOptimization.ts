/**
 * Image Optimization
 *
 * Utilities for optimizing image loading and delivery
 */

import { recordCustomMetric } from "./metrics";

/**
 * Image format configuration
 */
export interface ImageFormat {
  format: "webp" | "avif" | "jpeg" | "png" | "jpg";
  quality?: number;
  width?: number;
}

/**
 * Responsive image configuration
 */
export interface ResponsiveImageConfig {
  src: string;
  alt: string;
  sizes?: string;
  srcSet?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
}

/**
 * Image loading strategy
 */
export type ImageLoadingStrategy = "lazy" | "eager" | "on-visibility";

/**
 * Track image loading performance
 */
const imageLoadingMetrics = new Map<string, {
  loadTime: number;
  size: number;
  format: string;
}>();

/**
 * Get responsive image srcSet
 *
 * Generates srcSet for responsive image delivery
 */
export function getResponsiveImageSrcSet(
  basePath: string,
  widths: number[] = [640, 750, 1080, 1536, 2048]
): string {
  return widths
    .map((width) => `${getImageUrl(basePath, width)} ${width}w`)
    .join(", ");
}

/**
 * Get optimized image URL
 *
 * Returns CDN URL for optimized image
 */
export function getImageUrl(
  basePath: string,
  width?: number,
  quality: number = 80
): string {
  // This would integrate with image CDN (Cloudinary, Imgix, etc.)
  // For now, return base path with query params
  const url = new URL(basePath, typeof window !== "undefined" ? window.location.origin : "");

  if (width) {
    url.searchParams.set("w", width.toString());
  }

  url.searchParams.set("q", quality.toString());

  return url.toString();
}

/**
 * Get responsive image sizes
 *
 * Returns sizes attribute for responsive images
 */
export function getResponsiveImageSizes(
  breakpoints: Record<string, number> = {
    mobile: 640,
    tablet: 1024,
    desktop: 1536,
  }
): string {
  const sizes = Object.entries(breakpoints)
    .map(([, width]) => `${width}px`)
    .join(", ");

  return `(max-width: 640px) ${breakpoints.mobile}px, (max-width: 1024px) ${breakpoints.tablet}px, ${breakpoints.desktop}px`;
}

/**
 * Calculate optimal image dimensions
 */
export function calculateOptimalDimensions(
  containerWidth: number,
  aspectRatio: number
): { width: number; height: number } {
  return {
    width: containerWidth,
    height: Math.round(containerWidth / aspectRatio),
  };
}

/**
 * Get image compression recommendations
 */
export function getImageCompressionRecommendations(): Array<{
  format: string;
  quality: number;
  description: string;
  fileSize: string;
}> {
  return [
    {
      format: "AVIF",
      quality: 70,
      description: "Modern format with best compression (not all browsers)",
      fileSize: "~20% of original",
    },
    {
      format: "WebP",
      quality: 75,
      description: "Good compression with wide browser support",
      fileSize: "~30% of original",
    },
    {
      format: "JPEG",
      quality: 80,
      description: "Universal format, good for photos",
      fileSize: "~40% of original",
    },
    {
      format: "PNG",
      quality: 100,
      description: "Lossless compression, best for graphics",
      fileSize: "~60-80% of original",
    },
  ];
}

/**
 * Generate picture element markup
 */
export function generatePictureElement(
  config: ResponsiveImageConfig
): string {
  const {
    src,
    alt,
    sizes,
    width,
    height,
    quality = 80,
  } = config;

  let markup = '<picture>\n';

  // AVIF format
  const avifUrl = getImageUrl(src, width, quality);
  markup += `  <source srcset="${avifUrl}&fm=avif" type="image/avif">\n`;

  // WebP format
  const webpUrl = getImageUrl(src, width, quality);
  markup += `  <source srcset="${webpUrl}&fm=webp" type="image/webp">\n`;

  // Fallback image
  const jpegUrl = getImageUrl(src, width, quality);
  markup += `  <img src="${jpegUrl}" alt="${alt}"`;

  if (width) markup += ` width="${width}"`;
  if (height) markup += ` height="${height}"`;
  if (sizes) markup += ` sizes="${sizes}"`;

  markup += ` loading="lazy" decoding="async">\n`;
  markup += '</picture>';

  return markup;
}

/**
 * Analyze image performance
 */
export function analyzeImagePerformance(): {
  totalImages: number;
  lazyLoadedImages: number;
  eagerLoadedImages: number;
  optimizedImages: number;
  opportunities: string[];
} {
  if (typeof window === "undefined" || !document) {
    return {
      totalImages: 0,
      lazyLoadedImages: 0,
      eagerLoadedImages: 0,
      optimizedImages: 0,
      opportunities: [],
    };
  }

  const images = document.querySelectorAll("img");
  let lazyLoadedImages = 0;
  let eagerLoadedImages = 0;
  let optimizedImages = 0;
  const opportunities: string[] = [];

  images.forEach((img) => {
    // Check lazy loading
    if (img.loading === "lazy") {
      lazyLoadedImages++;
    } else {
      eagerLoadedImages++;
    }

    // Check if optimized
    if (
      img.src.includes("?w=") ||
      img.src.includes("&q=") ||
      img.srcset
    ) {
      optimizedImages++;
    } else {
      opportunities.push(`Image "${img.alt}" could be optimized with width/quality params`);
    }

    // Check if has srcset
    if (!img.srcset) {
      opportunities.push(`Image "${img.alt}" should have srcset for responsive delivery`);
    }
  });

  return {
    totalImages: images.length,
    lazyLoadedImages,
    eagerLoadedImages,
    optimizedImages,
    opportunities: opportunities.slice(0, 5), // Top 5 opportunities
  };
}

/**
 * Get image optimization strategy
 */
export function getImageOptimizationStrategy(): {
  recommendations: string[];
  implementation: string[];
  benefits: string[];
} {
  return {
    recommendations: [
      "Use modern formats: AVIF > WebP > JPEG for photos, PNG for graphics",
      "Implement responsive images with srcSet and sizes attributes",
      "Lazy load below-the-fold images with loading='lazy'",
      "Optimize quality: 75-85 for photos, 80-90 for graphics",
      "Use CDN with automatic format negotiation",
      "Compress all images before upload",
      "Use Next.js Image component or similar optimization",
    ],
    implementation: [
      "1. Set up image CDN (Cloudinary, Imgix, etc.)",
      "2. Create OptimizedImage component wrapper",
      "3. Update all img tags to use new component",
      "4. Implement lazy loading for non-critical images",
      "5. Add responsive image sizes and srcSet",
      "6. Monitor image load performance",
    ],
    benefits: [
      "30-50% reduction in image file sizes",
      "Faster page load times",
      "Better Core Web Vitals (LCP, CLS)",
      "Improved SEO ranking",
      "Better user experience on slow networks",
      "Reduced bandwidth costs",
    ],
  };
}

/**
 * Record image load metrics
 */
export function recordImageLoadMetrics(
  imageSrc: string,
  loadTime: number,
  size: number,
  format: string
): void {
  imageLoadingMetrics.set(imageSrc, {
    loadTime,
    size,
    format,
  });

  recordCustomMetric("Image Load Time", loadTime, "ms", {
    type: "image",
    format,
  });

  recordCustomMetric("Image Size", size, "bytes", {
    type: "image",
    format,
  });
}

/**
 * Get image metrics summary
 */
export function getImageMetricsSummary(): string {
  let summary = `Image Optimization Metrics\n`;
  summary += `==========================\n`;

  if (imageLoadingMetrics.size === 0) {
    summary += `No image metrics recorded yet.\n`;
    return summary;
  }

  let totalLoadTime = 0;
  let totalSize = 0;
  const formatStats: Record<string, { count: number; totalTime: number; totalSize: number }> = {};

  imageLoadingMetrics.forEach(({ loadTime, size, format }) => {
    totalLoadTime += loadTime;
    totalSize += size;

    if (!formatStats[format]) {
      formatStats[format] = { count: 0, totalTime: 0, totalSize: 0 };
    }

    formatStats[format].count++;
    formatStats[format].totalTime += loadTime;
    formatStats[format].totalSize += size;
  });

  summary += `\nTotal Images: ${imageLoadingMetrics.size}\n`;
  summary += `Total Load Time: ${totalLoadTime.toFixed(2)}ms\n`;
  summary += `Total Size: ${(totalSize / 1024 / 1024).toFixed(2)}MB\n`;
  summary += `Average Image Size: ${((totalSize / imageLoadingMetrics.size) / 1024).toFixed(2)}KB\n`;
  summary += `Average Load Time: ${(totalLoadTime / imageLoadingMetrics.size).toFixed(2)}ms\n`;

  summary += `\nBy Format:\n`;
  Object.entries(formatStats).forEach(([format, stats]) => {
    summary += `  ${format}: ${stats.count} images, ${(stats.totalSize / 1024 / 1024).toFixed(2)}MB, ${(stats.totalTime / stats.count).toFixed(2)}ms avg\n`;
  });

  return summary;
}

/**
 * Generate image optimization report
 */
export function generateImageOptimizationReport(): string {
  const performance = analyzeImagePerformance();
  const strategy = getImageOptimizationStrategy();

  let report = `Image Optimization Report\n`;
  report += `=========================\n\n`;

  report += `Current State:\n`;
  report += `  Total Images: ${performance.totalImages}\n`;
  report += `  Lazy Loaded: ${performance.lazyLoadedImages}\n`;
  report += `  Eager Loaded: ${performance.eagerLoadedImages}\n`;
  report += `  Optimized: ${performance.optimizedImages}\n`;

  if (performance.opportunities.length > 0) {
    report += `\nOptimization Opportunities:\n`;
    performance.opportunities.forEach((opp) => {
      report += `  - ${opp}\n`;
    });
  }

  report += `\nRecommended Strategy:\n`;
  strategy.recommendations.forEach((rec) => {
    report += `  - ${rec}\n`;
  });

  report += `\nImplementation Steps:\n`;
  strategy.implementation.forEach((step) => {
    report += `  ${step}\n`;
  });

  report += `\nExpected Benefits:\n`;
  strategy.benefits.forEach((benefit) => {
    report += `  ✓ ${benefit}\n`;
  });

  return report;
}
