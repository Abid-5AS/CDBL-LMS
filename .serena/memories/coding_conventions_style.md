# CDBL Leave Management System - Coding Conventions & Style Guide

## TypeScript Configuration
- **Strict Mode**: Enabled (`"strict": true`)
- **Target**: ES2017
- **Module System**: ESNext with bundler resolution
- **JSX**: react-jsx transform
- **Path Aliases**: 
  - `@/*` for root directory
  - `@shared/*` for shared components
  - `@dash/*` for dashboard components

## Code Style & Conventions

### File Naming
- **Components**: PascalCase (e.g., `FileUploadSection.tsx`)
- **Utilities**: kebab-case (e.g., `date-utils.ts`)
- **API Routes**: kebab-case (e.g., `leave-requests.ts`)
- **Pages**: kebab-case directories with `page.tsx` files

### Component Conventions
- **Export Style**: Named exports preferred, default exports for pages
- **Props Interface**: Always define TypeScript interfaces for props
- **Component Structure**:
  ```typescript
  interface ComponentProps {
    // Props definition
  }

  export function ComponentName({ prop1, prop2 }: ComponentProps) {
    // Component logic
  }
  ```

### Import Organization
- **External libraries** first
- **Internal utilities** second  
- **Component imports** last
- **Type imports**: Use `type` keyword for type-only imports

### Error Handling
- **API Errors**: Zod validation for input validation
- **Client Errors**: Error boundaries and toast notifications
- **Database Errors**: Prisma error handling with proper logging

## Component Architecture

### UI Components (shadcn/ui pattern)
- **Variants**: Use `class-variance-authority` for component variants
- **Styling**: Tailwind CSS with `cn()` utility for merging classes
- **Composition**: Favor composition over inheritance
- **Props**: Use `React.ComponentProps` for extending HTML elements

### Business Components
- **Single Responsibility**: Each component has one clear purpose
- **Props Validation**: Zod schemas for complex prop validation
- **Error States**: Always handle loading and error states
- **Accessibility**: ARIA labels and semantic HTML

## ESLint Rules (Key Restrictions)

### Deprecated Component Imports (Enforced)
- **Banned Imports**: Old dashboard components are restricted
- **Pattern**: Must import from `@shared/*` or `@dash/*` for dashboard components
- **Specific Bans**:
  - `@/components/dashboard/LeaveTrendChart` → Use `@/components/shared/LeaveCharts/TrendChart`
  - `@/components/dashboard/LeaveTypePieChart` → Use `@/components/shared/LeaveCharts/TypePie`
  - Other legacy dashboard components similarly restricted

## Code Quality Standards

### Type Safety
- **No `any` types**: Use proper typing or `unknown`
- **Strict null checks**: Handle `null` and `undefined` explicitly
- **Generic constraints**: Use proper generic constraints
- **Utility types**: Leverage TypeScript utility types

### Performance
- **Server Components**: Use Server Components by default
- **Client Components**: Mark with `"use client"` only when necessary
- **Dynamic imports**: Lazy load heavy components
- **Memoization**: Use React.memo and useMemo judiciously

### Accessibility
- **Semantic HTML**: Use proper HTML elements
- **ARIA labels**: Add labels for screen readers
- **Keyboard navigation**: Ensure keyboard accessibility
- **Color contrast**: Follow WCAG guidelines