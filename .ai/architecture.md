# Architecture & File Structure

This document outlines the architecture, file organization, and structural patterns of the CDBL LMS application.

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui
- **Animations:** Framer Motion
- **Data Fetching:** SWR (client), Native fetch (server)
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod (validation)
- **Notifications:** Sonner
- **Date Handling:** date-fns

## Project Structure

```
cdbl-lms/
├── .ai/                         # AI guidelines (this folder)
├── app/                         # Next.js App Router
│   ├── (auth)/                  # Auth layout group
│   │   └── login/
│   │       ├── page.tsx         # Login page
│   │       └── components/
│   │           └── LoginForm.tsx
│   ├── api/                     # API routes
│   │   ├── auth/
│   │   ├── leaves/
│   │   └── balance/
│   ├── dashboard/               # Main routes
│   ├── leaves/
│   ├── employees/
│   ├── balance/
│   ├── settings/
│   ├── help/
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
├── components/
│   ├── ui/                      # shadcn components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── input-otp.tsx
│   │   └── index.ts            # Barrel export
│   ├── shared/                  # Shared business components
│   │   ├── LeaveBalancePanel.tsx
│   │   ├── EmptyState.tsx
│   │   └── skeletons.tsx
│   └── dashboards/              # Role-specific dashboards
│       ├── admin/
│       ├── manager/
│       ├── hod/
│       └── ceo/
├── lib/                         # Utilities & helpers
│   ├── animations.ts
│   ├── apiClient.ts
│   ├── auth.ts
│   ├── utils.ts
│   └── navigation.ts
├── hooks/                       # Custom React hooks
│   ├── useAuth.ts
│   └── useMediaQuery.ts
├── types/                       # TypeScript type definitions
│   ├── index.ts
│   └── api.ts
├── public/                      # Static assets
│   └── images/
├── prisma/                      # Database schema
│   └── schema.prisma
├── .env.local                   # Environment variables
├── tailwind.config.ts           # Tailwind configuration
├── tsconfig.json                # TypeScript configuration
└── package.json
```

## File Organization Principles

### 1. Colocation

Keep related files close together:

```
app/
└── leaves/
    ├── page.tsx                 # Main page
    ├── [id]/
    │   └── page.tsx            # Detail page
    └── components/
        ├── LeaveCard.tsx        # Used only in leaves
        └── LeaveFilters.tsx     # Used only in leaves
```

### 2. Shared Components

Components used across multiple features go in `components/shared/`:

```
components/
└── shared/
    ├── LeaveBalancePanel.tsx    # Used in multiple dashboards
    ├── EmptyState.tsx           # Used everywhere
    └── skeletons.tsx            # Loading states
```

### 3. UI Components

All shadcn/ui components live in `components/ui/`:

```
components/
└── ui/
    ├── button.tsx
    ├── card.tsx
    ├── input.tsx
    └── index.ts                 # Barrel export
```

## Routing Structure

### App Router (Next.js 14+)

```
app/
├── page.tsx                     # / (root)
├── dashboard/
│   └── page.tsx                 # /dashboard
├── leaves/
│   ├── page.tsx                 # /leaves
│   ├── new/
│   │   └── page.tsx            # /leaves/new
│   └── [id]/
│       ├── page.tsx            # /leaves/[id]
│       └── edit/
│           └── page.tsx        # /leaves/[id]/edit
├── employees/
│   ├── page.tsx                # /employees
│   └── [id]/
│       └── page.tsx            # /employees/[id]
└── api/
    ├── leaves/
    │   └── route.ts            # /api/leaves
    └── balance/
        └── route.ts            # /api/balance
```

### Route Groups

Use route groups for layout organization:

```
app/
├── (auth)/                      # Auth layout (no navbar)
│   ├── login/
│   └── layout.tsx
├── (dashboard)/                 # Dashboard layout (with navbar)
│   ├── dashboard/
│   ├── leaves/
│   └── layout.tsx
└── layout.tsx                   # Root layout
```

## Component Architecture

### Page Component

Server component by default:

