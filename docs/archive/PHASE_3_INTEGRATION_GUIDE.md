# Phase 3: Integration Guide

## Quick Start

Phase 3 components are now available for integration. This guide shows how to use them in your dashboards and components.

## Setup

The root layout has been updated with:
- `NotificationProvider` - Manages global notifications
- `ErrorBoundary` at page level - Catches app-wide errors
- `ToastContainer` - Displays notifications

No additional setup is required for these to work.

## Usage Patterns

### 1. Using Notifications (Toast Messages)

Display error, success, warning, or info notifications from anywhere in your app:

```typescript
"use client";

import { useNotification } from "@/context/NotificationContext";

export function MyComponent() {
  const { error, success, warning, info } = useNotification();

  async function handleAction() {
    try {
      const response = await fetch("/api/action", { method: "POST" });
      if (!response.ok) throw new Error("Action failed");

      success("Action completed successfully!");
    } catch (err) {
      error("Something went wrong. Please try again.");
    }
  }

  return <button onClick={handleAction}>Do Something</button>;
}
```

### 2. Using Retry Logic

Retry failed operations with automatic exponential backoff:

```typescript
"use client";

import { useRetry } from "@/hooks/useRetry";

export function DataDisplay() {
  const { data, error, isLoading, retry } = useRetry(
    () => fetch("/api/data").then(r => r.json()),
    { maxAttempts: 3 }
  );

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorCard error={error} onRetry={retry} />;

  return <DataView data={data} />;
}
```

### 3. Using Error Boundary for Sections

Wrap dashboard sections with error boundaries for isolated error handling:

```typescript
"use client";

import { ErrorBoundary } from "@/components/errors";
import { MySection } from "./MySection";

export function Dashboard() {
  return (
    <div className="space-y-6">
      <h1>Dashboard</h1>

      {/* Wrap sections with error boundary */}
      <ErrorBoundary level="section">
        <MySection />
      </ErrorBoundary>

      {/* Another section with different error handling */}
      <ErrorBoundary
        level="section"
        fallback={(error, reset) => (
          <div className="rounded-lg border border-red-200 p-4">
            <h3 className="font-semibold">Failed to load section</h3>
            <button onClick={reset} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
              Try again
            </button>
          </div>
        )}
      >
        <AnotherSection />
      </ErrorBoundary>
    </div>
  );
}
```

### 4. Using Skeleton Loaders

Display skeleton loaders while fetching data:

```typescript
"use client";

import { SkeletonGridKPI } from "@/components/loading";
import { DashboardSection } from "@/components/dashboards/shared";

export function MetricsSection() {
  const { data, isLoading } = useSWR("/api/metrics");

  return (
    <DashboardSection
      title="Key Metrics"
      description="Dashboard overview"
      isLoading={isLoading}
      loadingFallback={<SkeletonGridKPI count={4} />}
    >
      <ResponsiveDashboardGrid columns="2:2:4:4" gap="md">
        {data?.metrics.map(metric => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </ResponsiveDashboardGrid>
    </DashboardSection>
  );
}
```

### 5. Using Error Cards

Display errors inline with recovery options:

```typescript
"use client";

import { ErrorCard } from "@/components/errors";

export function DataTable() {
  const { data, error, refetch } = useSWR("/api/table");

  if (error) {
    return (
      <ErrorCard
        error={error}
        message="Failed to load table data"
        onRetry={refetch}
      />
    );
  }

  return <Table data={data} />;
}
```

### 6. Using Retry Button

Add a retry button for failed operations:

```typescript
"use client";

import { RetryButton } from "@/components/errors";

export function FailedAction() {
  const { mutate } = useSWRMutation("/api/action");

  return (
    <div className="flex gap-4">
      <p>Action failed</p>
      <RetryButton
        onRetry={() => mutate()}
        showAttempts
        maxAttempts={3}
      />
    </div>
  );
}
```

### 7. Error Recovery Hook

Track error recovery state and attempts:

