# Storybook Setup

This project now has Storybook configured for developing and testing UI components in isolation.

## Running Storybook

```bash
pnpm storybook
```

This will start Storybook on `http://localhost:6006`

## Building Storybook

```bash
pnpm build-storybook
```

This creates a static build in the `storybook-static` folder.

## What's Configured

- ✅ **Next.js + Vite**: Fast builds with `@storybook/nextjs-vite`
- ✅ **Tailwind CSS**: Your global styles are imported automatically
- ✅ **Dark Mode**: Default background set to your dark theme (`#09090b`)
- ✅ **TypeScript**: Full TypeScript support
- ✅ **Addons**:
  - `@chromatic-com/storybook` - Visual testing
  - `@storybook/addon-a11y` - Accessibility testing
  - `@storybook/addon-docs` - Auto-generated documentation
  - `@storybook/addon-vitest` - Component testing integration

## Writing Stories

Stories are located next to your components with the `.stories.tsx` extension.

### Example: Simple Component Story

```tsx
// components/ui/button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: 'Click me',
    variant: 'default',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary',
    variant: 'secondary',
  },
};
```

### Example: Complex Component with Render Function

```tsx
// components/cards/LeaveCard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { LeaveCard } from './LeaveCard';

const meta = {
  title: 'Cards/LeaveCard',
  component: LeaveCard,
} satisfies Meta<typeof LeaveCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pending: Story = {
  render: () => (
    <LeaveCard
      request={{
        id: 1,
        type: 'ANNUAL',
        status: 'PENDING',
        startDate: new Date('2024-12-10'),
        endDate: new Date('2024-12-15'),
        reason: 'Family vacation',
      }}
    />
  ),
};
```

## Existing Stories

I've created two example stories for you:

1. **`components/ui/avatar.stories.tsx`** - Simple component with multiple variants
2. **`components/cards/KPICard.stories.tsx`** - Complex component with all features demonstrated

## Tips for Your Project

### 1. Mock Data
For components that need data (like dashboards), create mock data files:

```tsx
// components/dashboards/__mocks__/mockData.ts
export const mockLeaveRequests = [
  { id: 1, type: 'ANNUAL', status: 'PENDING', ... },
  { id: 2, type: 'SICK', status: 'APPROVED', ... },
];
```

Then use in stories:
```tsx
import { mockLeaveRequests } from '../__mocks__/mockData';

export const WithData: Story = {
  render: () => <Dashboard requests={mockLeaveRequests} />
};
```

### 2. Mock Next.js Router
If a component uses `useRouter` or `usePathname`:

```tsx
// .storybook/preview.ts
import { Preview } from '@storybook/nextjs-vite';

const preview: Preview = {
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/dashboard',
      },
    },
  },
};
```

### 3. Test Different States
Create stories for:
- Loading states
- Empty states
- Error states
- Different user roles
- Edge cases (0 days left, negative values, etc.)

### 4. Organize by Category
Use the `title` field to organize:
- `UI/Button` - Basic UI components
- `Cards/KPICard` - Card components
- `Dashboards/Employee` - Dashboard views
- `Forms/LeaveRequest` - Form components

## Benefits for Your Project

1. **Faster Development**: No need to navigate through the app to see a component
2. **Visual Regression Testing**: Catch UI bugs before they reach production
3. **Documentation**: Auto-generated docs for your team
4. **Accessibility**: Built-in a11y testing
5. **Design System**: See all components in one place

## Next Steps

1. Run `pnpm storybook` to see the example stories
2. Create stories for your most-used components (Buttons, Cards, Tables)
3. Add stories for different dashboard states
4. Share the Storybook URL with your team for design reviews

## Troubleshooting

### Component uses server-side features
If a component uses server actions or database calls, extract the UI part into a separate component:

```tsx
// Before
export default async function Dashboard() {
  const data = await fetchFromDB();
  return <div>{data}</div>;
}

// After
export function DashboardUI({ data }) {
  return <div>{data}</div>;
}

export default async function Dashboard() {
  const data = await fetchFromDB();
  return <DashboardUI data={data} />;
}
```

Now you can create stories for `DashboardUI` with mock data.

### Missing CSS
If styles don't load, check that `import '../app/globals.css'` is in `.storybook/preview.ts`.

### TypeScript Errors
Make sure `@storybook/nextjs-vite` is in your `devDependencies` and run `pnpm install`.
