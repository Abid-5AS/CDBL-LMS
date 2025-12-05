import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './badge';

const meta = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline', 'success', 'warning', 'info'],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Badge',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="info">Info</Badge>
    </div>
  ),
};

export const LeaveStatusBadges: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="warning">Pending</Badge>
      <Badge variant="success">Approved</Badge>
      <Badge variant="destructive">Rejected</Badge>
      <Badge variant="info">In Review</Badge>
      <Badge variant="secondary">Draft</Badge>
      <Badge variant="outline">Cancelled</Badge>
    </div>
  ),
};

export const WithCounts: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Pending Approvals:</span>
        <Badge variant="warning">12</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Team Members:</span>
        <Badge variant="info">24</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Leaves This Month:</span>
        <Badge variant="default">8</Badge>
      </div>
    </div>
  ),
};

export const LeaveTypes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Annual Leave</Badge>
      <Badge variant="info">Casual Leave</Badge>
      <Badge variant="warning">Sick Leave</Badge>
      <Badge variant="success">Maternity Leave</Badge>
      <Badge variant="secondary">Study Leave</Badge>
      <Badge variant="outline">Compensatory Leave</Badge>
    </div>
  ),
};

export const Priority: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Badge variant="destructive">High Priority</Badge>
        <span className="text-sm">Requires immediate attention</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="warning">Medium Priority</Badge>
        <span className="text-sm">Review within 24 hours</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="info">Low Priority</Badge>
        <span className="text-sm">Standard processing time</span>
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge className="text-[10px] px-2 py-0">Tiny</Badge>
      <Badge className="text-xs px-2.5 py-0.5">Small</Badge>
      <Badge>Default</Badge>
      <Badge className="text-sm px-3 py-1">Large</Badge>
    </div>
  ),
};

export const WithDot: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="success">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-white mr-1.5" />
        Active
      </Badge>
      <Badge variant="destructive">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-white mr-1.5" />
        Inactive
      </Badge>
      <Badge variant="warning">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-white mr-1.5" />
        Pending
      </Badge>
    </div>
  ),
};