```tsx
// app/dashboard/page.tsx
import { getCurrentUser } from "@/lib/auth";
import { DashboardClient } from "./components/DashboardClient";

export default async function DashboardPage() {
  // Server-side data fetching
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border-strong bg-bg-primary p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back, {user.name}
        </p>
      </section>

      <DashboardClient userId={user.id} />
    </div>
  );
}
```

### Client Component

Use when interactivity is needed:

```tsx
// app/dashboard/components/DashboardClient.tsx
"use client";

import { useState } from "react";
import useSWR from "swr";
import { apiFetcher } from "@/lib/apiClient";
import { Card, Button } from "@/components/ui";

interface DashboardClientProps {
  userId: string;
}

export function DashboardClient({ userId }: DashboardClientProps) {
  const [filter, setFilter] = useState("all");

  const { data, isLoading } = useSWR(
    `/api/leaves?userId=${userId}&filter=${filter}`,
    apiFetcher
  );

  if (isLoading) {
    return <DashboardGridSkeleton cards={4} />;
  }

  return (
    <div>
      <Button onClick={() => setFilter("pending")}>
        Show Pending
      </Button>
      {/* Rest of component */}
    </div>
  );
}
```

## Data Flow

### Server → Client Pattern

```
┌─────────────────┐
│   Page (Server) │  ← Fetches initial data
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Client Component│  ← Handles interactivity
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   API Route     │  ← Additional data
└─────────────────┘
```

### Example Flow

```tsx
// 1. Server Page
export default async function Page() {
  const initialData = await getInitialData();
  return <ClientComponent initialData={initialData} />;
}

// 2. Client Component
"use client";

export function ClientComponent({ initialData }) {
  const { data } = useSWR("/api/data", fetcher, {
    fallbackData: initialData, // Use server data initially
  });

  return <Display data={data} />;
}

// 3. API Route
export async function GET() {
  const data = await fetchFromDatabase();
  return NextResponse.json(data);
}
```

## API Design

### RESTful Conventions

```
GET    /api/leaves          # List all leaves
GET    /api/leaves/[id]     # Get single leave
POST   /api/leaves          # Create leave
PUT    /api/leaves/[id]     # Update leave
DELETE /api/leaves/[id]     # Delete leave

GET    /api/balance/mine    # Current user's balance
GET    /api/employees       # List employees
GET    /api/employees/[id]  # Get employee details
```

### API Route Structure

```tsx
// app/api/leaves/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

// GET /api/leaves
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get("filter");

    const leaves = await fetchLeaves(user.id, filter);

    return NextResponse.json(leaves);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/leaves
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    if (!body.type || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const leave = await createLeave(user.id, body);

    return NextResponse.json(leave, { status: 201 });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

## Authentication

### Auth Flow

```tsx
// lib/auth.ts
import { cookies } from "next/headers";

export async function getCurrentUser() {
  const token = cookies().get("session_token")?.value;

  if (!token) {
    return null;
  }

  try {
    const user = await validateToken(token);
    return user;
  } catch {
    return null;
  }
}

// Usage in page
export default async function ProtectedPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <div>Protected content for {user.name}</div>;
}
```

### Protected API Routes

```tsx
// app/api/protected/route.ts
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check role
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Continue with authorized request
  const data = await fetchAdminData();
  return NextResponse.json(data);
}
```

## Role-Based Dashboards

### Structure

```
components/
└── dashboards/
    ├── admin/
    │   ├── AdminDashboardClient.tsx
    │   └── components/
    │       ├── UserManagement.tsx
    │       └── SystemStats.tsx
    ├── manager/
    │   ├── ManagerDashboardClient.tsx
    │   └── components/
    │       ├── TeamLeaves.tsx
    │       └── PendingApprovals.tsx
    ├── hod/
    │   ├── HODDashboardClient.tsx
    │   └── components/
    ├── ceo/
    │   ├── CEODashboardClient.tsx
    │   └── components/
    └── employee/
        ├── EmployeeDashboardClient.tsx
        └── components/
