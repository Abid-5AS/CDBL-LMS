import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';
import { Download, Mail, Plus, Trash2, ArrowRight, Loader2 } from 'lucide-react';

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'default', 'lg', 'xl', 'icon', 'icon-sm', 'icon-lg', 'icon-xl'],
    },
    loading: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Button',
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  ),
};

export const WithLeftIcon: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button leftIcon={<Plus />}>Create Leave</Button>
      <Button variant="outline" leftIcon={<Download />}>Export</Button>
      <Button variant="secondary" leftIcon={<Mail />}>Send Email</Button>
    </div>
  ),
};

export const WithRightIcon: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button rightIcon={<ArrowRight />}>Continue</Button>
      <Button variant="outline" rightIcon={<Download />}>Download Report</Button>
    </div>
  ),
};

export const IconButtons: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button size="icon-sm" variant="outline">
        <Plus />
      </Button>
      <Button size="icon">
        <Mail />
      </Button>
      <Button size="icon-lg" variant="secondary">
        <Download />
      </Button>
      <Button size="icon-xl" variant="destructive">
        <Trash2 />
      </Button>
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button loading>Loading</Button>
      <Button loading loadingText="Submitting...">
        Submit
      </Button>
      <Button variant="outline" loading>
        Processing
      </Button>
      <Button variant="secondary" loading leftIcon={<Mail />}>
        Sending
      </Button>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button disabled>Disabled</Button>
      <Button variant="outline" disabled>
        Disabled Outline
      </Button>
      <Button variant="destructive" disabled>
        Disabled Destructive
      </Button>
    </div>
  ),
};

export const DestructiveActions: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <Button variant="destructive">Delete Leave</Button>
        <Button variant="destructive" leftIcon={<Trash2 />}>
          Remove User
        </Button>
      </div>
      <div className="flex gap-4">
        <Button variant="outline" className="text-destructive hover:text-destructive">
          Cancel Request
        </Button>
      </div>
    </div>
  ),
};

export const LeaveManagementActions: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <Button leftIcon={<Plus />}>Apply for Leave</Button>
        <Button variant="outline" leftIcon={<Download />}>
          Export Leaves
        </Button>
      </div>
      <div className="flex gap-3">
        <Button variant="secondary">Approve</Button>
        <Button variant="destructive">Reject</Button>
        <Button variant="ghost">View Details</Button>
      </div>
    </div>
  ),
};

export const AllSizesAllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {(['default', 'destructive', 'outline', 'secondary', 'ghost'] as const).map((variant) => (
        <div key={variant} className="flex flex-col gap-2">
          <div className="text-sm font-semibold text-muted-foreground capitalize mb-2">
            {variant}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant={variant} size="xs">
              Extra Small
            </Button>
            <Button variant={variant} size="sm">
              Small
            </Button>
            <Button variant={variant} size="default">
              Default
            </Button>
            <Button variant={variant} size="lg">
              Large
            </Button>
            <Button variant={variant} size="xl">
              Extra Large
            </Button>
          </div>
        </div>
      ))}
    </div>
  ),
};
