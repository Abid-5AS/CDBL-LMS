# Performance Optimization Guide

## Overview

This guide covers the comprehensive performance optimization system built into the CDBL-LMS application. The system is designed to achieve excellent Core Web Vitals scores and provide a fast, responsive user experience.

## Quick Start

### Initialize Performance Monitoring

```typescript
// In your app/layout.tsx or _app.tsx
import { initializePerformanceMonitoring } from "@/lib/performance";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    initializePerformanceMonitoring();
  }, []);

  return <html>{children}</html>;
}
```

### Monitor Performance in Components

```typescript
import { usePerformanceMonitor } from "@/hooks";

function Dashboard() {
  const { metrics, getHealthScore } = usePerformanceMonitor({
    autoStart: true,
  });

  console.log("Performance Score:", getHealthScore());
  return <div>Dashboard</div>;
}
```

### Optimize API Calls

```typescript
import { useOptimizedAPI } from "@/hooks";

function UserList() {
  const { data, loading, error } = useOptimizedAPI<User[]>(
    "/api/users",
    {
      deduplication: true,
      memoization: true,
      autoFetch: true,
    }
  );

  return <div>{/* render users */}</div>;
}
```

### Optimize Images

```typescript
import { OptimizedImage } from "@/components/images";

function Profile() {
  return (
    <OptimizedImage
      src="/images/profile.jpg"
      alt="User profile"
      width={400}
      height={400}
      quality={80}
      loading="lazy"
      trackMetrics={true}
    />
  );
}
```

## Performance Targets

The system targets these Core Web Vitals:

- **LCP (Largest Contentful Paint)**: < 2.5 seconds
- **FID (First Input Delay)**: < 100 milliseconds
- **CLS (Cumulative Layout Shift)**: < 0.1
- **FCP (First Contentful Paint)**: < 1.8 seconds
- **TTFB (Time to First Byte)**: < 600 milliseconds

## Performance Features

### 1. Metrics Collection & Monitoring

**Files:**
- `lib/performance/metrics.ts` - Core metrics collection
- `lib/performance/monitoring.ts` - Web Vitals tracking
- `hooks/usePerformanceMonitor.ts` - React hook

**Features:**
- Automatic Web Vitals tracking (LCP, FID, CLS, FCP, TTFB)
- Custom metric recording
- Component render time tracking
- API response time monitoring
- Memory usage tracking
- Network information collection
- Layout shift monitoring
- Resource loading analysis

**Usage:**

```typescript
import {
  recordWebVital,
  recordCustomMetric,
  recordRenderMetric,
  recordApiMetric
} from "@/lib/performance";

// Record metrics
recordWebVital("LCP", 1500);
recordCustomMetric("User Action", 200, "ms");
recordRenderMetric("HomePage", 150);
recordApiMetric("/api/users", "GET", 250, 200, 5000);

// Monitor with hook
const { metrics, areMetricsHealthy, getHealthScore } = usePerformanceMonitor();
```

### 2. Bundle Analysis & Optimization

**Files:**
- `lib/performance/bundleAnalysis.ts` - Bundle size analysis
- `lib/performance/treeshaking.ts` - Tree-shaking utilities

**Features:**
- Bundle size analysis by type
- Code composition breakdown
- Tree-shaking detection
- Dead code pattern identification
- Unused dependency detection
- Chunk size comparison
- Reduction potential estimation

**Usage:**

```typescript
import {
  analyzeBundleSize,
  estimateBundleReductionPotential,
  generateTreeShakingReport
} from "@/lib/performance";

const analysis = analyzeBundleSize();
console.log(`Total Bundle Size: ${(analysis.totalSize / 1024).toFixed(2)}KB`);

const potential = estimateBundleReductionPotential();
console.log(`Potential Reduction: ${potential.percentageReduction}%`);

console.log(generateTreeShakingReport());
```

### 3. Caching Strategies

**Files:**
- `lib/cache/strategies.ts` - LRU and TTL caching
- `lib/cache/invalidation.ts` - Invalidation management
- `hooks/useCache.ts` - React hooks

**Strategies Implemented:**
- **LRU Cache**: Least Recently Used with size limits
- **TTL Cache**: Time-To-Live based expiration
- **Write-Through**: Immediate consistency
- **Write-Back**: Async persistence
- **Stale-While-Revalidate**: Best UX
- **Cache-Aside**: Lazy loading pattern

**Usage:**

```typescript
import { useCache, useAsyncCache } from "@/hooks";
import { LRUCache, TTLCache } from "@/lib/cache";

// Use React hook
const { get, set, clear } = useCache<User>({
  strategy: "lru",
  ttl: 300000,
  maxSize: 1024 * 1024,
});

// Or use directly
const cache = new LRUCache<User>(10, 300000);
cache.set("user-1", userData);

// Async cache with fetcher
const { fetchAndCache, loading } = useAsyncCache<User>({
  fetcher: async (key) => {
    const res = await fetch(`/api/users/${key}`);
    return res.json();
  },
});
```

### 4. Lazy Loading & Code Splitting

