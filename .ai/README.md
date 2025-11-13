# AI Guidelines for CDBL LMS

This folder contains comprehensive guidelines for AI agents working on the CDBL Leave Management System. These documents ensure UI consistency, code quality, and adherence to established patterns when any AI agent (Claude, Cursor, Copilot, etc.) works on this codebase.

## 📚 Documentation Index

### [design-system.md](./design-system.md)
**Essential reference for all UI work**

Core design system documentation covering:
- Semantic color tokens (foreground, muted-foreground, bg-primary, etc.)
- Typography scale and font weights
- Spacing system and layout patterns
- Border radius standards
- Icon sizing and usage
- Dark mode support
- Common mistakes to avoid

**When to use:** Before making any UI changes, styling components, or working with colors.

### [components.md](./components.md)
**Component usage patterns and best practices**

Comprehensive component library documentation:
- Import patterns (barrel exports from `@/components/ui`)
- Core components (Button, Card, Input, etc.)
- Shared business components (LeaveBalancePanel, EmptyState)
- Component composition patterns
- Accessibility requirements
- Common use cases and examples

**When to use:** When adding or modifying components, creating forms, or building UI features.

### [animations.md](./animations.md)
**Animation patterns with Framer Motion**

Complete animation guide covering:
- Standard duration presets (fast, normal, slow)
- Common animation patterns (fade, slide, scale)
- Interactive animations (hover, tap effects)
- Loading states and skeletons
- Page transitions
- Performance best practices
- Accessibility (reduced motion)

**When to use:** When adding animations, transitions, or interactive effects to components.

### [patterns.md](./patterns.md)
**Code patterns and best practices**

Development patterns and conventions:
- File structure and naming conventions
- Component patterns (client vs server components)
- Data fetching patterns (SWR, server-side)
- State management
- Error handling
- Type safety with TypeScript
- Performance optimization
- Testing patterns

**When to use:** When writing new features, refactoring code, or making architectural decisions.

### [architecture.md](./architecture.md)
**System architecture and file organization**

High-level architecture documentation:
- Project structure overview
- Routing conventions (Next.js App Router)
- Component architecture patterns
- Data flow (server → client)
- API design patterns
- Authentication flow
- Role-based dashboards
- Database layer (Prisma)
- Build and deployment

**When to use:** When creating new features, understanding project structure, or making architectural changes.

## 🎯 Quick Start for AI Agents

When you start working on this project, follow this workflow:

### 1. Understand the Task
- Identify what type of change is needed (UI, feature, refactor, bug fix)
- Determine which files will be affected

### 2. Read Relevant Documentation
Based on the task type:
- **UI Changes:** Read `design-system.md` + `components.md`
- **New Feature:** Read `architecture.md` + `patterns.md`
- **Animations:** Read `animations.md`
- **Refactoring:** Read `patterns.md` + relevant sections

### 3. Follow Established Patterns
- Use semantic color tokens (NEVER arbitrary colors)
- Import from barrel exports (`@/components/ui`)
- Follow TypeScript patterns
- Add loading and error states
- Include accessibility attributes

### 4. Maintain Consistency
- Match existing code style
- Use established animation durations
- Follow naming conventions
- Keep similar features organized similarly

## ⚡ Critical Rules

### Always Do:
1. ✅ Use semantic color tokens (`text-foreground`, `text-muted-foreground`)
2. ✅ Import from barrel exports (`@/components/ui`)
3. ✅ Add loading states for all async operations
4. ✅ Handle errors gracefully
5. ✅ Include accessibility attributes (ARIA labels, keyboard support)
6. ✅ Use TypeScript types consistently
7. ✅ Follow established animation durations
8. ✅ Add empty states when data is missing
9. ✅ Use Framer Motion for animations
10. ✅ Respect dark mode (semantic tokens handle this)

### Never Do:
1. ❌ Use arbitrary Tailwind colors (`text-gray-600`, `bg-white`)
2. ❌ Use deprecated tokens (`text-text-primary`, `text-text-secondary`)
3. ❌ Import individual component files
4. ❌ Skip loading or error states
5. ❌ Ignore TypeScript errors
6. ❌ Use hardcoded colors or inline styles
7. ❌ Create custom components when UI library has alternatives
8. ❌ Forget accessibility attributes
9. ❌ Skip dark mode considerations
10. ❌ Over-animate (keep it subtle)

## 🎨 Design System Quick Reference

### Colors
```tsx
// Text
text-foreground              // Primary text
text-muted-foreground        // Secondary text
text-text-inverted           // On colored backgrounds

// Backgrounds
bg-bg-primary                // Cards, modals
bg-bg-secondary              // Skeleton, hover states

// Borders
border-border-strong         // Prominent borders
border-border                // Subtle borders

// Status
data-success                 // Green (approved, positive)
data-warning                 // Amber (pending, attention)
data-error                   // Red (rejected, errors)
data-info                    // Blue (information)

// Interactive
card-action                  // Primary CTAs, links
```

### Typography
```tsx
text-2xl font-semibold       // Page titles
text-lg font-semibold        // Section headers
text-base font-medium        // Card titles
text-sm                      // Body text
text-xs text-muted-foreground // Captions
```

