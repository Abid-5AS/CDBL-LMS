/**
 * Custom React Testing Utilities
 *
 * Enhanced render function with providers and utilities
 */

import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Create a new QueryClient for testing
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Test providers wrapper
 */
function Providers({ children }: { children: React.ReactNode }) {
  const testQueryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  );
}

/**
 * Custom render function with providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: Providers, ...options });
}

/**
 * Re-export everything from React Testing Library
 */
export * from "@testing-library/react";

/**
 * Utility to wait for async operations
 */
export async function waitForAsync(ms: number = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Utility to render multiple elements
 */
export function renderMultiple(elements: ReactElement[]) {
  return elements.map((element, index) => (
    <div key={index} data-testid={`element-${index}`}>
      {element}
    </div>
  ));
}

/**
 * Mock data generators
 */
export const mockData = {
  user: (overrides = {}) => ({
    id: "user-1",
    name: "John Doe",
    email: "john@example.com",
    role: "employee" as const,
    ...overrides,
  }),

  leave: (overrides = {}) => ({
    id: "leave-1",
    userId: "user-1",
    type: "annual",
    startDate: "2024-01-01",
    endDate: "2024-01-05",
    status: "pending",
    ...overrides,
  }),

  dashboard: (overrides = {}) => ({
    totalLeaves: 20,
    usedLeaves: 5,
    pendingRequests: 2,
    upcomingLeaves: 3,
    ...overrides,
  }),
};
