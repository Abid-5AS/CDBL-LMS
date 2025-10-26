import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  reactCompiler: true,
  turbopack: {
    resolveAlias: {
      fs: { browser: "./empty.ts" },
    },
  },
};

export default nextConfig;
