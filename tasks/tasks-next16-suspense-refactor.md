# Tasks: Next.js 16 Suspense Refactor

## Objective

Refactor data fetching patterns to use Next.js 16 Suspense boundaries and cache components for optimal performance and loading states.

## Steps

### 1. Identify Async Data Fetching
- [ ] Audit all pages and components using Prisma/DB queries
- [ ] List all API routes that fetch data
- [ ] Identify components that can benefit from Suspense boundaries

### 2. Implement Suspense Boundaries
- [ ] Wrap async data fetching components in `<Suspense>` boundaries
- [ ] Create loading skeletons for each Suspense boundary
- [ ] Ensure proper error boundaries are in place

### 3. Refactor Server Components
- [ ] Convert client components to server components where possible
- [ ] Mark async server components with `"use cache"` directive
- [ ] Use `export const cache = "no-store"` for dynamic API routes

### 4. Update Specific Pages
- [ ] `/dashboard` - Wrap balance summary cards in Suspense
- [ ] `/employees/[id]` - Add Suspense for employee data
- [ ] `/approvals` - Add Suspense for pending approvals list
- [ ] `/leaves` - Add Suspense for leave history

### 5. Loading States
- [ ] Create reusable loading skeleton components
- [ ] Add fallback UI for each Suspense boundary
- [ ] Ensure smooth loading transitions

## Best Practices

- Always wrap Prisma/DB fetches in Suspense subcomponents
- Use server components for data fetching when possible
- Keep loading states consistent across the app
- Test loading states with slow network simulation
