import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    exclude: ["tests/**/*.spec.ts", "node_modules"],
    environmentMatchGlobs: [
      // Use node environment for job tests to avoid date-fns-tz ESM import issues
      ["tests/jobs/**", "node"],
      ["tests/integration/**", "node"],
    ],
    setupFilesAfterEnv: {
      node: ["./tests/setup-node.ts"],
    },
  },
});