### Spacing
```tsx
space-y-6                    // Between sections
space-y-4                    // Between cards
space-y-2                    // Between form fields
p-6                          // Card padding
gap-4                        // Grid gaps
```

### Animation Durations
```tsx
0.15s                        // Hover, focus, tap
0.35s                        // Modal, dropdown, card
0.5s                         // Page transitions
```

## 🔍 Common Tasks

### Adding a New Page
1. Create `app/[feature]/page.tsx`
2. Add server component for initial data fetch
3. Create client component in `app/[feature]/components/`
4. Add API route in `app/api/[feature]/route.ts`
5. Use `design-system.md` for styling
6. Follow patterns from `architecture.md`

### Creating a New Component
1. Check if shadcn/ui has it (`components.md`)
2. If custom, create in `components/shared/`
3. Use semantic color tokens
4. Add TypeScript types
5. Include loading and error states
6. Add accessibility attributes
7. Export from barrel if needed

### Adding Animations
1. Check `animations.md` for pattern
2. Use standard durations (0.15s, 0.35s, 0.5s)
3. Import from `framer-motion`
4. Keep animations subtle
5. Consider reduced motion preference

### Styling a Component
1. Read `design-system.md` color tokens
2. Use semantic tokens only
3. Add dark mode support automatically
4. Follow spacing patterns
5. Use consistent border radius
6. Add hover effects with proper transitions

## 📖 Documentation Structure

```
.ai/
├── README.md                 # This file - Overview and quick start
├── design-system.md          # Color tokens, typography, spacing
├── components.md             # Component usage patterns
├── animations.md             # Animation patterns with Framer Motion
├── patterns.md               # Code patterns and conventions
└── architecture.md           # System architecture and structure
```

## 🚀 Getting Started Checklist

Before making changes:
- [ ] Read task requirements carefully
- [ ] Identify which documentation files are relevant
- [ ] Review relevant sections thoroughly
- [ ] Check existing code for similar patterns
- [ ] Understand the component hierarchy
- [ ] Note any dependencies or related files

While working:
- [ ] Use semantic color tokens
- [ ] Follow established patterns
- [ ] Add loading and error states
- [ ] Include accessibility attributes
- [ ] Test in both light and dark modes
- [ ] Verify TypeScript types are correct
- [ ] Ensure animations are smooth and subtle

After completing:
- [ ] Verify all imports use barrel exports
- [ ] Check that colors are semantic (no gray-600, etc.)
- [ ] Confirm error handling is in place
- [ ] Test keyboard navigation
- [ ] Verify mobile responsiveness
- [ ] Review for consistency with existing code

## 💡 Best Practices Summary

### UI Consistency
- Always use semantic color tokens from `design-system.md`
- Follow spacing patterns (space-y-6, space-y-4, space-y-2)
- Use standard border radius (rounded-xl, rounded-lg)
- Apply consistent shadows (shadow-sm, shadow-lg)

### Code Quality
- Write TypeScript types for everything
- Use barrel exports for imports
- Handle all error cases
- Add loading states for async operations
- Write accessible HTML with ARIA attributes

### Performance
- Use server components by default
- Add `"use client"` only when needed
- Lazy load heavy components with `dynamic()`
- Optimize images with Next.js Image component
- Memoize expensive calculations

### User Experience
- Show loading feedback immediately
- Display helpful error messages
- Provide empty states when no data
- Add smooth animations (but keep subtle)
- Ensure keyboard navigation works
- Test in both light and dark modes

## 🔗 Related Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Lucide Icons](https://lucide.dev/)
- [TypeScript](https://www.typescriptlang.org/docs/)

## 📝 Contributing Guidelines

When you make changes:
1. Follow the patterns documented here
2. Maintain consistency with existing code
3. Update these docs if you introduce new patterns
4. Add comments for complex logic
5. Write clear commit messages

## ❓ FAQ

**Q: Can I use `text-gray-600` for secondary text?**
A: No. Always use `text-muted-foreground` for secondary text. This ensures proper dark mode support and consistency.

**Q: Should I create a custom button component?**
A: No. Use the existing `Button` component from `@/components/ui` with appropriate variants.

**Q: How do I add animations?**
A: Use Framer Motion with standard durations from `animations.md`. Start with 0.35s for most transitions.

**Q: Where should I put a new shared component?**
A: Components used across multiple features go in `components/shared/`. Feature-specific components stay in `app/[feature]/components/`.

**Q: Do I need to handle dark mode separately?**
A: No. Semantic color tokens automatically adapt to dark mode. Just use `text-foreground`, `bg-bg-primary`, etc.

**Q: How do I know if a component should be client or server?**
A: Use server components (default) unless you need hooks, event handlers, or browser APIs. Then add `"use client"`.

---

## 🎯 Remember

The goal is **consistency**. When in doubt:
1. Check existing code for similar patterns
2. Refer to relevant documentation files
3. Use semantic tokens instead of arbitrary values
4. Follow TypeScript patterns strictly
5. Test thoroughly before committing

These guidelines ensure that multiple AI agents can work on this codebase while maintaining a consistent, high-quality user experience.
