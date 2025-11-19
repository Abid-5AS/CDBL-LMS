/**
 * OptimizedImage Component
 *
 * A component for delivering optimized, responsive images
 */

"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  getImageUrl,
  getResponsiveImageSrcSet,
  getResponsiveImageSizes,
  recordImageLoadMetrics,
} from "@/lib/performance/imageOptimization";
import { recordRenderMetric } from "@/lib/performance/metrics";

/**
 * Optimized image props
 */
export interface OptimizedImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Image source URL */
  src: string;

  /** Alt text for accessibility */
  alt: string;

  /** Width in pixels */
  width?: number;

  /** Height in pixels */
  height?: number;

  /** Image aspect ratio (width/height) */
  aspectRatio?: number;

  /** Loading strategy */
  loading?: "lazy" | "eager";

  /** Image quality (0-100) */
  quality?: number;

  /** Responsive breakpoints */
  breakpoints?: Record<string, number>;

  /** Enable blur placeholder while loading */
  blurPlaceholder?: boolean;

  /** Placeholder color */
  placeholderColor?: string;

  /** Callback when image loads */
  onLoadComplete?: (element: HTMLImageElement) => void;

  /** Track load metrics */
  trackMetrics?: boolean;

  /** CSS class name */
  className?: string;

  /** Container class for responsive images */
  containerClassName?: string;

  /** Priority image (disables lazy loading) */
  priority?: boolean;
}

/**
 * OptimizedImage component
 *
 * Delivers optimized, responsive images with lazy loading support
 *
 * @example
 * ```tsx
 * <OptimizedImage
 *   src="/images/profile.jpg"
 *   alt="User profile"
 *   width={400}
 *   height={400}
 *   quality={80}
 *   loading="lazy"
 *   trackMetrics={true}
 * />
 * ```
 */
export const OptimizedImage = React.forwardRef<
  HTMLImageElement,
  OptimizedImageProps
>(
  (
    {
      src,
      alt,
      width,
      height,
      aspectRatio,
      quality = 80,
      loading = "lazy",
      breakpoints,
      blurPlaceholder = false,
      placeholderColor = "#f0f0f0",
      onLoadComplete,
      trackMetrics = true,
      className = "",
      containerClassName = "",
      priority = false,
      ...rest
    },
    ref
  ) => {
    const [isLoading, setIsLoading] = useState(!priority);
    const [error, setError] = useState<Error | null>(null);
    const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const loadStartTimeRef = useRef<number>(0);

    // Generate responsive image URLs
    const srcSet = getResponsiveImageSrcSet(src, [640, 750, 1080, 1536, 2048]);
    const sizes = getResponsiveImageSizes(breakpoints);
    const optimizedSrc = getImageUrl(src, width, quality);

    // Calculate dimensions if aspect ratio is provided
    useEffect(() => {
      if (aspectRatio && width) {
        setDimensions({
          width,
          height: Math.round(width / aspectRatio),
        });
      } else if (width && height) {
        setDimensions({ width, height });
      }
    }, [width, height, aspectRatio]);

    // Handle image load
    const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
      const loadTime = performance.now() - loadStartTimeRef.current;

      setIsLoading(false);
      setError(null);

      // Track metrics
      if (trackMetrics) {
        const img = e.currentTarget;
        const format =
          optimizedSrc.includes("webp") ?
            "webp" :
            optimizedSrc.includes("avif") ?
            "avif" :
            "jpeg";

        recordImageLoadMetrics(src, loadTime, 0, format);
        recordRenderMetric("OptimizedImage", loadTime);
      }

      // Call callback
      onLoadComplete?.(e.currentTarget);
    };

    // Handle image error
    const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
      setIsLoading(false);
      setError(new Error(`Failed to load image: ${src}`));
      console.warn(`Failed to load image: ${src}`);
    };

    // Initialize load tracking
    useEffect(() => {
      loadStartTimeRef.current = performance.now();
    }, [src]);

    // Intersection observer for lazy loading
    useEffect(() => {
      if (priority || loading === "eager") {
        setIsLoading(true);
        return;
      }

      if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
        setIsLoading(true);
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsLoading(true);
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "50px" }
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => {
        observer.disconnect();
      };
    }, [loading, priority]);

    // Error fallback
    if (error && !isLoading) {
      return (
        <div
          className={containerClassName}
          style={{
            backgroundColor: placeholderColor,
            width: dimensions?.width,
            height: dimensions?.height,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            color: "#999",
          }}
        >
          Image failed to load
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className={containerClassName}
        style={{
          position: "relative",
          overflow: "hidden",
          backgroundColor: blurPlaceholder ? placeholderColor : "transparent",
          width: dimensions?.width,
          height: dimensions?.height,
        }}
      >
        {/* Blur placeholder */}
        {blurPlaceholder && isLoading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: placeholderColor,
              animation: "pulse 2s infinite",
              zIndex: 1,
            }}
          />
        )}

        {/* Main image */}
        {isLoading && (
          <picture>
            {/* AVIF format */}
            <source
              srcSet={srcSet.replace(/\w+=([\d]+)w/g, "webp").replace("webp", "avif")}
              type="image/avif"
            />

            {/* WebP format */}
            <source
              srcSet={srcSet}
              type="image/webp"
            />

            {/* Fallback JPEG */}
            <img
              ref={imgRef || ref}
              src={optimizedSrc}
              srcSet={srcSet}
              sizes={sizes}
              alt={alt}
              loading={priority ? "eager" : loading}
              decoding="async"
              onLoad={handleLoad}
              onError={handleError}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                zIndex: 2,
              }}
              className={className}
              {...rest}
            />
          </picture>
        )}

        {/* CSS for pulse animation */}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }
);

OptimizedImage.displayName = "OptimizedImage";

/**
 * Preload image
 */
export function preloadImage(src: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "image";
  link.href = src;
  document.head.appendChild(link);
}

/**
 * Prefetch image
 */
export function prefetchImage(src: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = src;
  document.head.appendChild(link);
}
