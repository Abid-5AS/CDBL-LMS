import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  cacheComponents: false, // Disable cache components in development to reduce memory usage
  reactCompiler: false, // Disable React compiler in development to reduce memory usage
  serverExternalPackages: ["@prisma/client", "prisma"],

  // Development-specific optimizations for memory usage
  onDemandEntries: {
    // Reduce time to keep pages in memory
    maxInactiveAge: 60 * 1000, // 1 minute instead of default 25 seconds
    pagesBufferLength: 2, // Reduce pages buffer from default 2
  },

  // Webpack optimizations for development
  webpack: (config, { isServer, dev }) => {
    // Apply optimizations only in development
    if (dev && !isServer) {
      // Reduce memory usage during development
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: {
              minChunks: 1,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendors: {
              test: /[\\/]node_modules[\\/]/,
              priority: -10,
              chunks: 'all',
            },
            // Limit size of chunks to reduce memory
            largeChunks: {
              test: (module) => module.size() > 100000, // 100KB
              priority: 5,
              chunks: 'all',
            },
          },
        },
      };
    }

    // Server-side externals for Prisma
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        "@prisma/client",
        "prisma",
      ];
    }

    return config;
  },

  // Optimize for development memory usage
  experimental: {
    // Reduce memory usage by limiting concurrent builds
    workerThreads: false, // Disable worker threads in development
    maxWorkers: 1, // Limit to 1 worker in development
    // Disable incremental cache in development to save memory
    appDir: true,
    turbo: {
      // Turbopack configuration
      resolveAlias: {
        fs: { browser: "./empty.ts" },
      },
    },
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      // CORS headers for API routes - allows React Native app to connect
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: process.env.ALLOWED_ORIGINS || "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
          {
            key: "Access-Control-Allow-Headers",
            value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
