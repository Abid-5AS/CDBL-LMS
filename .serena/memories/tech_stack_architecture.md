# CDBL Leave Management System - Technology Stack & Architecture

## Core Technology Stack

### Frontend
- **Framework**: Next.js 16.0.0 (App Router with React Server Components)
- **React**: 19.2.0 with React Compiler enabled
- **Language**: TypeScript 5.9.3 (strict mode enabled)
- **UI Library**: shadcn/ui components + Radix UI primitives
- **Styling**: Tailwind CSS 4.x
- **Animation**: Framer Motion 12.x + Motion 12.x
- **Form Management**: React Hook Form 7.x + Zod 4.x validation
- **State Management**: Zustand 5.x for global state, SWR 2.x for data fetching
- **Charts**: Recharts 3.x for data visualization
- **Icons**: Lucide React 0.546.0
- **Notifications**: Sonner 2.x (toast notifications)

### Backend
- **Framework**: Next.js 16 API Routes (Server Actions)
- **Database**: MySQL with Prisma ORM 6.17.1
- **Authentication**: JWT (jose 6.x) with HTTP-only cookies
- **Password Security**: bcryptjs 3.x for hashing
- **Validation**: Zod 4.x for runtime type validation

### Development & Build Tools
- **Build Tool**: Turbopack (integrated with Next.js)
- **Package Manager**: pnpm (lock file: pnpm-lock.yaml)
- **Linting**: ESLint 9.x with Next.js configuration
- **Testing**: 
  - Unit/Integration: Vitest 4.x
  - E2E: Playwright 1.49.0
- **Database Tooling**: Prisma CLI for migrations and seeding

### Additional Libraries
- **Date Handling**: date-fns 4.x + date-fns-tz 3.x + react-day-picker 9.x
- **3D Effects**: Three.js 0.181.0 (for UI enhancements)
- **Drag & Drop**: @dnd-kit suite (core, sortable, utilities)
- **Theme Support**: next-themes 0.4.6 for dark/light mode
- **Command Interface**: cmdk 1.1.1 for search/command palette
- **PDF Generation**: @react-pdf/renderer 4.3.1
- **Scheduling**: node-cron 4.2.1 for background jobs

## Architecture Patterns

### Directory Structure
- **App Router**: `/app` directory with Server Components by default
- **Components**: Organized by domain and reusability (`/components`)
- **Business Logic**: Centralized in `/lib` directory
- **Database**: Prisma schema and migrations in `/prisma`
- **Documentation**: Comprehensive docs in `/docs` directory

### Key Architectural Decisions
- **Server Components**: Leveraging React Server Components for performance
- **Type Safety**: Full TypeScript coverage with strict mode
- **Component Architecture**: shadcn/ui pattern with variant-based styling
- **State Management**: Minimal client state with server-first approach
- **Authentication**: Stateless JWT with secure cookie storage
- **Database**: Prisma ORM for type-safe database operations