```

### Dashboard Routing

```tsx
// app/dashboard/page.tsx
import { getCurrentUser } from "@/lib/auth";
import { AdminDashboardClient } from "@/components/dashboards/admin/AdminDashboardClient";
import { ManagerDashboardClient } from "@/components/dashboards/manager/ManagerDashboardClient";
import { EmployeeDashboardClient } from "@/components/dashboards/employee/EmployeeDashboardClient";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Render role-specific dashboard
  switch (user.role) {
    case "ADMIN":
      return <AdminDashboardClient />;
    case "MANAGER":
      return <ManagerDashboardClient />;
    case "EMPLOYEE":
      return <EmployeeDashboardClient />;
    default:
      return <EmployeeDashboardClient />;
  }
}
```

## Database Layer

### Prisma Schema

```prisma
// prisma/schema.prisma

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  role      Role     @default(EMPLOYEE)
  leaves    Leave[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Leave {
  id        String      @id @default(cuid())
  userId    String
  user      User        @relation(fields: [userId], references: [id])
  type      LeaveType
  status    LeaveStatus @default(PENDING)
  startDate DateTime
  endDate   DateTime
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  @@index([userId])
  @@index([status])
}

enum Role {
  ADMIN
  MANAGER
  HOD
  CEO
  EMPLOYEE
}

enum LeaveType {
  EARNED
  CASUAL
  MEDICAL
}

enum LeaveStatus {
  PENDING
  APPROVED
  REJECTED
}
```

## Environment Variables

```bash
# .env.local

# Database
DATABASE_URL="postgresql://..."

# Auth
SESSION_SECRET="random-secret-key"
JWT_SECRET="another-secret"

# Email (for OTP)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="noreply@example.com"
SMTP_PASS="password"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Configuration Files

### Tailwind Config

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic color tokens
        foreground: "hsl(var(--foreground))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        "bg-primary": "hsl(var(--bg-primary))",
        "bg-secondary": "hsl(var(--bg-secondary))",
        // ... other colors
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
```

### TypeScript Config

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## Performance Considerations

### Code Splitting

```tsx
// Lazy load heavy components
import dynamic from "next/dynamic";

const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false,
});
```

### Image Optimization

```tsx
import Image from "next/image";

<Image
  src="/avatar.jpg"
  alt="User avatar"
  width={40}
  height={40}
  className="rounded-full"
/>
```

### Font Optimization

```tsx
// app/layout.tsx
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

## Build & Deployment

### Build Command

```bash
npm run build
```

### Development

```bash
npm run dev
```

### Production

```bash
npm run start
```

## Architecture Principles

1. **Server-first:** Use server components by default
2. **Progressive enhancement:** Start with server, add client interactivity as needed
3. **Colocation:** Keep related files together
4. **Type safety:** Use TypeScript everywhere
5. **Component reusability:** Build generic, reusable components
6. **Separation of concerns:** Keep business logic separate from UI
7. **Error handling:** Handle errors at every layer
8. **Loading states:** Show loading feedback for all async operations
9. **Accessibility:** ARIA labels, keyboard navigation, semantic HTML
10. **Performance:** Code splitting, lazy loading, image optimization

## Quick Reference

### File Creation Checklist

When creating a new feature:

1. ✅ Create route in `app/[feature]/page.tsx`
2. ✅ Add client components in `app/[feature]/components/`
3. ✅ Create API routes in `app/api/[feature]/route.ts`
4. ✅ Add types in `types/`
5. ✅ Add shared components in `components/shared/` if reusable
6. ✅ Add utilities in `lib/` if needed
7. ✅ Update navigation in `lib/navigation.ts`
8. ✅ Add loading states
9. ✅ Add error handling
10. ✅ Test thoroughly

### Import Paths

```tsx
// Components
import { Button } from "@/components/ui";
import { EmptyState } from "@/components/shared/EmptyState";

// Utilities
import { cn } from "@/lib/utils";
import { apiFetcher } from "@/lib/apiClient";

// Types
import type { User } from "@/types";

// Icons
import { Calendar } from "lucide-react";
```