**Files:**
- `lib/performance/lazyLoading.ts` - Dynamic imports
- `lib/performance/codeSplitting.ts` - Chunk optimization

**Features:**
- Dynamic module import tracking
- Route-based code splitting
- Component lazy loading
- Intersection observer for visibility-based loading
- Route prefetching
- Critical resource preloading
- Chunk size budgeting

**Usage:**

```typescript
import {
  dynamicImport,
  preloadRoute,
  createRoutePrefetcher,
  preloadCriticalResources
} from "@/lib/performance";

// Dynamic imports with tracking
const module = await dynamicImport(
  () => import("./heavy-module"),
  "HeavyModule"
);

// Route prefetching
const prefetcher = createRoutePrefetcher({
  "/dashboard": () => import("@/pages/dashboard"),
  "/reports": () => import("@/pages/reports"),
});

prefetcher.prefetch("/dashboard");

// Preload critical resources
preloadCriticalResources([
  { url: "/fonts/main.woff2", type: "font" },
  { url: "/css/critical.css", type: "style" },
]);
```

### 5. API Optimization

**Files:**
- `lib/api/optimization.ts` - Request optimization
- `hooks/useOptimizedAPI.ts` - React hook

**Features:**
- Request deduplication
- Request batching
- API memoization
- Connection pooling
- Automatic retry with backoff
- Cross-component caching

**Usage:**

```typescript
import { useOptimizedAPI } from "@/hooks";
import {
  RequestDeduplicator,
  APIMemoizer,
  ConnectionPool
} from "@/lib/api";

// Simple hook usage
const { data, loading, error, refetch } = useOptimizedAPI<User[]>(
  "/api/users",
  {
    deduplication: true,
    memoization: true,
    globalMemoization: true,
  }
);

// Or use directly
const deduplicator = new RequestDeduplicator();
const result = await deduplicator.execute(
  "/api/users",
  "GET",
  () => fetch("/api/users").then(r => r.json())
);
```

### 6. Image Optimization

**Files:**
- `lib/performance/imageOptimization.ts` - Image utilities
- `components/images/OptimizedImage.tsx` - React component

**Features:**
- Responsive image srcSet generation
- Multi-format support (AVIF, WebP, JPEG)
- Quality optimization
- Lazy loading with intersection observer
- Blur placeholder support
- Responsive breakpoints
- Image metrics tracking

**Usage:**

```typescript
import { OptimizedImage } from "@/components/images";
import {
  getResponsiveImageSrcSet,
  generatePictureElement
} from "@/lib/performance";

// Component usage
<OptimizedImage
  src="/images/profile.jpg"
  alt="User profile"
  width={400}
  height={400}
  quality={80}
  priority={false}
  trackMetrics={true}
  blurPlaceholder={true}
/>

// Utility usage
const srcSet = getResponsiveImageSrcSet("/images/photo.jpg");
const pictureHTML = generatePictureElement({
  src: "/images/photo.jpg",
  alt: "Photo",
  quality: 85,
});
```

## Performance Patterns

### Pattern 1: Component-Level Caching

```typescript
function ExpensiveComponent() {
  const { get, set } = useCache<Data>({
    ttl: 60000,
    strategy: "ttl",
  });

  useEffect(() => {
    const cached = get("component-data");
    if (!cached) {
      fetchData().then(data => set("component-data", data));
    }
  }, []);
}
```

### Pattern 2: Prefetching User Actions

```typescript
function NavigationMenu() {
  const prefetcher = createRoutePrefetcher({
    "/users": () => import("@/pages/users"),
    "/reports": () => import("@/pages/reports"),
  });

  const handleMouseEnter = (route: string) => {
    prefetcher.prefetch(route);
  };

  return (
    <nav onMouseEnter={() => handleMouseEnter("/users")}>
      {/* menu items */}
    </nav>
  );
}
```

### Pattern 3: Optimized List Rendering

```typescript
function UserList() {
  const { data, loading } = useOptimizedAPI<User[]>("/api/users", {
    memoization: true,
    deduplication: true,
  });

  return (
    <div>
      {data?.map(user => (
        <OptimizedImage
          key={user.id}
          src={user.avatar}
          alt={user.name}
          width={100}
          height={100}
          loading="lazy"
        />
      ))}
    </div>
  );
}
```

### Pattern 4: Error Recovery with Retry

```typescript
function DataFetcher() {
  const { data, error, refetch } = useOptimizedAPI(
    "/api/critical-data",
    {
      retry: true,
      maxRetries: 3,
      autoFetch: true,
    }
  );

  if (error) {
    return <button onClick={() => refetch()}>Retry</button>;
  }

  return <div>{data}</div>;
}
```

## Best Practices

### 1. Metrics & Monitoring

- ✅ Initialize performance monitoring on app startup
- ✅ Monitor Core Web Vitals continuously
- ✅ Set up alerts for performance regressions
- ✅ Track component-specific metrics
- ✅ Monitor API response times
- ❌ Don't record excessive custom metrics
- ❌ Don't ignore performance warnings

### 2. Bundle Optimization

