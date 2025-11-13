# Code Patterns & Best Practices

This document outlines coding patterns, conventions, and best practices for the CDBL LMS application.

## File Structure & Naming

### Component Files

```
app/
├── dashboard/
│   ├── page.tsx              # Route page
│   └── components/
│       ├── DashboardClient.tsx
│       └── StatsCard.tsx
components/
├── ui/                        # shadcn components
│   ├── button.tsx
│   ├── input.tsx
│   └── index.ts              # Barrel export
└── shared/                    # Shared business components
    ├── LeaveBalancePanel.tsx
    └── EmptyState.tsx
```

### Naming Conventions

```tsx
// Components - PascalCase
DashboardClient.tsx
LeaveBalancePanel.tsx
UserProfile.tsx

// Utilities - camelCase
apiClient.ts
dateUtils.ts
formatters.ts

// Constants - UPPER_SNAKE_CASE
export const MAX_LEAVE_DAYS = 45;
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
```

## Component Patterns

### Client vs Server Components

```tsx
// ✅ Server Component (default in Next.js 13+)
// app/dashboard/page.tsx
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getCurrentUser(); // Can await directly

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
    </div>
  );
}

// ✅ Client Component (use when needed)
// app/dashboard/components/DashboardClient.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export function DashboardClient() {
  const [count, setCount] = useState(0);

  return (
    <Button onClick={() => setCount(count + 1)}>
      Count: {count}
    </Button>
  );
}
```

**When to use "use client":**
- useState, useEffect, or other React hooks
- Event handlers (onClick, onChange, etc.)
- Browser APIs (localStorage, window, etc.)
- Third-party libraries that use hooks

### Component Structure

```tsx
"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { Save } from "lucide-react";

// Types
interface MyComponentProps {
  title: string;
  onSave?: () => void;
  className?: string;
}

// Component
export function MyComponent({ title, onSave, className }: MyComponentProps) {
  // State
  const [loading, setLoading] = useState(false);

  // Handlers
  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave?.();
    } finally {
      setLoading(false);
    }
  };

  // Render
  return (
    <Card className={className}>
      <h2>{title}</h2>
      <Button onClick={handleSave} disabled={loading}>
        <Save className="size-5" />
        Save
      </Button>
    </Card>
  );
}
```

### Props Pattern

```tsx
// ✅ CORRECT - Explicit props interface
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}

export function CustomButton({ label, onClick, variant = "primary", disabled }: ButtonProps) {
  return <button onClick={onClick} disabled={disabled}>{label}</button>;
}

// ❌ WRONG - Inline types
export function CustomButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button onClick={onClick}>{label}</button>;
}
```

## Data Fetching Patterns

### Using SWR (Client-Side)

```tsx
"use client";

import useSWR from "swr";
import { apiFetcher } from "@/lib/apiClient";
import { Skeleton } from "@/components/ui";

interface LeaveData {
  id: string;
  type: string;
  status: string;
}

export function LeaveList() {
  const { data, error, isLoading } = useSWR<LeaveData[]>(
    "/api/leaves",
    apiFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  if (isLoading) {
    return <Skeleton className="h-64" />;
  }

  if (error) {
    return <Alert variant="destructive">Failed to load leaves</Alert>;
  }

  return (
    <div>
      {data?.map((leave) => (
        <div key={leave.id}>{leave.type}</div>
      ))}
    </div>
  );
}
```

### Server-Side Fetching

```tsx
// app/leaves/page.tsx
import { getLeaves } from "@/lib/api/leaves";

export default async function LeavesPage() {
  const leaves = await getLeaves();

  return (
    <div>
      {leaves.map((leave) => (
        <div key={leave.id}>{leave.type}</div>
      ))}
    </div>
  );
}
```

### API Route Pattern

```tsx
// app/api/leaves/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const leaves = await fetchLeaves(user.id);

    return NextResponse.json(leaves);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = await createLeave(user.id, body);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

## State Management

### Local State

```tsx
"use client";

import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <Button onClick={() => setCount(count + 1)}>
      Count: {count}
    </Button>
  );
}
```

### Form State

```tsx
"use client";

import { useState, FormEvent } from "react";
import { Button, Input, Label } from "@/components/ui";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Login failed");
      }

      // Success
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {error && (
        <Alert variant="destructive">{error}</Alert>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}
```

## Error Handling

### Try-Catch Pattern

```tsx
async function fetchData() {
  try {
    const response = await fetch("/api/data");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}
```

### Error Boundaries (Client)

```tsx
"use client";

import { Component, ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive">
          <AlertDescription>
            Something went wrong. Please refresh the page.
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}
```

## Conditional Rendering

### Boolean Conditions

```tsx
// ✅ CORRECT - Clear and explicit
{isLoading && <Skeleton className="h-64" />}
{!isLoading && data && <DataDisplay data={data} />}

// ✅ CORRECT - With ternary for either/or
{isLoading ? <Skeleton /> : <DataDisplay data={data} />}

// ❌ WRONG - Nested ternaries (hard to read)
{isLoading ? <Skeleton /> : error ? <Error /> : data ? <DataDisplay /> : null}

// ✅ CORRECT - Early returns or multiple conditions
if (isLoading) return <Skeleton />;
if (error) return <Error />;
if (!data) return <EmptyState />;
return <DataDisplay data={data} />;
```

### Empty States

```tsx
// ✅ CORRECT - Show empty state when no data
{data.length === 0 ? (
  <EmptyState
    icon={Inbox}
    title="No items"
    description="No items found"
  />
) : (
  <div>
    {data.map((item) => (
      <Card key={item.id}>{item.name}</Card>
    ))}
  </div>
)}
```

## Type Safety

### Type Definitions

```tsx
// ✅ CORRECT - Clear type definitions
interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
}

interface LeaveRequest {
  id: string;
  userId: string;
  type: "EARNED" | "CASUAL" | "MEDICAL";
  startDate: string;
  endDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

// ✅ CORRECT - Union types for status
type Status = "PENDING" | "APPROVED" | "REJECTED";

// ✅ CORRECT - Optional properties
interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: User["role"];
}
```

### Type Guards

```tsx
function isUser(obj: any): obj is User {
  return (
    typeof obj === "object" &&
    typeof obj.id === "string" &&
    typeof obj.name === "string" &&
    typeof obj.email === "string"
  );
}

// Usage
if (isUser(data)) {
  console.log(data.name); // TypeScript knows data is User
}
```

## Utility Functions

### Formatting Dates

```tsx
import { format, parseISO } from "date-fns";

export function formatDate(date: string | Date): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, "MMM dd, yyyy");
}

