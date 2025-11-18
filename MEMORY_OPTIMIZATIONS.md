# Memory Optimization Guide

This project has been optimized for memory-efficient development, particularly for systems with limited RAM (like 8GB MacBooks). The optimizations help reduce memory usage during development and runtime.

## Optimizations Applied

### 1. Next.js Configuration
- Disabled `cacheComponents` in development to reduce memory usage
- Disabled `reactCompiler` in development to reduce memory usage
- Implemented on-demand entries with shorter retention times
- Configured webpack for optimized chunk splitting with memory limits
- Limited worker threads and concurrent operations

### 2. Package Scripts
- Added `dev:low-memory` script with optimized Node.js settings
- Set memory limits for all development and build processes
- Optimized build process with memory constraints

### 3. Performance Configuration
- Reduced cache TTLs to minimize memory footprint
- Limited maximum cache entries
- Disabled persistent caching to reduce memory usage
- Reduced bundle size thresholds
- Optimized API request batching and retry logic
- Limited image processing formats
- Maintained development warnings and console feedback for better DX

### 4. Monitoring Tools
- Added memory monitoring script to track usage during development
- Created memory analysis tool to identify potential issues
- Implemented memory-efficient metric collection
- Maintained essential development feedback while optimizing memory usage

## How to Use

### For Standard Development (4GB+ RAM)
```bash
npm run dev
```

### For Low-Memory Systems (2GB-4GB RAM)
```bash
npm run dev:low-memory
```

### To Monitor Memory Usage
```bash
# In a separate terminal, while dev server is running
npm run memory:monitor
```

### To Analyze Memory Issues
```bash
npm run memory:analyze
```

### To Test Optimizations
```bash
npm run memory:test
```

## Common Memory Issues Identified
- Effects without proper cleanup in 24 components
- Large dependency arrays in useMemo hooks
- Heavy dependencies that could be optimized with tree-shaking

## Development Best Practices for Memory Efficiency

1. Always clean up in useEffect hooks
2. Use React.memo() for frequently rendering components
3. Implement code splitting for large components
4. Use Next.js Image component with appropriate sizing
5. Optimize image formats and sizes
6. Use dynamic imports for heavy libraries
7. Implement proper state management without memory leaks

## Note on Developer Experience

While optimizing for memory usage, we've maintained essential development feedback:
- Development warnings are kept active
- Console logging for performance metrics is preserved
- Performance monitoring runs in development for feedback
- Only memory-intensive features without developer benefit were disabled

## Production Considerations
- Performance monitoring runs in both development and production
- Memory thresholds are adjusted for different environments
- Prefetching is disabled in development to save memory