- ✅ Code-split by route
- ✅ Lazy load non-critical components
- ✅ Remove unused dependencies
- ✅ Enable tree-shaking in production
- ✅ Monitor chunk sizes
- ❌ Don't ship vendor code in main bundle
- ❌ Don't lazy load critical path components

### 3. Caching

- ✅ Cache API responses with appropriate TTLs
- ✅ Use LRU caching for bounded memory
- ✅ Invalidate cache on data mutations
- ✅ Use global memoization for cross-component data
- ✅ Implement stale-while-revalidate for UX
- ❌ Don't cache user-sensitive data
- ❌ Don't use indefinite cache without invalidation

### 4. API Optimization

- ✅ Enable request deduplication
- ✅ Use API memoization
- ✅ Batch related requests
- ✅ Monitor connection pool utilization
- ✅ Implement request throttling
- ❌ Don't make duplicate API calls
- ❌ Don't ignore network errors

### 5. Images

- ✅ Use OptimizedImage component
- ✅ Lazy load below-fold images
- ✅ Use responsive srcSet
- ✅ Choose correct quality levels
- ✅ Use modern formats (WebP, AVIF)
- ❌ Don't lazy load above-fold images
- ❌ Don't use oversized images

## Performance Analysis

### Generate Performance Report

```typescript
import { getPerformanceReport } from "@/lib/performance";

const report = getPerformanceReport();
console.log(JSON.stringify(report, null, 2));
```

### Analyze Bundle Size

```typescript
import { getBundleSummary, exportBundleAnalysis } from "@/lib/performance";

console.log(getBundleSummary());

const analysis = exportBundleAnalysis();
// Save to file or send to monitoring service
```

### Check Image Performance

```typescript
import {
  analyzeImagePerformance,
  generateImageOptimizationReport
} from "@/lib/performance";

const perf = analyzeImagePerformance();
console.log(`${perf.optimizedImages}/${perf.totalImages} images optimized`);

console.log(generateImageOptimizationReport());
```

## Monitoring & Alerts

### Set Up Performance Alerts

```typescript
const { getHealthScore, metrics } = usePerformanceMonitor();

useEffect(() => {
  const score = getHealthScore();

  if (score < 50) {
    // Send alert to monitoring service
    sendAlert("Low performance score", { score, metrics });
  }
}, [metrics]);
```

### Track Metrics Over Time

```typescript
// In your analytics service
trackEvent("performance", {
  lcp: metrics.webVitals.find(v => v.name === "LCP")?.value,
  fid: metrics.webVitals.find(v => v.name === "FID")?.value,
  cls: metrics.webVitals.find(v => v.name === "CLS")?.value,
  timestamp: Date.now(),
});
```

## Configuration

### Performance Constants

Update `constants/performance.ts` to customize:

```typescript
export const WEB_VITALS_TARGETS = {
  LCP: 2500,  // 2.5s
  FID: 100,   // 100ms
  CLS: 0.1,   // 0.1 score
  // ...
};

export const PERFORMANCE_THRESHOLDS = {
  componentRender: 50,      // 50ms
  apiResponse: 1000,        // 1s
  componentRenderError: 100, // 100ms
  // ...
};

export const CACHE_CONFIG = {
  defaultTTL: 300000,       // 5 minutes
  maxCacheSize: 5242880,    // 5MB
  // ...
};
```

## Troubleshooting

### High LCP

1. Check image loading strategy
2. Analyze bundle size
3. Implement lazy loading
4. Check API response times

### High FID

1. Use requestIdleCallback for non-critical work
2. Split long tasks
3. Optimize JavaScript
4. Use Web Workers for heavy computation

### High CLS

1. Ensure images have dimensions
2. Use CSS containment
3. Avoid inserting DOM elements above fold
4. Use animations that don't trigger layout

## Resources

- [Web Vitals Guide](https://web.dev/vitals/)
- [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [Network Information API](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API)
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [Image Optimization Guide](https://nextjs.org/docs/basic-features/image-optimization)

## Advanced Topics

### Custom Performance Monitoring

```typescript
import { getMetricsCollector } from "@/lib/performance";

const collector = getMetricsCollector();

// Subscribe to all metrics
const unsubscribe = collector.subscribe((metric) => {
  console.log("New metric:", metric);
});

// Get metrics summary
const summary = collector.getSummary();

// Unsubscribe
unsubscribe();
```

### Building Custom Hooks

```typescript
function useComponentPerformance(componentName: string) {
  const { recordRenderMetric } = usePerformanceMonitor();
  const renderStartRef = useRef(performance.now());

  useEffect(() => {
    const renderTime = performance.now() - renderStartRef.current;
    recordRenderMetric(componentName, renderTime);
  }, []);
}
```

## Summary

The CDBL-LMS performance optimization system provides:

- 📊 Comprehensive metrics collection and monitoring
- 📦 Bundle analysis and code splitting tools
- 💾 Multi-strategy caching implementations
- 🚀 Lazy loading and dynamic imports
- 🌐 API optimization and deduplication
- 🖼️ Advanced image optimization
- 📈 Performance tracking and reporting
- ⚠️ Performance alerting and monitoring

Use these tools and patterns to maintain excellent application performance and user experience.