```typescript
"use client";

import { useErrorRecovery } from "@/hooks/useErrorRecovery";

export function CriticalOperation() {
  const {
    error,
    isRecovering,
    recoveryAttempts,
    recover,
    getErrorMessage,
  } = useErrorRecovery(3);

  if (error) {
    return (
      <div>
        <p>{getErrorMessage()}</p>
        <button
          onClick={() => recover("retry")}
          disabled={isRecovering}
        >
          {isRecovering ? "Recovering..." : "Try Recovery"}
        </button>
      </div>
    );
  }

  return null;
}
```

## Common Patterns

### Pattern 1: Data Fetch with Full Error Handling

```typescript
export function DataComponent() {
  const { data, error, isLoading, retry } = useRetry(
    () => fetch("/api/data").then(r => r.json()),
    { maxAttempts: 3 }
  );

  if (isLoading) return <SkeletonCard />;
  if (error) return <ErrorCard error={error} onRetry={retry} />;

  return <DataDisplay data={data} />;
}
```

### Pattern 2: Section with Error Boundary and Loading

```typescript
export function Dashboard() {
  const { data, isLoading } = useSWR("/api/data");

  return (
    <ErrorBoundary level="section">
      <DashboardSection
        title="Section Title"
        isLoading={isLoading}
        loadingFallback={<SkeletonCard />}
      >
        <ContentDisplay data={data} />
      </DashboardSection>
    </ErrorBoundary>
  );
}
```

### Pattern 3: Notify User of Action Results

```typescript
export function ActionButton() {
  const { success, error } = useNotification();

  async function handleAction() {
    try {
      await performAction();
      success("Action completed!");
    } catch (err) {
      error("Action failed. Please try again.");
    }
  }

  return <button onClick={handleAction}>Perform Action</button>;
}
```

### Pattern 4: Async Form with Error Handling

```typescript
export function MyForm() {
  const { error: notifyError, success } = useNotification();
  const [error, setError] = useState<Error | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Submission failed");

      success("Form submitted successfully!");
      // Reset form...
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      notifyError("Form submission failed");
    }
  }

  return (
    <>
      {error && <ErrorCard error={error} />}
      <Form onSubmit={handleSubmit} />
    </>
  );
}
```

## Component API Reference

### useNotification Hook

```typescript
const {
  notifications,      // Notification[]
  error,             // (msg, opts?) => string (notification ID)
  success,           // (msg, opts?) => string
  warning,           // (msg, opts?) => string
  info,              // (msg, opts?) => string
  notify,            // (notification) => string
  dismiss,           // (id) => void
  clear,             // () => void
  setMaxNotifications, // (max) => void
} = useNotification();
```

### useRetry Hook

```typescript
const {
  data,          // T | null
  error,         // Error | null
  isLoading,     // boolean
  attempt,       // number (0-indexed)
  maxAttempts,   // number
  retry,         // () => Promise<void>
  reset,         // () => void
} = useRetry(
  async () => { /* function to retry */ },
  {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 16000,
    onRetry: (attempt) => { /* called on each retry */ }
  }
);
```

### useErrorRecovery Hook

```typescript
const {
  error,              // Error | null
  isRecovering,       // boolean
  recoveryAttempts,   // number
  isRecoverable,      // boolean
  suggestedAction,    // "retry" | "reload" | "reset" | "contact-support" | null
  setError,           // (err) => void
  recover,            // (action) => Promise<void>
  reset,              // () => void
  getErrorMessage,    // (fallback?) => string
  getErrorType,       // () => ErrorType
} = useErrorRecovery(maxAttempts);
```

### ErrorBoundary Component

```typescript
<ErrorBoundary
  level="page"           // "page" | "section" | "card"
  fallback={(error, reset) => <CustomFallback />}
  onError={(error, info) => { /* log error */ }}
  isDevelopment={true}   // show error details
>
  <YourComponent />
</ErrorBoundary>
```

### ErrorCard Component

```typescript
<ErrorCard
  error={error}
  message="Custom error message"
  onRetry={async () => { /* retry logic */ }}
  showRetry={true}
  level="error"    // "warning" | "error" | "critical"
/>
```

### Skeleton Components

