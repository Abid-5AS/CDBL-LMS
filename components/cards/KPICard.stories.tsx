import type { Meta, StoryObj } from '@storybook/react';
import { KPICard, KPIGrid, KPICardSkeleton } from './KPICard';
import { Calendar, Users, Clock, TrendingUp, AlertCircle } from 'lucide-react';

const meta = {
  title: 'Cards/KPICard',
  component: KPICard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof KPICard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    title: 'Total Leaves',
    value: '24',
    subtext: 'Days available',
    icon: Calendar,
  },
};

export const WithProgress: Story = {
  args: {
    title: 'Annual Leave',
    value: '12',
    subtext: 'Days remaining',
    icon: Calendar,
    progress: {
      used: 8,
      total: 20,
      label: 'days',
    },
    status: 'healthy',
  },
};

export const WithTrend: Story = {
  args: {
    title: 'Team Utilization',
    value: '87%',
    icon: Users,
    trend: {
      value: '+12%',
      label: 'vs last month',
      direction: 'up',
    },
    status: 'healthy',
  },
};

export const LowStatus: Story = {
  args: {
    title: 'Casual Leave',
    value: '3',
    subtext: 'Days remaining',
    icon: Clock,
    progress: {
      used: 7,
      total: 10,
      label: 'days',
    },
    status: 'low',
  },
};

export const CriticalStatus: Story = {
  args: {
    title: 'Sick Leave',
    value: '1',
    subtext: 'Day remaining',
    icon: AlertCircle,
    progress: {
      used: 9,
      total: 10,
      label: 'days',
    },
    status: 'critical',
    badge: 'Low',
    badgeVariant: 'destructive',
  },
};

export const WithBadge: Story = {
  args: {
    title: 'Pending Requests',
    value: '5',
    icon: TrendingUp,
    badge: 'Action Required',
    badgeVariant: 'default',
  },
};

export const Clickable: Story = {
  args: {
    title: 'Total Employees',
    value: '142',
    icon: Users,
    onClick: () => alert('Card clicked!'),
  },
};

export const CustomAccentColor: Story = {
  args: {
    title: 'Accrued This Year',
    value: '18',
    subtext: 'Days earned',
    icon: Calendar,
    accentColor: 'bg-purple-500',
    progress: {
      used: 18,
      total: 24,
      label: 'days',
    },
  },
};

export const GridLayout: Story = {
  render: () => (
    <KPIGrid columns={3}>
      <KPICard
        title="Annual Leave"
        value="12"
        subtext="Days remaining"
        icon={Calendar}
        progress={{ used: 8, total: 20, label: 'days' }}
        status="healthy"
      />
      <KPICard
        title="Casual Leave"
        value="3"
        subtext="Days remaining"
        icon={Clock}
        progress={{ used: 7, total: 10, label: 'days' }}
        status="low"
      />
      <KPICard
        title="Sick Leave"
        value="1"
        subtext="Day remaining"
        icon={AlertCircle}
        progress={{ used: 9, total: 10, label: 'days' }}
        status="critical"
      />
      <KPICard
        title="Team Size"
        value="24"
        icon={Users}
        trend={{ value: '+3', label: 'this month', direction: 'up' }}
      />
      <KPICard
        title="Pending Approvals"
        value="7"
        icon={TrendingUp}
        badge="Action Required"
        badgeVariant="default"
      />
      <KPICard
        title="Utilization Rate"
        value="87%"
        icon={Users}
        trend={{ value: '+5%', label: 'vs last month', direction: 'up' }}
        status="healthy"
      />
    </KPIGrid>
  ),
};

export const LoadingState: Story = {
  render: () => (
    <KPIGrid columns={3}>
      <KPICardSkeleton />
      <KPICardSkeleton />
      <KPICardSkeleton />
    </KPIGrid>
  ),
};

export const AllStatuses: Story = {
  render: () => (
    <KPIGrid columns={3}>
      <KPICard
        title="Healthy Status"
        value="15"
        icon={Calendar}
        status="healthy"
        progress={{ used: 5, total: 20 }}
      />
      <KPICard
        title="Low Status"
        value="3"
        icon={Clock}
        status="low"
        progress={{ used: 7, total: 10 }}
      />
      <KPICard
        title="Critical Status"
        value="1"
        icon={AlertCircle}
        status="critical"
        progress={{ used: 9, total: 10 }}
      />
    </KPIGrid>
  ),
};
