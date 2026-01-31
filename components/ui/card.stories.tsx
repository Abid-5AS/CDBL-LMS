import type { Meta, StoryObj } from '@storybook/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from './card';
import { Button } from './button';
import { Badge } from './badge';
import { Calendar, Clock, User } from 'lucide-react';

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'elevated', 'outline', 'ghost', 'glass'],
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
    },
    interactive: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          This is the card content area. You can place any content here.
        </p>
      </CardContent>
    </Card>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card variant="default" className="w-full">
        <CardHeader>
          <CardTitle>Default</CardTitle>
          <CardDescription>Standard card variant</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Content goes here</p>
        </CardContent>
      </Card>

      <Card variant="elevated" className="w-full">
        <CardHeader>
          <CardTitle>Elevated</CardTitle>
          <CardDescription>Card with shadow</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Content goes here</p>
        </CardContent>
      </Card>

      <Card variant="outline" className="w-full">
        <CardHeader>
          <CardTitle>Outline</CardTitle>
          <CardDescription>Outlined card variant</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Content goes here</p>
        </CardContent>
      </Card>

      <Card variant="ghost" className="w-full">
        <CardHeader>
          <CardTitle>Ghost</CardTitle>
          <CardDescription>Minimal card variant</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Content goes here</p>
        </CardContent>
      </Card>

      <Card variant="glass" className="w-full">
        <CardHeader>
          <CardTitle>Glass</CardTitle>
          <CardDescription>Glassmorphism effect</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Content goes here</p>
        </CardContent>
      </Card>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Card size="sm" className="w-[350px]">
        <CardHeader>
          <CardTitle>Small Card</CardTitle>
          <CardDescription>Compact padding</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Content with less padding</p>
        </CardContent>
      </Card>

      <Card size="default" className="w-[350px]">
        <CardHeader>
          <CardTitle>Default Card</CardTitle>
          <CardDescription>Standard padding</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Content with default padding</p>
        </CardContent>
      </Card>

      <Card size="lg" className="w-[350px]">
        <CardHeader>
          <CardTitle>Large Card</CardTitle>
          <CardDescription>Spacious padding</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Content with extra padding</p>
        </CardContent>
      </Card>
    </div>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Leave Application</CardTitle>
        <CardDescription>Review and approve leave request</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>John Doe</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Dec 10-15, 2024</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>5 days</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="flex-1">
          Reject
        </Button>
        <Button className="flex-1">Approve</Button>
      </CardFooter>
    </Card>
  ),
};

export const Interactive: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card interactive className="w-full cursor-pointer">
        <CardHeader>
          <CardTitle>Annual Leave</CardTitle>
          <CardDescription>12 days remaining</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">12/20</div>
          <p className="text-xs text-muted-foreground mt-2">Click for details</p>
        </CardContent>
      </Card>

      <Card interactive variant="elevated" className="w-full cursor-pointer">
        <CardHeader>
          <CardTitle>Sick Leave</CardTitle>
          <CardDescription>3 days remaining</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">3/10</div>
          <p className="text-xs text-muted-foreground mt-2">Click for details</p>
        </CardContent>
      </Card>

      <Card interactive variant="outline" className="w-full cursor-pointer">
        <CardHeader>
          <CardTitle>Casual Leave</CardTitle>
          <CardDescription>5 days remaining</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">5/7</div>
          <p className="text-xs text-muted-foreground mt-2">Click for details</p>
        </CardContent>
      </Card>
    </div>
  ),
};

export const WithBadge: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <CardTitle>Leave Request</CardTitle>
            <CardDescription>Submitted 2 hours ago</CardDescription>
          </div>
          <Badge variant="warning">Pending</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Employee:</div>
            <div className="font-medium">Sarah Johnson</div>
            <div className="text-muted-foreground">Type:</div>
            <div className="font-medium">Annual Leave</div>
            <div className="text-muted-foreground">Duration:</div>
            <div className="font-medium">3 days</div>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

export const LeaveRequestCard: Story = {
  render: () => (
    <Card className="w-[400px]">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <CardTitle>Annual Leave Request</CardTitle>
            <CardDescription>Submitted on Dec 1, 2024</CardDescription>
          </div>
          <Badge variant="warning">Pending Review</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground mb-1">Employee</div>
              <div className="font-medium">Michael Chen</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Department</div>
              <div className="font-medium">Engineering</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Leave Type</div>
              <div className="font-medium">Annual Leave</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Duration</div>
              <div className="font-medium">5 days</div>
            </div>
          </div>
          <div className="text-sm">
            <div className="text-muted-foreground mb-1">Date Range</div>
            <div className="font-medium">Dec 20 - Dec 24, 2024</div>
          </div>
          <div className="text-sm">
            <div className="text-muted-foreground mb-1">Reason</div>
            <div className="text-sm">Family vacation during holidays</div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="outline" className="flex-1">
          Reject
        </Button>
        <Button className="flex-1">Approve</Button>
      </CardFooter>
    </Card>
  ),
};

export const NoPadding: Story = {
  render: () => (
    <Card padding="none" className="w-[350px] overflow-hidden">
      <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600" />
      <div className="p-6">
        <CardTitle className="mb-2">No Padding Card</CardTitle>
        <CardDescription>The card itself has no padding, but content does</CardDescription>
      </div>
    </Card>
  ),
};
