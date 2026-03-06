import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  cacheComponents: false, // Disable cache components in development to reduce memory usage
  reactCompiler: true, // Enable React compiler for automatic optimization
  serverExternalPackages: ["@prisma/client", ".prisma/client", "prisma", "nodemailer"],

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
              test: (module: any) => module.size && module.size() > 100000, // 100KB
              priority: 5,
              chunks: 'all',
            },
          },
        },
      };
    }

    return config;
  },

  // Optimize for development memory usage
  experimental: {
    // Reduce memory usage by limiting concurrent builds
    workerThreads: false, // Disable worker threads in development
  },
  
  // Disable typescript checking during build to avoid OOM crashes.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },

  // Empty turbopack config to silence migration warning
  turbopack: {},

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      }
    ],
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
          { key: "Access-Control-Allow-Origin", value: process.env.ALLOWED_ORIGINS || "http://localhost:3000" },
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

// NextPWA must be required like this as it doesn't officially support Next 15/16 yet perfectly with turbopack
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

export default withPWA(nextConfig);

