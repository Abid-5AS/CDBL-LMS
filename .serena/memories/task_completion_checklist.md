# CDBL Leave Management System - Task Completion Checklist

## Before Completing Any Task

### Code Quality Checks
- [ ] **TypeScript Compilation**: Run `pnpm tsc --noEmit` to ensure no type errors
- [ ] **Linting**: Run `pnpm lint` to check for code style issues
- [ ] **ESLint Rules**: Ensure no restricted imports (legacy dashboard components)
- [ ] **File Organization**: Components in correct directories (`@shared/*` vs `@dash/*`)

### Testing Requirements
- [ ] **Unit Tests**: Run `pnpm test:unit` if components were modified
- [ ] **Integration Tests**: Run `pnpm test:integration` if API/business logic changed
- [ ] **Policy Compliance**: Run `pnpm policy:audit` if leave policy logic touched
- [ ] **Demo Data Integrity**: Run `pnpm verify:demo` if seed data modified

### Database Changes
- [ ] **Prisma Generation**: Run `pnpm prisma generate` after schema changes
- [ ] **Migration Creation**: Create migration with `pnpm prisma migrate dev --name <name>`
- [ ] **Seed Data Update**: Update `pnpm prisma:seed` if new data structures added

## Code Review Standards

### Component Development
- [ ] **Props Interface**: All components have TypeScript interfaces
- [ ] **Error Handling**: Components handle loading and error states
- [ ] **Accessibility**: ARIA labels and semantic HTML used
- [ ] **Performance**: Server Components used where possible
- [ ] **Styling**: Tailwind classes with `cn()` utility for merging

### API Development
- [ ] **Input Validation**: Zod schemas for request validation
- [ ] **Error Responses**: Consistent error response format
- [ ] **Type Safety**: Full TypeScript coverage
- [ ] **Authentication**: Proper JWT validation where needed
- [ ] **Role-based Access**: RBAC checks implemented

### Business Logic
- [ ] **Policy Compliance**: Changes align with CDBL leave policy v1.1
- [ ] **Workflow Integrity**: 4-step approval workflow maintained
- [ ] **Balance Calculations**: Leave balance logic is accurate
- [ ] **Audit Trail**: Changes are properly logged

## Deployment Readiness

### Production Checks
- [ ] **Build Success**: `pnpm build` completes without errors
- [ ] **Environment Variables**: Required env vars documented
- [ ] **Database Migrations**: All migrations applied and tested
- [ ] **Deployment Verification**: Run `pnpm verify:deployment`

### Security Considerations
- [ ] **Authentication**: JWT tokens properly secured
- [ ] **Authorization**: Role-based access controls verified
- [ ] **Input Sanitization**: User inputs properly validated
- [ ] **SQL Injection Prevention**: Prisma ORM used correctly

## Git Workflow

### Commit Standards
- [ ] **Commit Messages**: Follow conventional commit format
  - `feat:` for new features
  - `fix:` for bug fixes
  - `refactor:` for code refactoring
  - `docs:` for documentation changes
- [ ] **Change Scope**: Commits focused on single logical change
- [ ] **File Staging**: Only relevant files committed

### Branch Management
- [ ] **Feature Branches**: Work done on feature branches, not main
- [ ] **Clean History**: Commits are logical and well-documented
- [ ] **Merge Strategy**: Ready for merge to main branch

## Performance Considerations

### Frontend Performance
- [ ] **Bundle Size**: No unnecessary dependencies added
- [ ] **Server Components**: Leveraged where appropriate
- [ ] **Client Components**: Only used when interactivity needed
- [ ] **Image Optimization**: Next.js Image component used for images

### Backend Performance
- [ ] **Database Queries**: Optimized with proper indexing
- [ ] **N+1 Queries**: Avoided with Prisma include/select
- [ ] **Caching**: Appropriate caching strategies implemented
- [ ] **Background Jobs**: Long-running tasks moved to background

## Documentation Updates

### Code Documentation
- [ ] **Component Props**: JSDoc comments for complex components
- [ ] **API Endpoints**: Updated API documentation if changed
- [ ] **Business Logic**: Complex algorithms documented
- [ ] **Configuration**: New environment variables documented

### User-Facing Changes
- [ ] **Feature Documentation**: New features documented in `/docs`
- [ ] **Change Log**: Significant changes noted for stakeholders
- [ ] **Help Content**: User-facing help content updated if needed