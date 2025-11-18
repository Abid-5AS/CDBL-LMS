# Memory Optimization Guide

This project has been optimized for lower-memory development environments. Here are the key configurations and strategies implemented:

## Memory Optimization Settings

### Next.js Configuration (`next.config.ts`)

1. **Cache Components**: Disabled in development to reduce memory usage
2. **React Compiler**: Disabled in development to reduce memory usage
3. **On-Demand Entries**: Configured with reduced memory footprint:
   - `maxInactiveAge`: 60 seconds (reduced from default)
   - `pagesBufferLength`: 2 (reduced from default)
4. **Webpack Split Chunks**: Optimized to create smaller chunks and reuse existing code
5. **Worker Threads**: Disabled to limit concurrent processes
6. **Max Workers**: Limited to 1 to reduce memory consumption

### Package.json Scripts

Node.js memory limits have been configured in the package.json scripts:

- `dev`: `--max-old-space-size=4096` (4GB limit)
- `dev:low-memory`: `--max-old-space-size=2048 --optimize-for-size --always-opt` (2GB limit with optimizations)
- `build`: `--max-old-space-size=6144` (6GB limit for build process)
- `start`: `--max-old-space-size=4096` (4GB limit for production start)
- Job scripts: `--max-old-space-size=2048` (2GB limit for background jobs)

## Recommended Development Workflow

### For 8GB RAM Systems:
```bash
npm run dev
```

### For Systems with Less RAM (4GB):
```bash
npm run dev:low-memory
```

### Production Build:
```bash
npm run build
```

## Additional Memory-Saving Strategies

### 1. Selective Page Loading
- Only keep the pages you're working on in the development server
- Use the `onDemandEntries` settings to automatically unload inactive pages

### 2. Component Optimization
- Use React's `React.memo()` to prevent unnecessary re-renders
- Implement lazy loading for heavy components:
  ```javascript
  import { lazy, Suspense } from 'react';
  
  const HeavyComponent = lazy(() => import('./HeavyComponent'));
  
  function App() {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <HeavyComponent />
      </Suspense>
    );
  }
  ```

### 3. Optimize Images
- Use Next.js Image component with appropriate sizes
- Implement lazy loading for images
- Use modern formats like WebP when possible

### 4. Third-party Libraries
- Use tree-shaking to import only required functions:
  ```javascript
  // Good - imports only what you need
  import { format } from 'date-fns';
  
  // Avoid - imports entire library
  import * as dateFns from 'date-fns';
  ```

### 5. Prisma Optimization
- The configuration sets `serverExternalPackages` for `@prisma/client` to avoid bundling it in client bundles
- Use selective imports for Prisma operations

## Performance Monitoring

### Client-Side Metrics
The application includes performance monitoring tools in `lib/performance/monitoring.ts` that can track:

- Web Vitals (LCP, FID, CLS, FCP, TTFB)
- Memory usage (when available in the browser)
- Page load performance
- Network information
- Resource timing

### Configuration
Performance monitoring is configured in `constants/performance.ts` with the following key settings:

- Memory usage warnings when exceeding 100MB
- Memory usage errors when exceeding 200MB
- Regular monitoring intervals
- Development warnings for performance issues

## Troubleshooting High Memory Usage

If you still experience high memory usage:

1. Check for memory leaks in components by ensuring cleanup:
   ```javascript
   useEffect(() => {
     const timer = setTimeout(() => {
       // do something
     }, 1000);
     
     // Cleanup function
     return () => clearTimeout(timer);
   }, []);
   ```

2. Monitor memory usage in browser dev tools:
   - Chrome DevTools > Memory tab > Take heap snapshots
   - Look for detached DOM nodes or growing arrays/maps

3. Use the `dev:low-memory` script which includes additional Node.js optimizations

4. Consider running the development server with the `--turbo` flag for faster builds