export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, "MMM dd, yyyy h:mm a");
}
```

### Class Name Utilities

```tsx
import { cn } from "@/lib/utils";

// ✅ CORRECT - Use cn() for conditional classes
<div className={cn(
  "base-class",
  isActive && "active-class",
  isDisabled && "disabled-class",
  className
)}>
  Content
</div>

// ❌ WRONG - String concatenation
<div className={`base-class ${isActive ? "active-class" : ""} ${className}`}>
  Content
</div>
```

## Performance Optimization

### Memoization

```tsx
import { useMemo, useCallback } from "react";

export function DataTable({ data }: { data: Item[] }) {
  // Memoize expensive calculations
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  // Memoize callbacks
  const handleClick = useCallback((id: string) => {
    console.log("Clicked:", id);
  }, []);

  return (
    <div>
      {sortedData.map((item) => (
        <div key={item.id} onClick={() => handleClick(item.id)}>
          {item.name}
        </div>
      ))}
    </div>
  );
}
```

### Code Splitting

```tsx
import dynamic from "next/dynamic";

// Lazy load heavy components
const HeavyChart = dynamic(() => import("./HeavyChart"), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false, // Disable SSR for client-only components
});

export function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <HeavyChart />
    </div>
  );
}
```

## Accessibility

### ARIA Attributes

```tsx
// ✅ CORRECT - Proper ARIA labels
<Button
  aria-label="Close dialog"
  aria-pressed={isPressed}
  aria-disabled={isDisabled}
>
  <X className="size-5" aria-hidden="true" />
</Button>

// ✅ CORRECT - Form accessibility
<Input
  id="email"
  type="email"
  required
  aria-required="true"
  aria-invalid={!!error}
  aria-describedby={error ? "email-error" : undefined}
/>
{error && (
  <p id="email-error" className="text-xs text-data-error">
    {error}
  </p>
)}
```

### Keyboard Navigation

```tsx
// ✅ CORRECT - Keyboard support for interactive elements
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  }}
>
  Clickable Card
</div>
```

## Common Patterns

### Loading Pattern

```tsx
if (isLoading) {
  return <Skeleton className="h-64" />;
}

if (error) {
  return (
    <Alert variant="destructive">
      <AlertDescription>
        Failed to load data. Please try again.
      </AlertDescription>
    </Alert>
  );
}

if (!data) {
  return <EmptyState title="No data" />;
}

return <DataDisplay data={data} />;
```

### Modal Pattern

```tsx
const [isOpen, setIsOpen] = useState(false);

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

### Toast Notifications

```tsx
import { toast } from "sonner";

// Success
toast.success("Leave request submitted successfully");

// Error
toast.error("Failed to submit leave request");

// Info
toast.info("Your request is being processed");

// Custom
toast.custom((t) => (
  <div className="bg-bg-primary border border-border-strong p-4 rounded-lg">
    Custom toast content
  </div>
));
```

## Code Style

### Imports Order

```tsx
// 1. React & Next.js
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// 2. Third-party libraries
import { toast } from "sonner";
import { format } from "date-fns";

// 3. Components
import { Button, Card, Input } from "@/components/ui";
import { EmptyState } from "@/components/shared/EmptyState";

// 4. Icons
import { Save, Trash, Edit } from "lucide-react";

// 5. Utilities & Types
import { cn } from "@/lib/utils";
import type { User, LeaveRequest } from "@/types";
```

### Constants

```tsx
// ✅ CORRECT - Define constants at top of file or in separate file
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = [".pdf", ".doc", ".docx"];

export function FileUpload() {
  // Use constants
  if (file.size > MAX_FILE_SIZE) {
    toast.error("File too large");
  }
}
```

## Testing Patterns

### Component Testing

```tsx
// MyComponent.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { MyComponent } from "./MyComponent";

describe("MyComponent", () => {
  it("renders correctly", () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText("Test")).toBeInTheDocument();
  });

  it("handles click events", () => {
    const handleClick = jest.fn();
    render(<MyComponent onClick={handleClick} />);

    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## Quick Reference

### Do's
- Use TypeScript for type safety
- Use semantic HTML elements
- Implement proper error handling
- Add loading states
- Use barrel exports (`@/components/ui`)
- Follow consistent naming conventions
- Add accessibility attributes
- Memoize expensive calculations
- Handle edge cases (empty, loading, error)

### Don'ts
- Don't use `any` type
- Don't ignore TypeScript errors
- Don't forget error boundaries
- Don't nest ternaries deeply
- Don't use inline styles unless necessary
- Don't skip accessibility
- Don't forget to cleanup effects
- Don't use deprecated patterns