```typescript
// Card skeleton
<SkeletonCard showHeader showIcon height={200} />
<SkeletonCardCompact />
<SkeletonCardWithImage />

// Grid skeletons
<SkeletonGrid count={4} columns="2:2:4:4" gap="md" />
<SkeletonGridKPI count={4} />
<SkeletonGridMetrics count={3} />
<SkeletonGridActions count={3} />
```

## Error Types

Errors are automatically categorized:

```typescript
enum ErrorType {
  NETWORK = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT_ERROR",
  SERVER = "SERVER_ERROR",
  CLIENT = "CLIENT_ERROR",
  VALIDATION = "VALIDATION_ERROR",
  UNAUTHORIZED = "UNAUTHORIZED_ERROR",
  FORBIDDEN = "FORBIDDEN_ERROR",
  NOT_FOUND = "NOT_FOUND_ERROR",
  RATE_LIMIT = "RATE_LIMIT_ERROR",
  UNKNOWN = "UNKNOWN_ERROR",
}
```

Each error type maps to a user-friendly message automatically.

## Retry Strategy

Exponential backoff with jitter:
- Attempt 1: ~1s delay
- Attempt 2: ~2s delay
- Attempt 3: ~4s delay
- Attempt N: min(exponential, max_delay) + random jitter

This prevents "thundering herd" problems when multiple clients retry simultaneously.

## Best Practices

1. **Use NotificationProvider for temporary feedback**
   - Success/error messages
   - Action confirmations
   - Warnings

2. **Use ErrorBoundary for rendering errors**
   - Catch component exceptions
   - Don't leave white screens
   - Provide recovery actions

3. **Use Skeletons for loading states**
   - Better UX than spinners
   - Matches final layout
   - Prevents layout shift

4. **Use Retry hooks for transient failures**
   - Network timeouts
   - Server errors (5xx)
   - Rate limiting (429)

5. **Don't retry non-recoverable errors**
   - Auth errors (401)
   - Permission errors (403)
   - Validation errors (400)

## Testing

To test error handling:

1. **Throw an error in a component**
   ```typescript
   {/* This will be caught by ErrorBoundary */}
   {shouldError && <UnstableComponent />}
   ```

2. **Simulate API failures**
   ```typescript
   // Mock failed fetch
   global.fetch = jest.fn(() =>
     Promise.reject(new Error("Network error"))
   );
   ```

3. **Test notifications**
   ```typescript
   const { success, error } = useNotification();
   success("Test message"); // Should appear in toast
   error("Error message");  // Should appear in toast
   ```

4. **Test retry logic**
   ```typescript
   let attempts = 0;
   const { retry } = useRetry(() => {
     attempts++;
     if (attempts < 3) throw new Error("Not yet");
     return { success: true };
   });

   await retry(); // Should retry automatically
   ```

## Migration Guide

To add Phase 3 to existing dashboards:

1. **Wrap section with ErrorBoundary**
   ```typescript
   <ErrorBoundary level="section">
     <YourSection />
   </ErrorBoundary>
   ```

2. **Add loading skeleton**
   ```typescript
   <DashboardSection
     isLoading={isLoading}
     loadingFallback={<SkeletonCard />}
   >
     {/* content */}
   </DashboardSection>
   ```

3. **Show error inline**
   ```typescript
   if (error) return <ErrorCard error={error} onRetry={refetch} />;
   ```

4. **Use notifications for feedback**
   ```typescript
   const { success, error } = useNotification();
   // Use in try/catch
   ```

5. **Retry failed requests**
   ```typescript
   const { data, retry } = useRetry(fetchFn);
   ```

## Performance Notes

- Error boundaries have minimal overhead
- Notifications use efficient reducer pattern
- Skeletons use CSS animations (60fps)
- Retry logic uses exponential backoff
- All components are memoized where beneficial

## Accessibility

- Error messages have `role="alert"`
- Notifications have `aria-live="polite"`
- Buttons are keyboard navigable
- Color is not sole conveyor of information
- WCAG AA contrast compliance

## Next Steps

- Phase 4: Color System Refinement
- Phase 5: Performance Optimization
- Phase 6: Accessibility Audit
- Phase 7: Mobile-First Enhancements
- Phase 8: Final Polish & Deployment
